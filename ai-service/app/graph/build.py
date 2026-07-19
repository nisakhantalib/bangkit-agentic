"""Assemble the agent graph.

Flow: supervisor decomposes the request into an ordered plan, then the graph
executes each step (retrieve -> tutor|quiz|mark), returning to the supervisor
after each step to pop the next one. Empty plan -> END.
"""

from __future__ import annotations

from functools import partial

from langgraph.graph import END, START, StateGraph

from app.graph.deps import GraphDeps
from app.graph.nodes import (
    mark_node,
    presenter_node,
    quiz_node,
    retrieve_node,
    transcribe_node,
    tutor_node,
    verify_node,
)
from app.graph.state import TutorState
from app.graph.supervisor import supervisor_node

_WORKER_FOR = {"tutor": "retrieve_tutor", "quiz": "retrieve_quiz", "mark": "retrieve_mark"}


def _dispatch(state: TutorState) -> str:
    plan = state.get("plan") or []
    if not plan:
        return END
    return _WORKER_FOR.get(plan[0], END)


def _advance_plan(state: TutorState) -> dict:
    """Pop the completed step; set next intent so the next dispatch routes correctly."""
    plan = list(state.get("plan") or [])
    if plan:
        plan.pop(0)
    return {"plan": plan, "intent": plan[0] if plan else None}


def _after_verify(state: TutorState) -> str:
    """Revise once when the answer is unsupported; otherwise advance.

    verify_attempts is incremented by verify_node itself, so "< 2" means: at
    most one revision (attempt 1 verdict -> revise, attempt 2 verdict -> accept
    whatever we have; availability beats perfection).
    """
    verification = state.get("verification") or {}
    unsupported = verification.get("checked") and not verification.get("supported")
    if unsupported and int(state.get("verify_attempts") or 0) < 2:
        return "revise"
    return "ok"


def build_graph(deps: GraphDeps):
    graph = StateGraph(TutorState)

    graph.add_node("supervisor", partial(supervisor_node, deps=deps))
    graph.add_node("transcribe", partial(transcribe_node, deps=deps))
    graph.add_node("advance", _advance_plan)

    # Each worker is a retrieve step chained to its producer, so context is fresh
    # for whichever step is running (a quiz step and a tutor step may differ in scope).
    graph.add_node("retrieve_tutor", partial(retrieve_node, deps=deps))
    graph.add_node("tutor", partial(tutor_node, deps=deps))
    graph.add_node("verify", partial(verify_node, deps=deps))
    graph.add_node("presenter", partial(presenter_node, deps=deps))
    graph.add_node("retrieve_quiz", partial(retrieve_node, deps=deps))
    graph.add_node("quiz", partial(quiz_node, deps=deps))
    graph.add_node("retrieve_mark", partial(retrieve_node, deps=deps))
    graph.add_node("mark", partial(mark_node, deps=deps))

    graph.add_edge(START, "supervisor")
    # Transcription (if an image was uploaded) runs once, after intent/scope are
    # known but before any worker: it may set student_answers or the request
    # text that retrieval and marking then consume.
    graph.add_edge("supervisor", "transcribe")
    graph.add_conditional_edges(
        "transcribe",
        _dispatch,
        {"retrieve_tutor": "retrieve_tutor", "retrieve_quiz": "retrieve_quiz",
         "retrieve_mark": "retrieve_mark", END: END},
    )

    graph.add_edge("retrieve_tutor", "tutor")
    graph.add_edge("retrieve_quiz", "quiz")
    graph.add_edge("retrieve_mark", "mark")

    # Tutor answers pass through fact-verification before advancing; one
    # unsupported verdict sends the step back for a single revision (bounded by
    # verify_attempts so a persistently failing check can never loop forever).
    graph.add_edge("tutor", "verify")
    # Verified answers flow through the presenter, which may attach one
    # schema-validated visual (diagram / table / slides) before advancing.
    graph.add_conditional_edges(
        "verify", _after_verify, {"revise": "tutor", "ok": "presenter"}
    )
    graph.add_edge("presenter", "advance")
    # Quiz and marking are schema-validated in their nodes; they advance directly.
    for worker in ("quiz", "mark"):
        graph.add_edge(worker, "advance")
    graph.add_conditional_edges(
        "advance",
        _dispatch,
        {"retrieve_tutor": "retrieve_tutor", "retrieve_quiz": "retrieve_quiz",
         "retrieve_mark": "retrieve_mark", END: END},
    )

    return graph.compile()
