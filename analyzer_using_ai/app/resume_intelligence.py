import re

from typing import Dict,List

ROLE_SKILL_BENCHMARKS = {
    "Frontend Developer": ["React", "Next.js", "TypeScript", "Tailwind CSS", "Redux", "Testing"],
    "Full Stack Developer": ["React", "Next.js", "Node.js", "PostgreSQL", "Prisma", "Docker"],
    "Backend Developer": ["Python", "FastAPI", "Node.js", "PostgreSQL", "Docker", "Redis"],
    "Python Developer": ["Python", "FastAPI", "Django", "PostgreSQL", "Git"],
    "Data Analyst": ["Python", "Pandas", "NumPy", "SQL", "Excel"],
    "ML Engineer": ["Python", "Pandas", "NumPy", "Scikit-learn", "Machine Learning"],
    "DevOps Engineer": ["Docker", "AWS", "Linux", "Git", "Redis"],
    "Web Developer": ["HTML", "CSS", "JavaScript", "React", "Node.js"],
    "Software Developer": ["DSA", "OOP", "JavaScript", "Python", "SQL"],
}

SKILL_ALIASES: Dict[str, List[str]] = {
    "React": ["react", "reactjs"],
    "Next.js": ["next.js", "nextjs", "next"],
    "TypeScript": ["typescript", "ts"],
    "JavaScript": ["javascript", "js"],
    "Node.js": ["node.js", "nodejs", "node"],
    "Express.js": ["express", "express.js", "expressjs"],
    "Python": ["python"],
    "FastAPI": ["fastapi"],
    "Django": ["django"],
    "Flask": ["flask"],
    "PostgreSQL": ["postgresql", "postgres"],
    "MySQL": ["mysql"],
    "MongoDB": ["mongodb", "mongo"],
    "Prisma": ["prisma"],
    "Docker": ["docker"],
    "Redis": ["redis"],
    "AWS": ["aws", "amazon web services"],
    "Git": ["git"],
    "GitHub": ["github"],
    "Tailwind CSS": ["tailwind", "tailwind css"],
    "HTML": ["html"],
    "CSS": ["css"],
    "Redux": ["redux"],
    "Zod": ["zod"],
    "TanStack Query": ["tanstack query", "react query"],
    "Axios": ["axios"],
    "Socket.io": ["socket.io", "socketio"],
    "JWT": ["jwt", "json web token"],
    "Razorpay": ["razorpay"],
    "Cloudinary": ["cloudinary"],
    "OpenAI": ["openai"],
    "LangChain": ["langchain"],
    "Pandas": ["pandas"],
    "NumPy": ["numpy"],
    "Scikit-learn": ["scikit-learn", "sklearn"],
}

SECTION_KEYWORDS = {
    "summary": ["summary", "profile", "professional summary", "objective"],
    "education": ["education", "academic background", "qualification"],
    "experience": ["experience", "work history", "employment", "internship"],
    "projects": ["projects", "project work"],
    "skills": ["skills", "technical skills", "core skills"],
    "certifications": ["certifications", "certificates"],
    "achievements": ["achievements", "awards"],
}

EMAIL_PATTERN = r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"
PHONE_PATTERN = r"(\+?\d[\d\s().-]{8,}\d)"


def normalize_text(text:str) -> str:
    return re.sub(r"\s+"," ",text.lower()).strip()


# function for detect skill
def detect_skills(text:str) -> List[str]:
    normalized = normalize_text(text)
    found = []

    for canonical, aliases in SKILL_ALIASES.items():
        for alias in aliases:
            pattern = r"\b" + re.escape(alias.lower()) + r"\b"
            if re.search(pattern, normalized):
                found.append(canonical)
                break

    return sorted(set(found))

# function for detect sections


def detect_sections(text:str) -> List[str]:
    normalized = normalize_text(text)
    found = []

    for section_name , keywords in SECTION_KEYWORDS.items():
        if any(re.search(r"\b" + re.escape(keyword.lower()) + r"\b", normalized) for keyword in keywords):
            found.append(section_name)

    return found

# check contact info

def has_contact_info(text: str) -> Dict[str, bool]:
    return {
        "hasEmail": bool(re.search(EMAIL_PATTERN, text)),
        "hasPhone": bool(re.search(PHONE_PATTERN, text)),
    }

# extract skill , which want by the recruier

def build_skill_gaps(recommended_roles:List[str],skills:List[str]) -> List[str]:
    skill_set = {skill.lower() for skill in skills}
    gaps = []

    for role in recommended_roles:
        benchmark = ROLE_SKILL_BENCHMARKS.get(role,[])
        for skill in benchmark:
            if skill.lower() not in skill_set and skill not in gaps:
                gaps.append(skill)

    return gaps[:10]


