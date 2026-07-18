"""Okapi BM25 keyword index for hybrid retrieval.

Embedding search finds semantically similar text but can miss exact-term
matches that matter in a curriculum: chapter numbers ("Bab 3"), formula names
("Teorem Pythagoras"), or specific vocabulary a student copies verbatim from a
textbook. BM25 ranks by exact term overlap (tf-idf with length normalisation),
which is precisely the complementary signal.

Dependency-free by design, mirroring VectorStore: an inverted index over the
same Records, filterable by the same metadata, so the hybrid retriever can
fuse both rankings.
"""

from __future__ import annotations

import math
import re
from collections import Counter

from app.rag.store import Record, _matches

_TOKEN_RE = re.compile(r"[a-z0-9]+")

# Standard Okapi BM25 constants: k1 controls term-frequency saturation,
# b controls document-length normalisation.
_K1 = 1.5
_B = 0.75


def _tokenize(text: str) -> list[str]:
    return _TOKEN_RE.findall(text.lower())


class BM25Index:
    """Inverted index over Records with Okapi BM25 scoring and metadata filtering."""

    def __init__(self) -> None:
        self._records: list[Record] = []
        self._doc_tokens: list[Counter] = []
        self._doc_lens: list[int] = []
        self._df: Counter = Counter()  # term -> number of docs containing it

    def add(self, records: list[Record]) -> None:
        for record in records:
            tokens = _tokenize(record.text)
            counts = Counter(tokens)
            self._records.append(record)
            self._doc_tokens.append(counts)
            self._doc_lens.append(len(tokens))
            for term in counts:
                self._df[term] += 1

    def __len__(self) -> int:
        return len(self._records)

    def query(
        self, text: str, k: int = 6, where: dict | None = None
    ) -> list[tuple[Record, float]]:
        n = len(self._records)
        if n == 0:
            return []
        avg_len = sum(self._doc_lens) / n
        query_terms = _tokenize(text)

        scored: list[tuple[Record, float]] = []
        for i, record in enumerate(self._records):
            if not _matches(record.metadata, where):
                continue
            score = 0.0
            counts, doc_len = self._doc_tokens[i], self._doc_lens[i]
            for term in query_terms:
                tf = counts.get(term, 0)
                if tf == 0:
                    continue
                # idf with the standard +0.5 smoothing; max(0, ·) guards terms
                # present in more than half the corpus from going negative.
                idf = max(0.0, math.log((n - self._df[term] + 0.5) / (self._df[term] + 0.5) + 1))
                denom = tf + _K1 * (1 - _B + _B * doc_len / avg_len) if avg_len else tf + _K1
                score += idf * (tf * (_K1 + 1)) / denom
            if score > 0:
                scored.append((record, score))

        scored.sort(key=lambda pair: pair[1], reverse=True)
        return scored[:k]
