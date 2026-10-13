"""Protected endpoints called ONLY by your authenticated Next.js server."""
from fastapi import APIRouter, Depends
from core.security import check_internal_token
from schemas.mock_interview import GenerateInput, GeneratedResult, EvaluateInput, EvaluationResult
from services.mock_interview_service import generate_questions, evaluate_answers

router = APIRouter(
    prefix="/mock-interview",
    tags=["mock-interview"],
    dependencies=[Depends(check_internal_token)],
)

@router.post("/generate", response_model=GeneratedResult)
def generate(payload: GenerateInput) -> GeneratedResult:
    return generate_questions(payload)

@router.post("/evaluate", response_model=EvaluationResult)
def evaluate(payload: EvaluateInput) -> EvaluationResult:
    return evaluate_answers(payload)
