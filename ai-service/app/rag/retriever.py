"""Hybrid retriever: vector similarity + BM25 keyword search, fused by rank.

Why hybrid: embeddings capture meaning ("what are tiny living things?" finds
the mikroorganisma chunk) but can under-rank exact-term matches; BM25 captures
exact vocabulary ("Bab 1 mikroorganisma") but knows nothing about synonyms.
Each covers the other's blind spot.

Fusion uses Reciprocal Rank Fusion (RRF): score(chunk) = sum over rankings of
1 / (RRF_K + rank). Rank-based fusion avoids having to normalise two score
scales (cosine in [0,1] vs unbounded BM25) against each other — only the
*order* each ranker produced matters. RRF_K=60 is the standard damping constant
from the original RRF paper (Cormack et al.).
"""

from __future__ import annotations

from dataclasses import dataclass

from app.rag.embeddings import Embedder
from app.rag.keyword import BM25Index
from app.rag.store import Record, VectorStore

_RRF_K = 60


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
        # Build the keyword index over the same records the vector store holds.
        # Constructed after ingest in main.create_app(), so records are present.
        self._bm25 = BM25Index()
        self._bm25.add(store.records())

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

        hits = self._hybrid(query, k=k, where=where or None)

        # If a chapter filter over-narrows to nothing, fall back to subject-only
        # so a mis-inferred chapter degrades gracefully instead of returning zero.
        if not hits and where and "chapter" in where:
            relaxed = {kk: vv for kk, vv in where.items() if kk != "chapter"}
            hits = self._hybrid(query, k=k, where=relaxed or None)

        results: list[RetrievedChunk] = []
        for record, score in hits:
            meta = record.metadata
            results.append(
                RetrievedChunk(
                    text=record.text, source=_format_source(meta), score=score, metadata=meta
                )
            )
        return results

    def _hybrid(
        self, query: str, k: int, where: dict | None
    ) -> list[tuple[Record, float]]:
        """Run both rankers over-fetched to 2k, fuse with RRF, return top k."""
        query_vec = self._embedder.embed([query])[0]
        vector_hits = self._store.query(query_vec, k=2 * k, where=where)
        keyword_hits = self._bm25.query(query, k=2 * k, where=where)

        fused: dict[str, float] = {}
        by_id: dict[str, Record] = {}
        for ranking in (vector_hits, keyword_hits):
            for rank, (record, _score) in enumerate(ranking):
                fused[record.id] = fused.get(record.id, 0.0) + 1.0 / (_RRF_K + rank + 1)
                by_id[record.id] = record

        ordered = sorted(fused.items(), key=lambda item: item[1], reverse=True)
        return [(by_id[rid], score) for rid, score in ordered[:k]]


def _format_source(meta: dict) -> str:
    parts = [meta.get("chapter_title", ""), meta.get("subchapter_title", "")]
    heading = meta.get("heading")
    if heading:
        parts.append(heading)
    return " > ".join(p for p in parts if p)
