"""Presenter agent: modality selection, schema validation, and fail-open."""

import json

import pytest
from pydantic import ValidationError

from app.graph.build import build_graph
from app.graph.deps import GraphDeps
from app.graph.nodes import wants_visual
from app.schemas.visual import TableSpec, VisualSpec

from tests.test_graph import FakeRetriever, make_complete, _system_of


# ---- the cost gate ----

def test_gate_fires_on_explicit_ask():
    assert wants_visual("boleh lukis rajah proses ini?", "...")
    assert wants_visual("draw a diagram of the water cycle", "...")


def test_gate_fires_on_shape_vocabulary():
    assert wants_visual("bezakan mitosis dan meiosis", "Mitosis dan meiosis berbeza...")
    assert wants_visual("what are the steps of photosynthesis", "The process has stages...")


def test_gate_stays_quiet_for_plain_definition():
    assert not wants_visual("apakah maksud pncemaran", "Pencemaran ialah kehadiran bahan...")


# ---- schema validation ----

def test_table_rejects_ragged_rows():
    with pytest.raises(ValidationError):
        TableSpec(headers=["A", "B"], rows=[["1", "2"], ["only-one"]])


def test_visual_requires_matching_payload():
    with pytest.raises(ValidationError):
        VisualSpec(kind="diagram")  # no mermaid provided


def test_visual_rejects_untrusted_mermaid_prefix():
    with pytest.raises(ValidationError):
        VisualSpec(kind="diagram", mermaid="import os; rm -rf /")


def test_visual_accepts_valid_flowchart():
    spec = VisualSpec(kind="diagram", mermaid="flowchart TD\n A-->B")
    assert spec.kind == "diagram"


# ---- presenter in the graph ----

def _script_with_visual(visual_obj):
    def script(messages, tier):
        sys = _system_of(messages)
        if "router" in sys:
            return json.dumps({"intents": ["tutor"], "subject": "sains", "chapter": "1"})
        if "fact-checker" in sys:
            return json.dumps({"supported": True, "unsupported_claims": []})
        if "decide whether ONE visual" in sys:
            return json.dumps(visual_obj)
        return "Proses fotosintesis mempunyai beberapa langkah. [Bab 1 > 1.1]"
    return script


def test_presenter_attaches_diagram_when_helpful():
    visual = {"kind": "diagram", "mermaid": "flowchart TD\n Cahaya-->Klorofil-->Glukosa"}
    complete = make_complete(_script_with_visual(visual))
    graph = build_graph(GraphDeps(complete=complete, retriever=FakeRetriever()))
    out = graph.invoke({"request": "terangkan langkah proses fotosintesis"})
    assert out["visual"]["kind"] == "diagram"
    assert "flowchart" in out["visual"]["mermaid"]


def test_presenter_skips_when_gate_quiet():
    """A plain definition never reaches the presenter LLM — no visual key set."""
    complete = make_complete(_script_with_visual({"kind": "none"}))
    graph = build_graph(GraphDeps(complete=complete, retriever=FakeRetriever()))
    out = graph.invoke({"request": "apakah maksud fotosintesis"})
    assert not out.get("visual")


def test_presenter_fails_open_on_invalid_spec():
    """Presenter returns junk twice -> answer survives, no visual, no crash."""
    def script(messages, tier):
        sys = _system_of(messages)
        if "router" in sys:
            return json.dumps({"intents": ["tutor"], "subject": "sains", "chapter": "1"})
        if "fact-checker" in sys:
            return json.dumps({"supported": True, "unsupported_claims": []})
        if "decide whether ONE visual" in sys:
            return "not json"
        return "Proses ini ada beberapa langkah penting."
    complete = make_complete(script)
    graph = build_graph(GraphDeps(complete=complete, retriever=FakeRetriever()))
    out = graph.invoke({"request": "senaraikan langkah-langkah proses ini"})
    assert out["answer"]
    assert not out.get("visual")
