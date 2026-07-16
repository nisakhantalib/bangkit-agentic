"""Assemble the agent graph.

Flow: supervisor decomposes the request into an ordered plan, then the graph
executes each step (retrieve -> tutor|quiz|mark), returning to the supervisor
after each step to pop the next one. Empty plan -> END.
"""

from __future__ import annotations

from functools import partial

from langgraph.graph import END, START, StateGraph

from app.graph.deps import GraphDeps
from app.graph.nodes import mark_node, quiz_node, retrieve_node, tutor_node
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


def build_graph(deps: GraphDeps):
    graph = StateGraph(TutorState)

    graph.add_node("supervisor", partial(supervisor_node, deps=deps))
    graph.add_node("advance", _advance_plan)

    # Each worker is a retrieve step chained to its producer, so context is fresh
    # for whichever step is running (a quiz step and a tutor step may differ in scope).
    graph.add_node("retrieve_tutor", partial(retrieve_node, deps=deps))
    graph.add_node("tutor", partial(tutor_node, deps=deps))
    graph.add_node("retrieve_quiz", partial(retrieve_node, deps=deps))
    graph.add_node("quiz", partial(quiz_node, deps=deps))
    graph.add_node("retrieve_mark", partial(retrieve_node, deps=deps))
    graph.add_node("mark", partial(mark_node, deps=deps))

    graph.add_edge(START, "supervisor")
    graph.add_conditional_edges(
        "supervisor",
        _dispatch,
        {"retrieve_tutor": "retrieve_tutor", "retrieve_quiz": "retrieve_quiz",
         "retrieve_mark": "retrieve_mark", END: END},
    )

    graph.add_edge("retrieve_tutor", "tutor")
    graph.add_edge("retrieve_quiz", "quiz")
    graph.add_edge("retrieve_mark", "mark")

    # After each worker, advance the plan and loop back to dispatch the next step.
    for worker in ("tutor", "quiz", "mark"):
        graph.add_edge(worker, "advance")
    graph.add_conditional_edges(
        "advance",
        _dispatch,
        {"retrieve_tutor": "retrieve_tutor", "retrieve_quiz": "retrieve_quiz",
         "retrieve_mark": "retrieve_mark", END: END},
    )

    return graph.compile()
