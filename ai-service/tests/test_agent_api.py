"""End-to-end API test: /v1/agent runs through a graph with fakes injected."""

from __future__ import annotations

import json

from fastapi.testclient import TestClient

from app.graph.build import build_graph
from app.graph.deps import GraphDeps
from app.main import create_app


class FakeRetriever:
    def retrieve(self, query, k=6, subject=None, chapter=None):
        from app.rag.retriever import RetrievedChunk

        return [RetrievedChunk(text="Fakta sains.", source="Bab 1 > 1.1",
                               score=0.9, metadata={"subject": "sains"})]


def _client_with_fake_graph():
    app = create_app()

    def complete(messages, tier="smart", **kwargs):
        sys = next((m["content"] for m in messages if m["role"] == "system"), "")
        if "router" in sys:
            return json.dumps({"intents": ["tutor"], "subject": "sains", "chapter": "1"}), "fake"
        return "Jawapan grounded. [Bab 1 > 1.1]", "fake"

    app.state.graph = build_graph(GraphDeps(complete=complete, retriever=FakeRetriever()))
    return TestClient(app)


def test_agent_endpoint_returns_answer_and_sources():
    client = _client_with_fake_graph()
    resp = client.post("/v1/agent", json={"request": "Apakah mikroorganisma?"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["intent"] == "tutor"
    assert "Jawapan" in body["answer"]
    assert body["sources"] == ["Bab 1 > 1.1"]
    assert body["plan_executed"] is True
