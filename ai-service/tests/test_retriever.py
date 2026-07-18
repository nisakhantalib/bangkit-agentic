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


def test_chapter_filter_relaxes_when_empty():
    """A chapter with no matches falls back to subject-only rather than empty."""
    r = _retriever()
    # chapter "99" doesn't exist; should still return sains hits via relaxation
    hits = r.retrieve("mikroorganisma", subject="sains", chapter="99", k=3)
    assert hits
    assert all(h.metadata["subject"] == "sains" for h in hits)


def test_hybrid_finds_exact_term_embedding_would_underrank():
    """A doc sharing zero vocabulary with the query except one exact rare term
    must still surface: that's the BM25 half of the hybrid doing its job."""
    embedder = HashingEmbedder()
    corpus = [
        {"subject": "matematik", "chapter": "5", "chapter_title": "Teorem",
         "subchapter_title": "Pythagoras",
         "content": "# Teorem\n\nPythagoras: c kuasa dua sama dengan a kuasa dua campur b kuasa dua."},
        {"subject": "matematik", "chapter": "1", "chapter_title": "Ubahan",
         "subchapter_title": "Ubahan Langsung",
         "content": "# Ubahan\n\nUbahan langsung melibatkan nisbah malar antara pemboleh ubah."},
    ]
    store = build_store(corpus, embedder)
    r = Retriever(store, embedder)
    hits = r.retrieve("pythagoras", subject="matematik", k=1)
    assert hits
    assert "pythagoras" in hits[0].text.lower()


def test_hybrid_fuses_both_rankings_without_duplicates():
    r = _retriever()
    hits = r.retrieve("mikroorganisma bakteria", subject="sains", k=5)
    ids = [h.metadata.get("subchapter_title") for h in hits]
    assert len(ids) == len(set(ids))  # a chunk ranked by both lists appears once
