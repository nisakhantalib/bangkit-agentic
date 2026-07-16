"""Evaluation harness — 'TDD for agents'.

Runs golden datasets through the marking and tutor nodes and reports pass rates.
Uses whatever LLM `complete` callable is injected: a scripted fake for CI (fast,
offline, deterministic) or the real ModelRouter locally for true accuracy numbers.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

from app.graph.deps import GraphDeps
from app.graph.nodes import mark_node, tutor_node
from evals.metrics import (
    marking_mentions_required,
    marking_within_tolerance,
    tutor_cites_source,
    tutor_is_grounded,
)

DATASETS = Path(__file__).parent / "datasets"


def load_jsonl(path: Path) -> list[dict]:
    with path.open(encoding="utf-8") as fh:
        return [json.loads(line) for line in fh if line.strip()]


@dataclass
class EvalReport:
    name: str
    total: int
    passed: int

    @property
    def pass_rate(self) -> float:
        return self.passed / self.total if self.total else 0.0

    def __str__(self) -> str:
        return f"{self.name}: {self.passed}/{self.total} ({self.pass_rate:.0%})"


def _static_retriever(context: str):
    """Retriever that returns a single fixed context chunk (from the golden case)."""

    class _R:
        def retrieve(self, query, k=6, subject=None, chapter=None):
            from app.rag.retriever import RetrievedChunk

            return [RetrievedChunk(text=context, source="golden-context",
                                   score=1.0, metadata={"subject": subject})]

    return _R()


def run_marking_eval(complete) -> EvalReport:
    cases = load_jsonl(DATASETS / "marking_golden.jsonl")
    passed = 0
    for case in cases:
        deps = GraphDeps(complete=complete, retriever=_static_retriever(case["context"]))
        state = {
            "request": case["question"],
            "subject": case["subject"],
            "chapter": case["chapter"],
            "retrieved": [{"text": case["context"], "source": "golden-context", "score": 1.0}],
            "student_answers": [{"question": case["question"], "answer": case["student_answer"]}],
        }
        out = mark_node(state, deps)
        result = out.get("marking")
        if result and marking_within_tolerance(result, case) and marking_mentions_required(
            result, case
        ):
            passed += 1
    return EvalReport("marking_accuracy", len(cases), passed)


def run_tutor_eval(complete) -> EvalReport:
    cases = load_jsonl(DATASETS / "tutor_golden.jsonl")
    passed = 0
    for case in cases:
        context = f"Fakta untuk {case['question']}"
        deps = GraphDeps(complete=complete, retriever=_static_retriever(context))
        state = {
            "request": case["question"],
            "subject": case["subject"],
            "chapter": case["chapter"],
            "retrieved": [{"text": context, "source": "Bab " + case["chapter"], "score": 1.0}],
        }
        answer = tutor_node(state, deps).get("answer", "")
        sources = ["Bab " + case["chapter"]]
        grounded = tutor_is_grounded(answer, case)
        cited = tutor_cites_source(answer, sources) if case.get("must_cite") else True
        if grounded and cited:
            passed += 1
    return EvalReport("tutor_groundedness", len(cases), passed)


def run_all(complete) -> list[EvalReport]:
    return [run_marking_eval(complete), run_tutor_eval(complete)]


if __name__ == "__main__":
    import os

    from app.llm.groq_client import groq_client
    from app.llm.router import ModelRouter
    from app.observability import configure_tracing

    configure_tracing()
    if not os.getenv("GROQ_API_KEY"):
        raise SystemExit("Set GROQ_API_KEY to run evals against real models.")
    router = ModelRouter(client=groq_client)
    for report in run_all(router.complete):
        print(report)
