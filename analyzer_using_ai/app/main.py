from typing import List,Optional
import traceback
from pydantic import BaseModel
from fastapi import FastAPI,UploadFile,File,HTTPException
from fastapi.middleware.cors import CORSMiddleware

from resume_parser import parse_resume_file
from resume_intelligence import analyze_resume_text
from match_engine import rank_candidates_for_job,rank_jobs_for_resume


app = FastAPI(title='AI Service for Smart resume Portal')

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/health")

def health_check():
    return {"status":"ok","message":"Ai service is running"}

class JobMatchItem(BaseModel):
    jobId: str
    title: str
    description: str
    companyName: Optional[str] = None
    responsibilities: Optional[str] = ""
    benefits: Optional[str] = ""
    jobType: Optional[str] = None
    workMode: Optional[str] = None
    location: Optional[str] = None
    skills: List[str] = []

class ResumeMatchRequest(BaseModel):
    resumeText: str
    jobs: List[JobMatchItem]


class CandidateRankItem(BaseModel):
    candidateId: str
    name: str
    headline: Optional[str] = ""
    resumeText: str
    skills: List[str] = []
    recommendedRoles: List[str] = []
    location: Optional[str] = None


class CandidateRankRequest(BaseModel):
    jobText: str
    candidates: List[CandidateRankItem]



@app.post("/parse-resume")

async def parse_resume(file:UploadFile = File(...)):
    

    try:
        if not file.filename:
            raise HTTPException(
                status_code=400,
                detail="File name is required",
            )
        file_bytes = await file.read()

        if not file_bytes:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is empty",
            )
        
        result = parse_resume_file(file.filename,file_bytes)
        return{
            "message": "Resume parsed successfully",
            "data": result,
        }

    except HTTPException:
        raise
    except Exception as error:
        print("parse resume error",traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail="failed to parse resume"
        )
    
@app.post("/analyze-resume")

async def analyze_resume(file:UploadFile = File(...)):
    file_bytes = await file.read()

    try:
        parsed = parse_resume_file(file.filename, file_bytes)
        intelligence = analyze_resume_text(parsed["cleanedText"])

        return {
             "message": "Resume intelligence generated successfully",
            "data": {
                "parsed": parsed,
                "intelligence": intelligence,
            },
        }
    except Exception as error:
        return {
            "message": "Failed to analyze resume",
            "error": str(error),
        }

@app.post("/match-jobs")

def match_jobs(paylod:ResumeMatchRequest):
    results = rank_jobs_for_resume(
        paylod.resumeText,
        [job.model_dump() for job in paylod.jobs]
    )

    return {
        "message": "Job matching completed successfully",
        "results": results,
    }


@app.post("/rank-candidates")
def rank_candidates(payload: CandidateRankRequest):
    results = rank_candidates_for_job(
        payload.jobText,
        [candidate.model_dump() for candidate in payload.candidates],
    )

    return {
        "message": "Candidate ranking completed successfully",
        "results": results,
    }
