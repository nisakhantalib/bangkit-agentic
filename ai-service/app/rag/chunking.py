"""Markdown-aware chunking for curriculum sections.

Splits on markdown headings first so each chunk stays topically coherent, then
falls back to paragraph packing for long sections. Chunk size is measured in
characters (a cheap, dependency-free proxy for tokens) which is sufficient for
short-form curriculum content.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

_HEADING = re.compile(r"^(#{1,4})\s+(.*)$", re.MULTILINE)


@dataclass
class Chunk:
    text: str
    heading: str
    metadata: dict


def _split_on_headings(content: str) -> list[tuple[str, str]]:
    """Return (heading, body) blocks. Text before the first heading gets ''."""
    matches = list(_HEADING.finditer(content))
    if not matches:
        return [("", content.strip())]

    blocks: list[tuple[str, str]] = []
    if matches[0].start() > 0:
        preamble = content[: matches[0].start()].strip()
        if preamble:
            blocks.append(("", preamble))

    for i, m in enumerate(matches):
        heading = m.group(2).strip()
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(content)
        body = content[start:end].strip()
        blocks.append((heading, body))
    return blocks


def _pack(heading: str, body: str, max_chars: int, overlap: int) -> list[str]:
    """Pack paragraphs into <=max_chars windows, prefixing the heading for context."""
    prefix = f"{heading}\n" if heading else ""
    if len(prefix) + len(body) <= max_chars:
        return [f"{prefix}{body}".strip()]

    paras = [p.strip() for p in body.split("\n\n") if p.strip()]
    windows: list[str] = []
    current = ""
    for para in paras:
        candidate = f"{current}\n\n{para}".strip() if current else para
        if len(prefix) + len(candidate) > max_chars and current:
            windows.append(f"{prefix}{current}".strip())
            tail = current[-overlap:] if overlap else ""
            current = f"{tail}\n\n{para}".strip()
        else:
            current = candidate
    if current:
        windows.append(f"{prefix}{current}".strip())
    return windows


def chunk_section(record: dict, max_chars: int = 1200, overlap: int = 120) -> list[Chunk]:
    """Chunk one exported curriculum section into retrievable pieces."""
    content = record["content"]
    base_meta = {k: v for k, v in record.items() if k != "content"}

    chunks: list[Chunk] = []
    for heading, body in _split_on_headings(content):
        if not body:
            continue
        for i, window in enumerate(_pack(heading, body, max_chars, overlap)):
            meta = {**base_meta, "heading": heading, "window": i}
            chunks.append(Chunk(text=window, heading=heading, metadata=meta))
    return chunks
