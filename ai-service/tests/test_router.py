"""Unit tests for the multi-model fallback router."""

import pytest

from app.llm.router import (
    AllModelsUnavailableError,
    ModelRouter,
    ModelSpec,
    RetryableModelError,
)

MODELS = (
    ModelSpec("big-model", "smart"),
    ModelSpec("small-model", "fast"),
)


class FakeClock:
    def __init__(self) -> None:
        self.now = 0.0

    def __call__(self) -> float:
        return self.now


def make_client(behaviour: dict):
    """behaviour maps model_id -> list of responses ('ok' or an Exception)."""
    calls = []

    def client(model_id, messages, **kwargs):
        calls.append(model_id)
        outcome = behaviour[model_id].pop(0)
        if isinstance(outcome, Exception):
            raise outcome
        return outcome

    client.calls = calls
    return client


def test_uses_preferred_tier_first():
    client = make_client({"big-model": ["answer"], "small-model": []})
    router = ModelRouter(client, MODELS, clock=FakeClock())
    text, model = router.complete([{"role": "user", "content": "hi"}], tier="smart")
    assert (text, model) == ("answer", "big-model")


def test_falls_back_on_retryable_error():
    client = make_client(
        {"big-model": [RetryableModelError("429")], "small-model": ["fallback answer"]}
    )
    router = ModelRouter(client, MODELS, clock=FakeClock())
    text, model = router.complete([{"role": "user", "content": "hi"}], tier="smart")
    assert model == "small-model"
    assert text == "fallback answer"


def test_cooldown_skips_failed_model_until_expiry():
    clock = FakeClock()
    client = make_client(
        {
            "big-model": [RetryableModelError("429"), "recovered"],
            "small-model": ["fallback", "fallback"],
        }
    )
    router = ModelRouter(client, MODELS, base_cooldown=15.0, clock=clock)

    router.complete([], tier="smart")  # big fails -> cooldown, small answers
    _, model = router.complete([], tier="smart")  # big still cooling
    assert model == "small-model"

    clock.now = 16.0  # past cooldown
    _, model = router.complete([], tier="smart")
    assert model == "big-model"


def test_cooldown_grows_exponentially():
    clock = FakeClock()
    client = make_client(
        {
            "big-model": [RetryableModelError("boom"), RetryableModelError("boom")],
            "small-model": ["a", "b"],
        }
    )
    router = ModelRouter(client, MODELS, base_cooldown=10.0, clock=clock)

    router.complete([], tier="smart")  # strike 1 -> cooldown 10s
    clock.now = 11.0
    router.complete([], tier="smart")  # strike 2 -> cooldown 20s
    clock.now = 30.0  # 11 + 20 = 31, still cooling
    assert "big-model" not in router.available_models()
    clock.now = 32.0
    assert "big-model" in router.available_models()


def test_raises_when_everything_is_down():
    client = make_client(
        {
            "big-model": [RetryableModelError("down")],
            "small-model": [RetryableModelError("down")],
        }
    )
    router = ModelRouter(client, MODELS, clock=FakeClock())
    with pytest.raises(AllModelsUnavailableError):
        router.complete([], tier="smart")


def test_success_resets_strikes():
    clock = FakeClock()
    client = make_client(
        {
            "big-model": [RetryableModelError("x"), "ok", RetryableModelError("x")],
            "small-model": ["fb", "fb"],
        }
    )
    router = ModelRouter(client, MODELS, base_cooldown=10.0, clock=clock)

    router.complete([], tier="smart")  # strike 1
    clock.now = 11.0
    router.complete([], tier="smart")  # success -> strikes reset
    router.complete([], tier="smart")  # fails again -> cooldown back to 10s, not 20s
    clock.now = 22.0
    assert "big-model" in router.available_models()
