"""Visual output contracts for the presenter agent.

The tutor answers in prose; the presenter optionally attaches ONE visual that
aids the explanation — a Mermaid diagram, a comparison table, or revision
slides. Each payload is schema-validated so the frontend renders trusted
structure, never raw model output.
"""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator

# Diagram types we allow Mermaid to render. Restricting the first token is a
# cheap server-side sanity check; the client renders with strict security and
# hides the block entirely on a parse error.
_ALLOWED_MERMAID_STARTS = ("flowchart", "graph", "mindmap", "sequenceDiagram", "pie")


class TableSpec(BaseModel):
    caption: str = ""
    headers: list[str] = Field(min_length=1, max_length=6)
    rows: list[list[str]] = Field(min_length=1, max_length=12)

    @model_validator(mode="after")
    def rows_match_headers(self):
        width = len(self.headers)
        if any(len(row) != width for row in self.rows):
            raise ValueError("every row must have exactly as many cells as there are headers")
        return self


class Slide(BaseModel):
    title: str
    bullets: list[str] = Field(min_length=1, max_length=6)


class SlidesSpec(BaseModel):
    title: str
    slides: list[Slide] = Field(min_length=2, max_length=8)


class VisualSpec(BaseModel):
    """Discriminated by `kind`; exactly the matching payload must be present."""

    kind: Literal["none", "diagram", "table", "slides"]
    mermaid: Optional[str] = None
    table: Optional[TableSpec] = None
    slides: Optional[SlidesSpec] = None

    @field_validator("mermaid")
    @classmethod
    def mermaid_sane(cls, v):
        if v is None:
            return v
        cleaned = v.strip().strip("`").strip()
        first = cleaned.split(None, 1)[0] if cleaned.split() else ""
        if first not in _ALLOWED_MERMAID_STARTS:
            raise ValueError(f"mermaid must start with one of {_ALLOWED_MERMAID_STARTS}")
        if len(cleaned) > 4000:
            raise ValueError("mermaid too long")
        return cleaned

    @model_validator(mode="after")
    def payload_matches_kind(self):
        required = {"diagram": self.mermaid, "table": self.table, "slides": self.slides}
        if self.kind in required and required[self.kind] is None:
            raise ValueError(f"kind={self.kind} requires its payload")
        return self
