"""Embedding backends.

`HashingEmbedder` is a deterministic, dependency-free fallback used in tests and
CI — it is NOT semantically meaningful, just stable. Production swaps in
`FastEmbedEmbedder` (BGE), which is loaded lazily so importing this module never
pulls heavy ML deps.
"""

from __future__ import annotations

import hashlib
import re
from typing import Protocol

_TOKEN = re.compile(r"\w+", re.UNICODE)


class Embedder(Protocol):
    dim: int

    def embed(self, texts: list[str]) -> list[list[float]]: ...


class HashingEmbedder:
    """Hashed bag-of-words vectors. Deterministic; for tests/CI only."""

    def __init__(self, dim: int = 256) -> None:
        self.dim = dim

    def embed(self, texts: list[str]) -> list[list[float]]:
        return [self._embed_one(t) for t in texts]

    def _embed_one(self, text: str) -> list[float]:
        vec = [0.0] * self.dim
        for token in _TOKEN.findall(text.lower()):
            h = int(hashlib.md5(token.encode()).hexdigest(), 16)
            vec[h % self.dim] += 1.0
        return vec


class FastEmbedEmbedder:
    """BGE embeddings via fastembed. Lazy-loaded to keep imports cheap."""

    def __init__(self, model_name: str = "BAAI/bge-small-en-v1.5") -> None:
        from fastembed import TextEmbedding

        self._model = TextEmbedding(model_name=model_name)
        self.dim = 384

    def embed(self, texts: list[str]) -> list[list[float]]:
        return [list(v) for v in self._model.embed(texts)]
