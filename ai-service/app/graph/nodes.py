"""Worker nodes: retrieve, tutor, quiz generation, marking.

Each structured-output node validates against a Pydantic schema and retries once
with a repair prompt before degrading gracefully.
"""

from __future__ import annotations

import json
import re

from pydantic import ValidationError

from app.graph.deps import GraphDeps
from app.graph.state import TutorState
from app.schemas.quiz import MarkingResult, QuizSpec
from app.schemas.visual import VisualSpec


def _parse_json(text: str) -> dict:
    cleaned = re.sub(r"```(?:json)?", "", text).strip()
    start, end = cleaned.find("{"), cleaned.rfind("}")
    if start >= 0 and end > start:
        return json.loads(cleaned[start : end + 1])
    raise ValueError("no JSON object found")


def retrieve_node(state: TutorState, deps: GraphDeps) -> dict:
    query = state.get("request") or ""
    hits = deps.retriever.retrieve(
        query, k=6, subject=state.get("subject"), chapter=state.get("chapter")
    )
    retrieved = [{"text": h.text, "source": h.source, "score": h.score} for h in hits]
    return {"retrieved": retrieved}


def _context_block(state: TutorState) -> str:
    chunks = state.get("retrieved") or []
    if not chunks:
        return "(no curriculum context retrieved)"
    return "\n\n".join(f"[{c['source']}]\n{c['text']}" for c in chunks)


def tutor_node(state: TutorState, deps: GraphDeps) -> dict:
    system = (
        "You are an SPM tutor. Answer using ONLY the provided curriculum context. "
        "Cite the section you used. If the context does not cover the question, say so. "
        "Answer in the language of the student's question."
    )
    user = f"Context:\n{_context_block(state)}\n\nQuestion: {state.get('request')}"

    # On a verification-driven revision, include what failed so the second
    # attempt fixes the specific unsupported claims rather than re-rolling.
    feedback = state.get("verification_feedback")
    if feedback:
        user += (
            "\n\nYour previous answer contained claims not supported by the context: "
            f"{feedback}\nRewrite the answer using ONLY facts present in the context."
        )

    answer, _ = deps.complete(
        [{"role": "system", "content": system}, {"role": "user", "content": user}],
        tier="smart",
    )
    return {"answer": answer, "verification_feedback": None}


def _structured(deps: GraphDeps, system: str, user: str, model_cls):
    """Call the LLM, validate against model_cls, retry once with a repair prompt."""
    text, _ = deps.complete(
        [{"role": "system", "content": system}, {"role": "user", "content": user}],
        tier="smart",
    )
    try:
        return model_cls.model_validate(_parse_json(text)), None
    except (ValidationError, ValueError) as first_error:
        repair = (
            f"{user}\n\nYour previous reply was invalid: {first_error}. "
            "Reply with ONLY valid JSON matching the required schema."
        )
        text, _ = deps.complete(
            [{"role": "system", "content": system}, {"role": "user", "content": repair}],
            tier="smart",
        )
        try:
            return model_cls.model_validate(_parse_json(text)), None
        except (ValidationError, ValueError) as second_error:
            return None, str(second_error)


def quiz_node(state: TutorState, deps: GraphDeps) -> dict:
    system = (
        "You generate SPM quiz questions as JSON matching: "
        '{"subject","chapter","difficulty","questions":[{"question","type",'
        '"options","answer","explanation"}]}. Base questions on the context only.'
    )
    user = (
        f"Context:\n{_context_block(state)}\n\n"
        f"Generate 3 questions for subject={state.get('subject')} "
        f"chapter={state.get('chapter')}."
    )
    quiz, error = _structured(deps, system, user, QuizSpec)
    if quiz is None:
        return {"error": f"quiz generation failed: {error}"}
    return {"quiz": quiz.model_dump()}


def mark_node(state: TutorState, deps: GraphDeps) -> dict:
    system = (
        "You mark SPM answers as JSON matching: "
        '{"total_awarded","total_max","criteria":[{"criterion","awarded",'
        '"max_marks","comment"}],"model_answer","feedback"}. '
        "Mark strictly against the curriculum context."
    )
    user = (
        f"Context:\n{_context_block(state)}\n\n"
        f"Student answers: {json.dumps(state.get('student_answers') or [], ensure_ascii=False)}"
    )
    result, error = _structured(deps, system, user, MarkingResult)
    if result is None:
        return {"error": f"marking failed: {error}"}
    return {"marking": result.model_dump()}


def verify_node(state: TutorState, deps: GraphDeps) -> dict:
    """Fact-check the tutor's answer against the retrieved context.

    A schema-valid answer can still contain a claim the curriculum never made
    (hallucination). This node asks a fast model to judge support, and on
    failure emits feedback that drives one bounded revision of the tutor step.
    Fails open: if the verifier itself errors or returns junk, the answer
    passes through — verification improves quality, never availability.
    """
    system = (
        "You are a strict fact-checker. Given curriculum context and an answer, "
        "judge whether every factual claim in the answer is supported by the context. "
        'Respond ONLY with JSON: {"supported": true|false, '
        '"unsupported_claims": ["<claim>", ...]} — an empty list when supported.'
    )
    user = f"Context:\n{_context_block(state)}\n\nAnswer to check:\n{state.get('answer')}"
    attempts = int(state.get("verify_attempts") or 0)

    try:
        text, _ = deps.complete(
            [{"role": "system", "content": system}, {"role": "user", "content": user}],
            tier="fast",
        )
        verdict = _parse_json(text)
        supported = bool(verdict.get("supported", True))
        claims = [str(c) for c in (verdict.get("unsupported_claims") or [])]
    except Exception:
        # Verifier unavailable/unparseable -> pass the answer through unchanged.
        return {
            "verification": {"supported": True, "unsupported_claims": [], "checked": False},
            "verify_attempts": attempts + 1,
        }

    result = {
        "verification": {"supported": supported, "unsupported_claims": claims, "checked": True},
        "verify_attempts": attempts + 1,
    }
    if not supported and claims:
        result["verification_feedback"] = "; ".join(claims)
    return result


