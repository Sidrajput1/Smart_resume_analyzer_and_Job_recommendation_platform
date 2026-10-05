import re;

from typing import Any,Dict,List

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def normalize_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s\+\#\.\-]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()

def build_job_document(job: Dict[str, Any]) -> str:
    parts = [
        job.get("title", ""),
        job.get("description", ""),
        job.get("responsibilities", ""),
        job.get("benefits", ""),
        job.get("location", ""),
        " ".join(job.get("skills", [])),
    ]
    return normalize_text(" ".join(parts))


def build_candidate_document(candidate: Dict[str, Any]) -> str:
    parts = [
        candidate.get("name", ""),
        candidate.get("headline", ""),
        candidate.get("resumeText", ""),
        " ".join(candidate.get("skills", [])),
        " ".join(candidate.get("recommendedRoles", [])),
    ]
    return normalize_text(" ".join(parts))


def similarity_to_percent(value: float) -> float:
    return round(float(value) * 100, 2)


def rank_jobs_for_resume(resume_text: str, jobs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not jobs:
        return []

    documents = [normalize_text(resume_text)] + [build_job_document(job) for job in jobs]

    vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2), min_df=1)
    tfidf_matrix = vectorizer.fit_transform(documents)

    similarities = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()

    resume_tokens = set(normalize_text(resume_text).split())
    results: List[Dict[str, Any]] = []

    for job, score in zip(jobs, similarities):
        job_tokens = set(build_job_document(job).split())
        matched_terms = sorted(list(resume_tokens & job_tokens))[:10]

        results.append(
            {
                "jobId": job["jobId"],
                "title": job["title"],
                "companyName": job.get("companyName"),
                "matchScore": similarity_to_percent(score),
                "matchedTerms": matched_terms,
                "jobType": job.get("jobType"),
                "workMode": job.get("workMode"),
                "location": job.get("location"),
            }
        )

    results.sort(key=lambda item: item["matchScore"], reverse=True)
    return results


def rank_candidates_for_job(job_text: str, candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not candidates:
        return []

    documents = [normalize_text(job_text)] + [build_candidate_document(candidate) for candidate in candidates]

    vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2), min_df=1)
    tfidf_matrix = vectorizer.fit_transform(documents)

    similarities = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()

    job_tokens = set(normalize_text(job_text).split())
    results: List[Dict[str, Any]] = []

    for candidate, score in zip(candidates, similarities):
        candidate_tokens = set(build_candidate_document(candidate).split())
        matched_terms = sorted(list(job_tokens & candidate_tokens))[:10]

        results.append(
            {
                "candidateId": candidate["candidateId"],
                "name": candidate["name"],
                "headline": candidate.get("headline"),
                "matchScore": similarity_to_percent(score),
                "matchedTerms": matched_terms,
                "skills": candidate.get("skills", []),
                "location": candidate.get("location"),
            }
        )

    results.sort(key=lambda item: item["matchScore"], reverse=True)
    return results