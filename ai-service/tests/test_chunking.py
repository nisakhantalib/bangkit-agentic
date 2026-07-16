from app.rag.chunking import chunk_section


def test_short_section_stays_one_chunk():
    record = {"subject": "sains", "chapter": "1", "content": "# Title\n\nShort body."}
    chunks = chunk_section(record)
    assert len(chunks) == 1
    assert "Short body." in chunks[0].text
    assert chunks[0].metadata["subject"] == "sains"


def test_splits_on_headings():
    content = "# A\n\nAlpha body.\n\n## B\n\nBeta body."
    chunks = chunk_section({"content": content})
    headings = {c.heading for c in chunks}
    assert "A" in headings and "B" in headings


def test_long_body_packs_into_multiple_windows():
    body = "\n\n".join(f"Paragraph number {i} with some filler text." for i in range(60))
    record = {"content": f"# Big\n\n{body}"}
    chunks = chunk_section(record, max_chars=300, overlap=40)
    assert len(chunks) > 1
    assert all(len(c.text) <= 300 + 60 for c in chunks)  # heading prefix tolerance


def test_metadata_is_preserved():
    record = {"subject": "matematik", "chapter": "2", "chapter_title": "Matriks",
              "content": "# M\n\nContent."}
    chunk = chunk_section(record)[0]
    assert chunk.metadata["chapter_title"] == "Matriks"
    assert chunk.metadata["chapter"] == "2"
