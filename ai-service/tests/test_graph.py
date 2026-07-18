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


def test_caller_scope_survives_supervisor_override():
    """Explicit subject/chapter from the caller must not be overwritten by the LLM."""
    import json as _json

    def script(messages, tier):
        sys = _system_of(messages)
        if "router" in sys:
            # LLM tries to say something different from the caller
            return _json.dumps({"intents": ["tutor"], "subject": "matematik", "chapter": "9"})
        return "Grounded answer. [Bab 1]"

    captured = {}

    class ScopeCapturingRetriever(FakeRetriever):
        def retrieve(self, query, k=6, subject=None, chapter=None):
            captured["subject"] = subject
            captured["chapter"] = chapter
            return super().retrieve(query, k=k, subject=subject, chapter=chapter)

    deps = GraphDeps(complete=make_complete(script), retriever=ScopeCapturingRetriever())
    build_graph(deps).invoke({"request": "Apa itu mikroorganisma?", "subject": "sains", "chapter": "1"})
    assert captured["subject"] == "sains"  # not "matematik"
    assert captured["chapter"] == "1"      # not "9"


# ---- Verification loop ----

def _verify_script(verdicts):
    """Script a run: supervisor -> tutor -> verifier (popping verdicts in order)."""
    remaining = list(verdicts)

    def script(messages, tier):
        sys = _system_of(messages)
        if "router" in sys:
            return json.dumps({"intents": ["tutor"], "subject": "sains", "chapter": "1"})
        if "fact-checker" in sys:
            return json.dumps(remaining.pop(0))
        return "Mikroorganisma ialah organisma seni. [Bab 1 > 1.1]"

    return script


def _tutor_calls(complete):
    return [
        (m, t) for m, t in complete.calls
        if "SPM tutor" in _system_of(m)
    ]


def test_supported_answer_passes_verification_once():
    complete = make_complete(_verify_script([{"supported": True, "unsupported_claims": []}]))
    graph = build_graph(GraphDeps(complete=complete, retriever=FakeRetriever()))
    out = graph.invoke({"request": "Apakah mikroorganisma?"})
    assert out["answer"]
    assert out["verification"]["supported"] is True
    assert len(_tutor_calls(complete)) == 1  # no revision happened


def test_unsupported_answer_triggers_one_revision_with_feedback():
    complete = make_complete(_verify_script([
        {"supported": False, "unsupported_claims": ["virus lebih besar daripada bakteria"]},
        {"supported": True, "unsupported_claims": []},
    ]))
    graph = build_graph(GraphDeps(complete=complete, retriever=FakeRetriever()))
    out = graph.invoke({"request": "Apakah mikroorganisma?"})

    tutor_calls = _tutor_calls(complete)
    assert len(tutor_calls) == 2  # original + exactly one revision
    revision_user = next(m["content"] for m in tutor_calls[1][0] if m["role"] == "user")
    assert "virus lebih besar" in revision_user  # feedback reached the revision
    assert out["verification"]["supported"] is True


def test_persistently_unsupported_answer_is_bounded_not_looped():
    """Two failing verdicts must still terminate: one revision max, then accept."""
    complete = make_complete(_verify_script([
        {"supported": False, "unsupported_claims": ["claim A"]},
        {"supported": False, "unsupported_claims": ["claim B"]},
    ]))
    graph = build_graph(GraphDeps(complete=complete, retriever=FakeRetriever()))
    out = graph.invoke({"request": "Apakah mikroorganisma?"})
    assert len(_tutor_calls(complete)) == 2  # bounded: never a third attempt
    assert out["answer"]  # availability preserved despite failed verification
    assert out["verification"]["supported"] is False  # honest status reported


def test_broken_verifier_fails_open():
    """Verifier returning junk must pass the answer through, not crash or loop."""
    def script(messages, tier):
        sys = _system_of(messages)
        if "router" in sys:
            return json.dumps({"intents": ["tutor"], "subject": "sains", "chapter": "1"})
        if "fact-checker" in sys:
            return "I am not JSON at all"
        return "Jawapan tutor."

    complete = make_complete(script)
    graph = build_graph(GraphDeps(complete=complete, retriever=FakeRetriever()))
    out = graph.invoke({"request": "Apakah mikroorganisma?"})
    assert out["answer"] == "Jawapan tutor."
    assert out["verification"]["checked"] is False
    assert len(_tutor_calls(complete)) == 1
