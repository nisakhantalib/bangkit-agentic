"""Integration tests for the agent graph using fake LLM + retriever.

No network: the LLM is a scripted fake keyed on intent, so we can assert routing,
plan execution, and schema validation deterministically.
"""

from __future__ import annotations

import json

from app.graph.build import build_graph
from app.graph.deps import GraphDeps


class FakeRetriever:
    def retrieve(self, query, k=6, subject=None, chapter=None):
        from app.rag.retriever import RetrievedChunk

        return [
            RetrievedChunk(
                text="Mikroorganisma ialah organisma seni.",
                source="Bab 1: Mikroorganisma > 1.1",
                score=0.9,
                metadata={"subject": subject or "sains", "chapter": chapter or "1"},
            )
        ]


def make_complete(script):
    """script: fn(messages, tier) -> text. Returns a (text, model) callable + call log."""
    calls = []

    def complete(messages, tier="smart", **kwargs):
        calls.append((messages, tier))
        return script(messages, tier), "fake-model"

    complete.calls = calls
    return complete


def _system_of(messages):
    return next((m["content"] for m in messages if m["role"] == "system"), "")


def test_tutor_flow_routes_and_grounds():
    def script(messages, tier):
        sys = _system_of(messages)
        if "router" in sys:
            return json.dumps({"intents": ["tutor"], "subject": "sains", "chapter": "1"})
        return "Mikroorganisma ialah organisma seni. [Bab 1: Mikroorganisma > 1.1]"

    deps = GraphDeps(complete=make_complete(script), retriever=FakeRetriever())
    out = build_graph(deps).invoke({"request": "Apakah mikroorganisma?"})
    assert out["intent"] == "tutor" or out["plan"] == []
    assert "Mikroorganisma" in out["answer"]


def test_quiz_flow_validates_schema():
    quiz_json = json.dumps({
        "subject": "sains", "chapter": "1", "difficulty": "beginner",
        "questions": [{"question": "Apakah bakteria?", "type": "objective",
                       "options": ["A", "B"], "answer": "A", "explanation": "x"}],
    })

    def script(messages, tier):
        sys = _system_of(messages)
        if "router" in sys:
            return json.dumps({"intents": ["quiz"], "subject": "sains", "chapter": "1"})
        return quiz_json

    deps = GraphDeps(complete=make_complete(script), retriever=FakeRetriever())
    out = build_graph(deps).invoke({"request": "Quiz me on chapter 1 sains"})
    assert out["quiz"]["questions"][0]["answer"] == "A"


def test_quiz_repair_on_first_invalid_output():
    good = json.dumps({
        "subject": "sains", "chapter": "1", "difficulty": "beginner",
        "questions": [{"question": "Q?", "answer": "A"}],
    })
    state = {"n": 0}

    def script(messages, tier):
        sys = _system_of(messages)
        if "router" in sys:
            return json.dumps({"intents": ["quiz"], "subject": "sains", "chapter": "1"})
        state["n"] += 1
        return "not json at all" if state["n"] == 1 else good  # repair on 2nd call

    deps = GraphDeps(complete=make_complete(script), retriever=FakeRetriever())
    out = build_graph(deps).invoke({"request": "quiz sains chapter 1"})
    assert "quiz" in out and out["quiz"]["questions"][0]["answer"] == "A"


def test_multi_step_plan_executes_both():
    quiz_json = json.dumps({
        "subject": "sains", "chapter": "1", "difficulty": "beginner",
        "questions": [{"question": "Q?", "answer": "A"}],
    })

    def script(messages, tier):
        sys = _system_of(messages)
        if "router" in sys:
            return json.dumps({"intents": ["tutor", "quiz"], "subject": "sains", "chapter": "1"})
        if "quiz" in sys:
            return quiz_json
        return "Here is the explanation. [Bab 1]"

    deps = GraphDeps(complete=make_complete(script), retriever=FakeRetriever())
    out = build_graph(deps).invoke({"request": "Explain chapter 1 then quiz me"})
    assert out["answer"] and out["quiz"]  # both steps produced output
    assert out["plan"] == []  # plan fully consumed
