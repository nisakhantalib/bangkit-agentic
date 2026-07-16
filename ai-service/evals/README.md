# Evaluation harness ("TDD for agents")

Systematic quality checks for the agent's structured outputs — the same
regression-testing discipline applied to LLM behaviour instead of UI flows.

## What it measures

| Suite | Metric | Golden set |
|---|---|---|
| `marking_accuracy` | total-marks match + awarded within expected bounds + required concepts surfaced | `datasets/marking_golden.jsonl` |
| `tutor_groundedness` | answer includes required facts + cites a source | `datasets/tutor_golden.jsonl` |

## Running

**In CI (offline, deterministic):** the harness runs automatically via
`tests/test_evals.py` against a scripted fake model, guarding the metric logic
and wiring on every push.

**Against real models (true accuracy):**
```bash
cd ai-service
export GROQ_API_KEY=...            # required
export LANGCHAIN_TRACING_V2=true   # optional: trace runs in LangSmith
export LANGCHAIN_API_KEY=...
python -m evals.runner
```
Output:
```
marking_accuracy: 4/4 (100%)
tutor_groundedness: 3/3 (100%)
```

## Extending
Add rows to the JSONL golden sets. Keep them curriculum-grounded and small —
each case should test one clear behaviour. New metrics go in `metrics.py`.