def build_suggestions(sections:List[str],skills:List[str],text:str) -> List[str]:
    suggestions = []

    if "summary" not in sections:
        suggestions.append("Add a short professional summary at the top of the resume.")
    
    if "experience" not in sections:
        suggestions.append("Add work experience or internship details with measurable outcomes.")
    
    if "projects" not in sections:
        suggestions.append("Add 2-3 strong projects with technologies and impact.")

    if "skills" not in sections:
        suggestions.append("Create a dedicated skills section with relevant technologies.")

    if "education" not in sections:
        suggestions.append("Add education details in a clean structured format.")

    if len(skills) < 6:
        suggestions.append("Include more relevant technical keywords to improve ATS visibility.")

    if len(text) < 1500:
        suggestions.append("Expand the resume with more detail, achievements, and project impact.")

    return suggestions


def build_strengths(skills: List[str], sections: List[str]) -> List[str]:
    strengths = []

    if len(skills) >= 8:
        strengths.append("Strong technical skill coverage")
    elif len(skills) >= 4:
        strengths.append("Good technical skill coverage")

    if "projects" in sections:
        strengths.append("Projects section available")

    if "experience" in sections:
        strengths.append("Experience section available")

    if "education" in sections:
        strengths.append("Education section available")

    if "summary" in sections:
        strengths.append("Professional summary included")

    return strengths


def build_weaknesses(sections: List[str], skills: List[str]) -> List[str]:
    weaknesses = []

    if "summary" not in sections:
        weaknesses.append("Missing professional summary")
    if "experience" not in sections:
        weaknesses.append("Missing experience section")
    if "projects" not in sections:
        weaknesses.append("Missing projects section")
    if "skills" not in sections:
        weaknesses.append("Missing skills section")
    if len(skills) < 5:
        weaknesses.append("Low keyword density")

    return weaknesses



def recommend_roles(skills: List[str]) -> List[str]:
    skill_blob = " ".join(skills).lower()
    roles = []

    if any(key in skill_blob for key in ["react", "next.js", "typescript", "tailwind", "javascript"]):
        roles.extend(["Frontend Developer", "Full Stack Developer"])

    if any(key in skill_blob for key in ["node.js", "express.js", "python", "fastapi", "django", "flask"]):
        roles.extend(["Backend Developer", "Full Stack Developer"])

    if any(key in skill_blob for key in ["pandas", "numpy", "scikit-learn"]):
        roles.extend(["Data Analyst", "ML Engineer"])

    if any(key in skill_blob for key in ["docker", "aws", "redis", "postgresql"]):
        roles.extend(["DevOps Engineer", "Backend Developer"])

    if not roles:
        roles = ["Software Developer", "Web Developer"]

    return sorted(set(roles))


def compute_scores(text: str, sections: List[str], skills: List[str]) -> Dict[str,float]:
    contact = has_contact_info(text)

    section_score = min(30,len(sections) * 5)

    skill_score = min(35, len(skills) * 4)
    contact_score = (5 if contact["hasEmail"] else 0) + (5 if contact["hasPhone"] else 0)

    length = len(text)
    if length > 3500:
        length_score = 10
    elif length > 2000:
        length_score = 8
    elif length > 1000:
        length_score = 5
    elif length > 500:
        length_score = 3
    else:
        length_score = 1

    ats_score = min(100, section_score + skill_score + contact_score + length_score)

    experience_score = 20 if "experience" in sections else 5
    education_score = 15 if "education" in sections else 5
    project_score = 20 if "projects" in sections else 5
    summary_score = 10 if "summary" in sections else 2

    overall_score = round(
        (ats_score * 0.35)
        + (skill_score * 0.25)
        + (experience_score * 0.15)
        + (education_score * 0.10)
        + (project_score * 0.10)
        + (summary_score * 0.05)
    )

    return {
        "overallScore": min(100, overall_score),
        "atsScore": ats_score,
        "skillScore": skill_score,
        "experienceScore": experience_score,
        "educationScore": education_score,
        "projectScore": project_score,
    }




def analyze_resume_text(text: str) -> Dict:
    cleaned_text = text.strip()
    sections = detect_sections(cleaned_text)
    skills = detect_skills(cleaned_text)
    contact = has_contact_info(cleaned_text)

    scores = compute_scores(cleaned_text, sections, skills)
    suggestions = build_suggestions(sections, skills, cleaned_text)
    roles = recommend_roles(skills)
    skill_gaps = build_skill_gaps(roles,skills)

    return {
        "cleanedText": cleaned_text,
        "sectionsFound": sections,
        "skillsFound": skills,
        "strengths": build_strengths(skills, sections),
        "weaknesses": build_weaknesses(sections, skills),
        "skillGaps":skill_gaps,
        "suggestions": suggestions,
        "recommendedRoles": recommend_roles(skills),
        "hasEmail": contact["hasEmail"],
        "hasPhone": contact["hasPhone"],
        **scores,
    }


