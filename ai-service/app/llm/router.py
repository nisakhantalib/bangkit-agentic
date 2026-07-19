"""Multi-model fallback router with per-model cooldown.

Python port of the v1 (TypeScript) resilience layer: when a model fails with a
retryable error (rate limit, provider outage), it is placed on an
exponentially-growing cooldown and the router falls through to the next model.

The LLM client is injected as a callable so this module has no hard dependency
on any provider SDK — which also makes it trivially unit-testable.
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass
from typing import Callable, Literal, Sequence

logger = logging.getLogger(__name__)

Tier = Literal["fast", "smart", "vision"]

# client(model_id, messages, **kwargs) -> str
LLMClient = Callable[..., str]


class RetryableModelError(Exception):
    """Raised by clients for failures worth falling back on (429, 5xx, timeouts)."""


class AllModelsUnavailableError(RuntimeError):
    """Every candidate model is on cooldown or failed."""


@dataclass(frozen=True)
class ModelSpec:
    id: str
    tier: Tier


DEFAULT_MODELS: tuple[ModelSpec, ...] = (
    ModelSpec("llama-3.3-70b-versatile", "smart"),
    ModelSpec("llama-3.1-8b-instant", "fast"),
    # Vision-capable models accept image content blocks (transcription/OCR).
    ModelSpec("meta-llama/llama-4-scout-17b-16e-instruct", "vision"),
    ModelSpec("meta-llama/llama-4-maverick-17b-128e-instruct", "vision"),
)


@dataclass
class _ModelState:
    cooldown_until: float = 0.0
    strikes: int = 0


class ModelRouter:
    """Routes a completion request across a prioritized pool of models.

    - ``tier`` expresses a preference, not a hard constraint: models of the
      requested tier are tried first, then everything else. An answer from a
      smaller model beats no answer.
    - A retryable failure puts the model on cooldown for
      ``base_cooldown * 2**strikes`` seconds (capped at ``max_cooldown``);
      a success resets its strikes.
    """

    def __init__(
        self,
        client: LLMClient,
        models: Sequence[ModelSpec] = DEFAULT_MODELS,
        base_cooldown: float = 15.0,
        max_cooldown: float = 300.0,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        self._client = client
        self._models = tuple(models)
        self._base_cooldown = base_cooldown
        self._max_cooldown = max_cooldown
        self._clock = clock
        self._state: dict[str, _ModelState] = {m.id: _ModelState() for m in self._models}

    # -- public API ---------------------------------------------------------

    def complete(self, messages: list[dict], tier: Tier = "smart", **kwargs) -> tuple[str, str]:
        """Return ``(response_text, model_id)`` from the first healthy model."""
        errors: list[str] = []
        for model in self._candidates(tier):
            try:
                text = self._client(model.id, messages, **kwargs)
            except RetryableModelError as exc:
                self._penalize(model.id)
                errors.append(f"{model.id}: {exc}")
                logger.warning("model %s failed, cooling down: %s", model.id, exc)
                continue
            self._state[model.id].strikes = 0
            return text, model.id
        raise AllModelsUnavailableError("; ".join(errors) or "all models on cooldown")

    def available_models(self) -> list[str]:
        now = self._clock()
        return [m.id for m in self._models if self._state[m.id].cooldown_until <= now]

    # -- internals ----------------------------------------------------------

    def _candidates(self, tier: Tier) -> list[ModelSpec]:
        now = self._clock()
        healthy = [m for m in self._models if self._state[m.id].cooldown_until <= now]
        # "vision" is a hard requirement, not a preference: a text-only model
        # cannot read an image, so we must never fall through to one. Other
        # tiers stay soft — a smaller model beats no answer. We also never fall
        # UP into a vision model for a text request (they are pricier/slower).
        if tier == "vision":
            return [m for m in healthy if m.tier == "vision"]
        preferred = [m for m in healthy if m.tier == tier]
        rest = [m for m in healthy if m.tier not in (tier, "vision")]
        return preferred + rest

    def _penalize(self, model_id: str) -> None:
        state = self._state[model_id]
        cooldown = min(self._base_cooldown * (2**state.strikes), self._max_cooldown)
        state.cooldown_until = self._clock() + cooldown
        state.strikes += 1
