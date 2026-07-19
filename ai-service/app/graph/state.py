"""Shared state schema threaded through the agent graph."""

from __future__ import annotations

from typing import Annotated, Literal, Optional, TypedDict

from langgraph.graph.message import add_messages

Intent = Literal["tutor", "quiz", "mark", "chitchat"]


class TutorState(TypedDict, total=False):
    messages: Annotated[list, add_messages]
    request: str
    intent: Optional[Intent]
    classified_intent: Optional[Intent]
    plan: list[str]
    subject: Optional[str]
    chapter: Optional[str]
    retrieved: list[dict]
    answer: Optional[str]
    quiz: Optional[dict]
    marking: Optional[dict]
    student_answers: list[dict]
    error: Optional[str]
    # Verification loop (tutor answers only): result of the check, feedback fed
    # into a bounded single revision, and the attempt counter that bounds it.
    verification: Optional[dict]
    verification_feedback: Optional[str]
    verify_attempts: int
    # Optional schema-validated render instructions from the presenter node.
    visual: Optional[dict]
