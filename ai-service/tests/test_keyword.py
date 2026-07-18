"""BM25 keyword index: exact-term ranking and metadata filtering."""

from app.rag.keyword import BM25Index
from app.rag.store import Record


def _rec(id_, text, **meta):
    return Record(id=id_, text=text, embedding=[0.0], metadata=meta)


def _index(*records):
    idx = BM25Index()
    idx.add(list(records))
    return idx


def test_exact_term_ranks_containing_doc_first():
    idx = _index(
        _rec("a", "Fotosintesis ialah proses tumbuhan membuat makanan", subject="sains"),
        _rec("b", "Mikroorganisma ialah benda hidup yang sangat kecil", subject="sains"),
    )
    hits = idx.query("apakah mikroorganisma", k=2)
    assert hits[0][0].id == "b"


def test_rare_term_outranks_common_term():
    # "proses" appears in both docs (low idf); "pythagoras" in one (high idf).
    idx = _index(
        _rec("a", "Teorem Pythagoras ialah proses mengira sisi segitiga"),
        _rec("b", "Respirasi ialah proses menghasilkan tenaga"),
    )
    hits = idx.query("proses pythagoras", k=2)
    assert hits[0][0].id == "a"


def test_metadata_filter_scopes_results():
    idx = _index(
        _rec("a", "Mikroorganisma dan kesihatan", subject="sains"),
        _rec("b", "Mikroorganisma dalam matematik (contoh pelik)", subject="matematik"),
    )
    hits = idx.query("mikroorganisma", k=5, where={"subject": "sains"})
    assert [h[0].id for h in hits] == ["a"]


def test_no_matching_terms_returns_empty():
    idx = _index(_rec("a", "Fotosintesis tumbuhan hijau"))
    assert idx.query("kalkulus pembezaan", k=3) == []


def test_empty_index_returns_empty():
    assert BM25Index().query("anything", k=3) == []
