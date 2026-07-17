"""Supervisor node: classify intent, extract scope, decompose into a plan.

This is the piece that makes the system *agentic* rather than a single LLM call:
a compound request ("revise chapter 1 then quiz me") is decomposed into an
ordered plan the graph executes step by step.
"""

from __future__ import annotations

import json
import re

from app.graph.deps import GraphDeps
from app.graph.state import TutorState

_SUPERVISOR_SYSTEM = (
    "You are the router for a Malaysian SPM study assistant. "
    "Given a student request, respond with ONLY a JSON object: "
    '{"intents": ["tutor"|"quiz"|"mark"], "subject": "sains"|"matematik"|null, '
    '"chapter": string|null}. '
    "Use multiple intents, in order, when the request has multiple steps."
)

_SUBJECT_HINTS = {
    "sains": ["sains", "science", "mikroorganisma", "nutrisi", "alam"],
    "matematik": ["matematik", "math", "ubahan", "matriks", "insurans"],
}


def _heuristic_scope(request: str) -> tuple[str | None, str | None]:
    lowered = request.lower()
    subject = None
    for subj, hints in _SUBJECT_HINTS.items():
        if any(h in lowered for h in hints):
            subject = subj
            break
    chapter_match = re.search(r"(?:chapter|bab)\s*(\d+)", lowered)
    chapter = chapter_match.group(1) if chapter_match else None
    return subject, chapter


def _parse_json(text: str) -> dict:
    cleaned = re.sub(r"```(?:json)?", "", text).strip()
    start, end = cleaned.find("{"), cleaned.rfind("}")
    if start >= 0 and end > start:
        return json.loads(cleaned[start : end + 1])
    raise ValueError("no JSON object in supervisor output")


def supervisor_node(state: TutorState, deps: GraphDeps) -> dict:
    request = state.get("request") or ""
    fallback_subject, fallback_chapter = _heuristic_scope(request)

    intents: list[str] = []
    # Caller-provided scope is authoritative; only infer what wasn't given.
    caller_subject = state.get("subject")
    caller_chapter = state.get("chapter")
    subject = caller_subject or fallback_subject
    chapter = caller_chapter or fallback_chapter

    try:
        text, _ = deps.complete(
            [
                {"role": "system", "content": _SUPERVISOR_SYSTEM},
                {"role": "user", "content": request},
            ],
            tier="fast",
        )
        parsed = _parse_json(text)
        intents = [i for i in parsed.get("intents", []) if i in {"tutor", "quiz", "mark"}]
        # Never let inference override an explicit caller value.
        subject = caller_subject or parsed.get("subject") or fallback_subject
        chapter = caller_chapter or parsed.get("chapter") or fallback_chapter
    except Exception:
        pass  # fall through to heuristics / caller values

    if not intents:
        intents = ["mark"] if state.get("student_answers") else ["tutor"]

    return {
        "intent": intents[0],
        "classified_intent": intents[0],
        "plan": intents,
        "subject": subject,
        "chapter": str(chapter) if chapter is not None else None,
    }
