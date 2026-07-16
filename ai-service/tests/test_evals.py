"""CI eval smoke: run the harness against a scripted 'competent' fake model.

This proves the harness wiring end-to-end and guards metric logic against
regressions. Real-model accuracy numbers come from running evals/runner.py
locally with a GROQ_API_KEY.
"""

from __future__ import annotations

import json

from evals.metrics import (
    marking_within_tolerance,
    tutor_cites_source,
    tutor_is_grounded,
)
from evals.runner import run_marking_eval, run_tutor_eval


def _competent_marker(messages, tier="smart", **kwargs):
    """A fake that marks correctly by reading the golden student answer."""
    user = next(m["content"] for m in messages if m["role"] == "user")
    # The golden cases embed enough signal to fake a correct mark deterministically.
    if "tidak tahu" in user:
        result = {"total_awarded": 0, "total_max": 2, "criteria": [],
                  "model_answer": "", "feedback": "Jawapan kosong."}
    elif "36" in user:
        result = {"total_awarded": 1, "total_max": 2, "criteria": [],
                  "model_answer": "k = 4", "feedback": "Kaedah salah."}
    elif "12/3" in user or "pencernaan" in user:
        must = "pencernaan patogen 4"
        result = {"total_awarded": 2, "total_max": 2, "criteria": [],
                  "model_answer": "4", "feedback": f"Betul: {must}"}
    else:
        result = {"total_awarded": 2, "total_max": 2, "criteria": [],
                  "model_answer": "4", "feedback": "Betul. Nilai k ialah 4."}
    return json.dumps(result, ensure_ascii=False), "fake"


def _grounded_tutor(messages, tier="smart", **kwargs):
    user = next(m["content"] for m in messages if m["role"] == "user")
    if "mikroorganisma" in user.lower():
        return "Mikroorganisma dilihat dengan mikroskop. [Bab 1]", "fake"
    if "flora" in user.lower():
        return "Flora normal membantu pencernaan. [Bab 1]", "fake"
    if "ubahan" in user.lower():
        return "Ubahan langsung ialah hubungan langsung. [Bab 1]", "fake"
    return "Lihat [Bab 1].", "fake"


def test_marking_harness_scores_competent_model_highly():
    report = run_marking_eval(_competent_marker)
    assert report.total == 4
    assert report.pass_rate >= 0.75  # competent model should clear most cases


def test_tutor_harness_scores_grounded_model_highly():
    report = run_tutor_eval(_grounded_tutor)
    assert report.total == 3
    assert report.pass_rate == 1.0


def test_metric_rejects_wrong_total_max():
    case = {"expected_total_max": 2, "expected_min_awarded": 2}
    assert not marking_within_tolerance({"total_max": 5, "total_awarded": 2}, case)


def test_metric_detects_missing_citation():
    assert tutor_cites_source("See [Bab 1] for details.", ["Bab 1"])
    assert not tutor_cites_source("No citation here.", ["Bab 1"])


def test_metric_detects_ungrounded_answer():
    case = {"must_include": ["mikroskop"]}
    assert tutor_is_grounded("Dilihat dengan mikroskop.", case)
    assert not tutor_is_grounded("Tiada kaitan.", case)
