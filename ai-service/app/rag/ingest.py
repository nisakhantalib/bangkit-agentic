"""Ingest the exported curriculum corpus into a vector store.

Reads corpus/curriculum.jsonl (produced by scripts/export_content.mjs), chunks
each section, embeds the chunks, and loads them into a VectorStore.

CLI: python -m app.rag.ingest [corpus_path]
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from app.rag.chunking import chunk_section
from app.rag.embeddings import Embedder, HashingEmbedder
from app.rag.store import Record, VectorStore

DEFAULT_CORPUS = Path(__file__).resolve().parents[2] / "corpus" / "curriculum.jsonl"


def load_records(corpus_path: Path) -> list[dict]:
    with corpus_path.open(encoding="utf-8") as fh:
        return [json.loads(line) for line in fh if line.strip()]


def build_store(records: list[dict], embedder: Embedder) -> VectorStore:
    chunks = [chunk for record in records for chunk in chunk_section(record)]
    texts = [c.text for c in chunks]
    vectors = embedder.embed(texts) if texts else []

    store_records = [
        Record(
            id=f"{c.metadata.get('subject')}-{c.metadata.get('chapter')}-"
            f"{c.metadata.get('subchapter')}-{c.metadata.get('window')}-{i}",
            text=c.text,
            embedding=vec,
            metadata=c.metadata,
        )
        for i, (c, vec) in enumerate(zip(chunks, vectors))
    ]

    store = VectorStore()
    store.add(store_records)
    return store


def ingest(corpus_path: Path = DEFAULT_CORPUS, embedder: Embedder | None = None) -> VectorStore:
    embedder = embedder or HashingEmbedder()
    records = load_records(corpus_path)
    store = build_store(records, embedder)
    return store


if __name__ == "__main__":
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_CORPUS
    store = ingest(path)
    print(f"ingested {len(store)} chunks from {path}")
