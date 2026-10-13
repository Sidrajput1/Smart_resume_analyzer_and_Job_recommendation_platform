from typing import Literal
from pydantic import BaseModel,ConfigDict,Field


class StrictBase(BaseModel):
    model_config = ConfigDict(extra="forbid")


class GenerateInput(StrictBase):
    jobTitle: str = Field(min_length=2, max_length=200)
    jobDescription: str = Field(max_length=9000)
    jobSkills: list[str] = Field(default_factory=list, max_length=40)
    resumeText: str = Field(max_length=12000)
    candidateSkills: list[str] = Field(default_factory=list, max_length=60)
    questionCount: int = Field(ge=3, le=8)


class GeneratedQuestion(StrictBase):
    prompt: str = Field(min_length=10, max_length=1500)
    category: str = Field(min_length=2, max_length=80)
    focusSkills: list[str] = Field(default_factory=list, max_length=10)


class GeneratedResult(StrictBase):
    source: Literal["LLM", "TEMPLATE"]
    questions: list[GeneratedQuestion]


class EvaluationInputQuestion(StrictBase):
    questionId: str = Field(min_length=1, max_length=128)
    prompt: str = Field(min_length=10, max_length=1500)
    category: str = Field(max_length=80)
    focusSkills: list[str] = Field(max_length=10)
    transcript: str = Field(min_length=1, max_length=6000)


class EvaluateInput(StrictBase):
    jobTitle: str = Field(min_length=2, max_length=200)
    questions: list[EvaluationInputQuestion] = Field(min_length=3, max_length=8)


class QuestionResult(StrictBase):
    questionId: str
    score: float = Field(ge=0, le=100)
    feedback: str = Field(min_length=3, max_length=1500)
    strengths: list[str]
    improvements: list[str]


class EvaluationResult(StrictBase):
    method: Literal["LLM", "HEURISTIC"]
    overallScore: float = Field(ge=0, le=100)
    summary: str
    strengths: list[str]
    improvements: list[str]
    questions: list[QuestionResult]
