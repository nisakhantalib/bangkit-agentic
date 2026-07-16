"""Auth behaviour: /v1 endpoints are open in dev, guarded when a key is set."""

from __future__ import annotations

import json

import pytest
from fastapi.testclient import TestClient

from app.config import get_settings
from app.graph.build import build_graph
from app.graph.deps import GraphDeps
from app.main import create_app


class FakeRetriever:
    def retrieve(self, query, k=6, subject=None, chapter=None):
        from app.rag.retriever import RetrievedChunk

        return [RetrievedChunk(text="ctx", source="Bab 1", score=1.0, metadata={})]


def _complete(messages, tier="smart", **kwargs):
    sys = next((m["content"] for m in messages if m["role"] == "system"), "")
    if "router" in sys:
        return json.dumps({"intents": ["tutor"], "subject": "sains", "chapter": "1"}), "f"
    return "Jawapan. [Bab 1]", "f"


@pytest.fixture(autouse=True)
def _clear_settings_cache():
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def _client():
    app = create_app()
    app.state.graph = build_graph(GraphDeps(complete=_complete, retriever=FakeRetriever()))
    return TestClient(app)


def test_open_when_no_key_configured(monkeypatch):
    monkeypatch.delenv("SERVICE_API_KEY", raising=False)
    resp = _client().post("/v1/agent", json={"request": "hi"})
    assert resp.status_code == 200


def test_rejects_missing_key_when_configured(monkeypatch):
    monkeypatch.setenv("SERVICE_API_KEY", "secret123")
    resp = _client().post("/v1/agent", json={"request": "hi"})
    assert resp.status_code == 401


def test_accepts_correct_key(monkeypatch):
    monkeypatch.setenv("SERVICE_API_KEY", "secret123")
    resp = _client().post(
        "/v1/agent", json={"request": "hi"}, headers={"X-API-Key": "secret123"}
    )
    assert resp.status_code == 200


def test_health_never_requires_key(monkeypatch):
    monkeypatch.setenv("SERVICE_API_KEY", "secret123")
    assert _client().get("/health").status_code == 200
