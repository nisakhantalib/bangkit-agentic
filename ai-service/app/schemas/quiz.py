"""Pydantic contracts for quiz generation and marking.

Every agent node that emits structured data validates against these models, so
malformed LLM output is caught at the boundary rather than leaking downstream.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class QuizQuestion(BaseModel):
    question: str
    type: Literal["objective", "structured"] = "objective"
    options: list[str] = Field(default_factory=list)
    answer: str
    explanation: str = ""


class QuizSpec(BaseModel):
    subject: str
    chapter: str
    difficulty: Literal["beginner", "intermediate", "expert"] = "intermediate"
    questions: list[QuizQuestion]


class CriterionScore(BaseModel):
    criterion: str
    awarded: int
    max_marks: int
    comment: str = ""


class MarkingResult(BaseModel):
    total_awarded: int
    total_max: int
    criteria: list[CriterionScore] = Field(default_factory=list)
    model_answer: str = ""
    feedback: str = ""
