from app.rag.embeddings import HashingEmbedder
from app.rag.ingest import build_store
from app.rag.retriever import Retriever


def _corpus():
    return [
        {"subject": "sains", "chapter": "1", "chapter_title": "Mikroorganisma",
         "subchapter_title": "Dunia Mikroorganisma",
         "content": "# Mikroorganisma\n\nBakteria dan virus ialah mikroorganisma seni."},
        {"subject": "matematik", "chapter": "1", "chapter_title": "Ubahan",
         "subchapter_title": "Ubahan Langsung",
         "content": "# Ubahan\n\nUbahan langsung melibatkan nisbah malar antara pemboleh ubah."},
    ]


def _retriever():
    embedder = HashingEmbedder()
    store = build_store(_corpus(), embedder)
    return Retriever(store, embedder)


def test_retrieves_relevant_chunk():
    hits = _retriever().retrieve("apa itu bakteria mikroorganisma", k=1)
    assert hits
    assert "mikroorganisma" in hits[0].text.lower()


def test_subject_filter_scopes_results():
    hits = _retriever().retrieve("ubahan langsung", subject="matematik", k=5)
    assert hits
    assert all(h.metadata["subject"] == "matematik" for h in hits)


def test_source_is_formatted_with_titles():
    hits = _retriever().retrieve("mikroorganisma", subject="sains", k=1)
    assert "Mikroorganisma" in hits[0].source
