"""Retriever: embeds a query and returns grounded chunks with source metadata."""

from __future__ import annotations

from dataclasses import dataclass

from app.rag.embeddings import Embedder
from app.rag.store import VectorStore


@dataclass
class RetrievedChunk:
    text: str
    source: str
    score: float
    metadata: dict


class Retriever:
    def __init__(self, store: VectorStore, embedder: Embedder) -> None:
        self._store = store
        self._embedder = embedder

    def retrieve(
        self,
        query: str,
        k: int = 6,
        subject: str | None = None,
        chapter: str | None = None,
    ) -> list[RetrievedChunk]:
        where = {}
        if subject:
            where["subject"] = subject
        if chapter:
            where["chapter"] = chapter

        query_vec = self._embedder.embed([query])[0]
        hits = self._store.query(query_vec, k=k, where=where or None)

        results: list[RetrievedChunk] = []
        for record, score in hits:
            meta = record.metadata
            source = _format_source(meta)
            results.append(
                RetrievedChunk(text=record.text, source=source, score=score, metadata=meta)
            )
        return results


def _format_source(meta: dict) -> str:
    parts = [meta.get("chapter_title", ""), meta.get("subchapter_title", "")]
    heading = meta.get("heading")
    if heading:
        parts.append(heading)
    return " > ".join(p for p in parts if p)
