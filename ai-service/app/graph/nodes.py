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
    answer, _ = deps.complete(
        [{"role": "system", "content": system}, {"role": "user", "content": user}],
        tier="smart",
    )
    return {"answer": answer}


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
