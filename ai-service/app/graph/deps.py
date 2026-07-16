"""Dependency bundle injected into graph nodes.

Nodes never import a concrete LLM or retriever directly — they receive this
bundle. That keeps the graph testable with fakes and swappable in production.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Protocol


class RetrieverLike(Protocol):
    def retrieve(self, query: str, k: int = ..., subject=..., chapter=...): ...


# complete(messages, tier) -> (text, model_id)
CompleteFn = Callable[..., tuple[str, str]]


@dataclass
class GraphDeps:
    complete: CompleteFn
    retriever: RetrieverLike
