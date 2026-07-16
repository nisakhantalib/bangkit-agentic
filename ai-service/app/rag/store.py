"""Minimal in-memory vector store with cosine similarity + metadata filtering.

Deliberately dependency-light for dev and CI: no external vector DB required to
run tests. The interface (add / query) mirrors what a Chroma or pgvector-backed
implementation would expose, so swapping in a persistent store later is a
drop-in change behind the same two methods.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field


@dataclass
class Record:
    id: str
    text: str
    embedding: list[float]
    metadata: dict


@dataclass
class VectorStore:
    _records: list[Record] = field(default_factory=list)

    def add(self, records: list[Record]) -> None:
        self._records.extend(records)

    def __len__(self) -> int:
        return len(self._records)

    def query(
        self, embedding: list[float], k: int = 6, where: dict | None = None
    ) -> list[tuple[Record, float]]:
        candidates = [r for r in self._records if _matches(r.metadata, where)]
        scored = [(r, _cosine(embedding, r.embedding)) for r in candidates]
        scored.sort(key=lambda pair: pair[1], reverse=True)
        return scored[:k]


def _matches(metadata: dict, where: dict | None) -> bool:
    if not where:
        return True
    return all(metadata.get(key) == value for key, value in where.items())


def _cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)