# ---- Presenter: adaptive output modality ----

# Explicit asks and content shapes that suggest a visual would aid learning.
_VISUAL_ASK = re.compile(
    r"\b(lukis|rajah|jadual|slaid|carta|peta minda|draw|diagram|table|slides?|chart|mind ?map|flow ?chart)\b",
    re.IGNORECASE,
)
_VISUAL_SHAPE = re.compile(
    r"(proses|kitaran|langkah|banding|beza|perbandingan|jenis-jenis|peringkat"
    r"|\bprocess\b|\bcycle\b|\bsteps?\b|\bstages?\b|\bcompare\b"
    r"|\bcomparison\b|\bversus\b|\bvs\b|\bdifference\b|\btypes of\b)",
    re.IGNORECASE,
)


def wants_visual(request: str, answer: str) -> bool:
    """Cost gate: only spend a presenter call when a visual plausibly helps.

    Fires when the student explicitly asked for one, or when the question/answer
    vocabulary suggests process/comparison/enumeration content — the shapes
    diagrams and tables actually serve.
    """
    text = f"{request or ''} {answer or ''}"
    return bool(_VISUAL_ASK.search(request or "") or _VISUAL_SHAPE.search(text))


def presenter_node(state: TutorState, deps: GraphDeps) -> dict:
    """Select and generate an output modality for the (verified) tutor answer.

    Runs only when wants_visual() fires. Emits schema-validated render
    instructions (Mermaid / table / slides) or nothing. Fails open: any model
    or validation failure means text-only, never an error.
    """
    request, answer = state.get("request") or "", state.get("answer") or ""
    if not answer or not wants_visual(request, answer):
        return {}

    system = (
        "You decide whether ONE visual would materially help a student understand the "
        "answer, and generate it. Respond ONLY with JSON matching this schema: "
        '{"kind": "none|diagram|table|slides", "mermaid": "...", '
        '"table": {"caption": "", "headers": [...], "rows": [[...]]}, '
        '"slides": {"title": "", "slides": [{"title": "", "bullets": [...]}]}} '
        "— include ONLY the payload matching kind. Rules: diagram = Mermaid "
        "(flowchart TD / mindmap / pie) for processes, cycles, hierarchies; "
        "table for comparisons; slides (2-6) only for revision summaries of a whole "
        "topic; kind=none when prose is already the best form. Use the language of "
        "the answer. Keep node labels short."
    )
    user = f"Question: {request}\n\nVerified answer:\n{answer}"
    spec, error = _structured(deps, system, user, VisualSpec)
    if error or spec is None or spec.kind == "none":
        return {}
    return {"visual": spec.model_dump(exclude_none=True)}


# ---- Multimodal input: image transcription ----

# Cap the accepted image so a hostile/huge upload can't blow past model limits
# or memory. ~7MB of base64 ≈ ~5MB raw, comfortably above a phone photo.
_MAX_IMAGE_B64 = 7_000_000


def _looks_like_image_data_url(image: str) -> bool:
    return isinstance(image, str) and image.startswith("data:image/") and ";base64," in image


def transcribe_node(state: TutorState, deps: GraphDeps) -> dict:
    """Read text from an uploaded image (e.g. a handwritten SPM answer).

    Runs only when the request carries an image. Sends the image to a
    vision-tier model and asks for a faithful transcription — nothing more:
    marking happens downstream on the *text*, so this node's single job is
    pixels -> text. The transcription is stored (and surfaced to the student
    for correction) and, for a marking request, seeded as the student's answer.

    Fails open: an oversized/invalid image or a vision-model failure leaves the
    pipeline to proceed on whatever text was typed, never erroring out.
    """
    image = state.get("image")
    if not image:
        return {}
    if not _looks_like_image_data_url(image) or len(image) > _MAX_IMAGE_B64:
        return {"transcription": None}

    system = (
        "You transcribe exam answers from images. Output ONLY the text visible "
        "in the image, verbatim, preserving line breaks and any working shown. "
        "Do not solve, correct, translate, or comment. If a word is illegible, "
        "write [?]. If the image contains no readable text, output exactly: (no text found)."
    )
    # Groq/OpenAI-style multimodal content: a text part plus an image_url part.
    content = [
        {"type": "text", "text": "Transcribe the handwritten answer in this image."},
        {"type": "image_url", "image_url": {"url": image}},
    ]

    try:
        text, _ = deps.complete(
            [
                {"role": "system", "content": system},
                {"role": "user", "content": content},
            ],
            tier="vision",
        )
    except Exception:
        # Vision unavailable -> continue with typed text (if any), no crash.
        return {"transcription": None}

    transcription = (text or "").strip()
    if not transcription or transcription == "(no text found)":
        return {"transcription": None}

    updates: dict = {"transcription": transcription}
    # For a marking request with no typed answer, use the transcription as the
    # student's answer so the existing marker grades it unchanged.
    if state.get("intent") == "mark" and not state.get("student_answers"):
        updates["student_answers"] = [{"answer": transcription}]
    # For a tutor/quiz request, fold the transcribed question into the request
    # so retrieval and answering operate on it.
    elif not state.get("request"):
        updates["request"] = transcription
    return updates
