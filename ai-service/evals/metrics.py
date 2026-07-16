"""Scoring functions for evaluating agent outputs against golden expectations."""

from __future__ import annotations


def marking_within_tolerance(result: dict, case: dict) -> bool:
    """Marking is acceptable if total_max matches and awarded respects bounds."""
    if result.get("total_max") != case["expected_total_max"]:
        return False
    awarded = result.get("total_awarded", -1)
    if "expected_min_awarded" in case and awarded < case["expected_min_awarded"]:
        return False
    if "expected_max_awarded" in case and awarded > case["expected_max_awarded"]:
        return False
    return True


def marking_mentions_required(result: dict, case: dict) -> bool:
    """Feedback/model answer should surface the key concepts."""
    required = case.get("must_mention", [])
    if not required:
        return True
    haystack = " ".join(
        str(v) for v in (
            result.get("feedback", ""),
            result.get("model_answer", ""),
            *[c.get("comment", "") for c in result.get("criteria", [])],
        )
    ).lower()
    return all(term.lower() in haystack for term in required)


def tutor_is_grounded(answer: str, case: dict) -> bool:
    """Tutor answer must include required facts."""
    if not answer:
        return False
    lowered = answer.lower()
    return all(term.lower() in lowered for term in case.get("must_include", []))


def tutor_cites_source(answer: str, sources: list[str]) -> bool:
    """A citation is present if a known source string appears, or a bracketed ref."""
    if not answer:
        return False
    if any(src and src.split(" > ")[0].lower() in answer.lower() for src in sources):
        return True
    return "[" in answer and "]" in answer
