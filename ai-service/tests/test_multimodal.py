"""Multimodal input: vision routing constraint + image transcription node."""

import json

from app.graph.build import build_graph
from app.graph.deps import GraphDeps
from app.graph.nodes import transcribe_node
from app.llm.router import ModelRouter, ModelSpec

from tests.test_graph import FakeRetriever, make_complete, _system_of

_IMG = "data:image/png;base64,iVBORw0KGgoAAAANS"  # a tiny valid-looking data URL


# ---- router: vision is a hard constraint ----

def _router(*specs):
    calls = []

    def client(model_id, messages, **kw):
        calls.append(model_id)
        return "ok"

    r = ModelRouter(client=client, models=specs)
    r._calls = calls
    return r


def test_vision_request_never_falls_through_to_text_model():
    r = _router(ModelSpec("text-only", "smart"), ModelSpec("sees", "vision"))
    _, used = r.complete([{"role": "user", "content": "x"}], tier="vision")
    assert used == "sees"


def test_vision_tier_with_no_vision_model_raises_not_text_fallback():
    from app.llm.router import AllModelsUnavailableError

    r = _router(ModelSpec("text-only", "smart"))
    try:
        r.complete([{"role": "user", "content": "x"}], tier="vision")
        assert False, "should have raised"
    except AllModelsUnavailableError:
        pass


def test_text_request_never_promotes_to_vision_model():
    r = _router(ModelSpec("sees", "vision"), ModelSpec("fast-txt", "fast"))
    _, used = r.complete([{"role": "user", "content": "x"}], tier="smart")
    assert used == "fast-txt"  # falls to fast, never up into vision


# ---- transcribe node ----

def test_no_image_is_a_noop():
    deps = GraphDeps(complete=make_complete(lambda m, t: "x"), retriever=FakeRetriever())
    assert transcribe_node({"request": "hi"}, deps) == {}


def test_oversized_image_fails_open():
    deps = GraphDeps(complete=make_complete(lambda m, t: "x"), retriever=FakeRetriever())
    huge = "data:image/png;base64," + "A" * 8_000_000
    assert transcribe_node({"image": huge}, deps) == {"transcription": None}


def test_non_data_url_fails_open():
    deps = GraphDeps(complete=make_complete(lambda m, t: "x"), retriever=FakeRetriever())
    assert transcribe_node({"image": "http://evil/x.png"}, deps) == {"transcription": None}


def test_transcription_seeds_student_answer_for_marking():
    complete = make_complete(lambda m, t: "Fotosintesis menghasilkan glukosa")
    deps = GraphDeps(complete=complete, retriever=FakeRetriever())
    out = transcribe_node({"image": _IMG, "intent": "mark", "student_answers": []}, deps)
    assert out["transcription"] == "Fotosintesis menghasilkan glukosa"
    assert out["student_answers"] == [{"answer": "Fotosintesis menghasilkan glukosa"}]


def test_vision_model_failure_fails_open():
    def boom(messages, tier="smart", **kw):
        raise RuntimeError("vision down")

    boom.calls = []
    deps = GraphDeps(complete=boom, retriever=FakeRetriever())
    assert transcribe_node({"image": _IMG, "intent": "mark"}, deps) == {"transcription": None}


def test_sends_image_block_on_vision_tier():
    """The node must pass an image_url content block at vision tier."""
    seen = {}

    def complete(messages, tier="smart", **kw):
        seen["tier"] = tier
        seen["content"] = messages[-1]["content"]
        return "transcribed text", "vision-model"

    complete.calls = []
    deps = GraphDeps(complete=complete, retriever=FakeRetriever())
    transcribe_node({"image": _IMG, "intent": "mark"}, deps)
    assert seen["tier"] == "vision"
    kinds = {part["type"] for part in seen["content"]}
    assert "image_url" in kinds and "text" in kinds


# ---- end to end: image -> transcribe -> mark ----

def test_image_marking_flow_end_to_end():
    def script(messages, tier):
        sys = _system_of(messages)
        if "router" in sys:
            return json.dumps({"intents": ["mark"], "subject": "sains", "chapter": "1"})
        if "transcribe" in sys:
            return "Mikroorganisma ialah organisma yang sangat kecil"
        if "mark SPM" in sys:
            return json.dumps({
                "total_awarded": 2, "total_max": 3,
                "criteria": [{"criterion": "definition", "awarded": 2,
                              "max_marks": 3, "comment": "ok"}],
                "model_answer": "...", "feedback": "good"
            })
        return "x"

    complete = make_complete(script)
    graph = build_graph(GraphDeps(complete=complete, retriever=FakeRetriever()))
    out = graph.invoke({
        "request": "mark my answer",
        "intent": "mark",
        "image": _IMG,
    })
    assert out["transcription"].startswith("Mikroorganisma")
    assert out["marking"]["total_awarded"] == 2
