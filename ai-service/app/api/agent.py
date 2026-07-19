"""Agent endpoint: runs a request through the compiled LangGraph graph."""

from __future__ import annotations

from fastapi import APIRouter, Request
from pydantic import BaseModel

router = APIRouter()


class AgentRequest(BaseModel):
    request: str
    subject: str | None = None
    chapter: str | None = None
    student_answers: list[dict] = []
    # Optional data-URL image (e.g. a photographed handwritten answer). When
    # present, a transcribe node converts it to text before marking/tutoring.
    image: str | None = None


@router.post("/v1/agent")
def run_agent(body: AgentRequest, request: Request) -> dict:
    graph = request.app.state.graph
    state = {
        "request": body.request,
        "subject": body.subject,
        "chapter": body.chapter,
        "student_answers": body.student_answers,
        "image": body.image,
    }
    result = graph.invoke(state)
    return {
        "intent": result.get("classified_intent"),
        "plan_executed": result.get("plan") == [],
        "answer": result.get("answer"),
        "quiz": result.get("quiz"),
        "marking": result.get("marking"),
        "visual": result.get("visual"),
        "transcription": result.get("transcription"),
        "sources": [c.get("source") for c in result.get("retrieved") or []],
        "error": result.get("error"),
    }
