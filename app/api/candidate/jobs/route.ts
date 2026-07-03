import { matchJobsForResume } from "@/lib/ai";
import authOptions from "@/lib/auth";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";


function normalizeSkillName(skill: string) {
  return skill
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function isSameSkill(a: string, b: string) {
  return normalizeSkillName(a) === normalizeSkillName(b);
}

function getCandidateSkillNames(candidate: any) {
  const dbSkills =
    candidate.candidateSkills?.map((item: any) => item.skill?.name).filter(Boolean) ?? [];

  if (dbSkills.length > 0) return dbSkills;

  const parsedSkills = candidate.intelligence?.analysisMetadata?.parsed?.skillsFound;
  if (Array.isArray(parsedSkills) && parsedSkills.length > 0) {
    return parsedSkills.filter(Boolean);
  }

  return [];
}

function buildResumeText(candidate:any){
  const parts = [
    candidate.resume?.extractedText ?? "",
    candidate.resume?.summary ?? "",
    candidate.headline ?? "",
    candidate.bio ?? "",
    candidate.candidateSkills?.map((s: any) => s.skill?.name).filter(Boolean).join(" "),
    candidate.educations
      ?.map((e: any) => [e.institutionName, e.degree, e.fieldOfStudy].filter(Boolean).join(" "))
      .join(" "),
    candidate.experiences
      ?.map((e: any) => [e.companyName, e.jobTitle, e.description].filter(Boolean).join(" "))
      .join(" "),
    candidate.projects
      ?.map((p: any) => [p.title, p.description, p.technologies].filter(Boolean).join(" "))
      .join(" "),
    candidate.certifications
      ?.map((c: any) => [c.title, c.issuer].filter(Boolean).join(" "))
      .join(" "),

  ];

  return parts.filter(Boolean).join(" ");
};



function heuristicMatchScore(candidateSkills: string[], jobSkills: string[]) {
  if (!jobSkills.length) return 0;

  const candidateSet = new Set(
    candidateSkills.map((s) => normalizeSkillName(s))
  );

  const matched = jobSkills.filter((skill) =>
    candidateSet.has(normalizeSkillName(skill))
  );

  return Math.round((matched.length / jobSkills.length) * 100);
}



export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "CANDIDATE") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    };

     const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";

    // find candidate profile for the user
    const candidate = await db.candidateProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        resume:true,
        intelligence:true,
        educations:{orderBy:{createdAt:"desc"}},
         experiences: { orderBy: { createdAt: "desc" } },
        projects: { orderBy: { createdAt: "desc" } },
        certifications: { orderBy: { createdAt: "desc" } },
        candidateSkills: {
          include: {
            skill: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!candidate) {
      return NextResponse.json(
        { message: "Candidate profile not found" },
        { status: 404 }
      );
    }

    // fetch jobs that are published and not deleted, and match the search criteria if provided
    const jobs = await db.job.findMany({
      where: {
        status: "PUBLISHED",
        deletedAt: null,
        ...(search
          ? {
            // search in job title, description, and company name
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                {
                  company: {
                    name: { contains: search, mode: "insensitive" },
                  },
                },
              ],
            }
          : {}),
      },
      // include related data in the response
      include: {
        company: true,
        skills: {
          include: {
            skill: true,
          },
        },
        applications: {
          where: {
            candidateProfileId: candidate.id,
          },
          select: {
            id: true,
            status: true,
            appliedAt: true,
          },
        },
      },
      orderBy: {
        publishedAt: "desc",
      },
    });

    // const candidateSkillSet = new Set(
    //   candidate.candidateSkills.map((item) =>
    //     item.skill.name.trim().toLowerCase()
    //   )
    // );
    
    // get candidate skill names from database or parsed resume
    const candidateSkillNames  = getCandidateSkillNames(candidate);

    // bbild resume text from candidate profile data 
    const resumeText = buildResumeText(candidate);
    // prepare jobs data for AI matching
    const jobsForAi = jobs.map((job) => ({
      jobId: job.id,
      title: job.title,
      description: job.description,
      responsibilities: job.responsibilities ?? "",
      benefits: job.benefits ?? "",
      companyName: job.company.name,
      jobType: job.jobType,
      workMode: job.workMode,
      location: [job.locationCity, job.locationState, job.locationCountry]
        .filter(Boolean)
        .join(", "),
      skills: job.skills.map((item) => item.skill.name),
    }));

    // call AI function to match jobs for the candidate's resume
    const aiResults = await matchJobsForResume(resumeText, jobsForAi);
    

    type AiResult = {
      jobId: string;
      matchScore?: number;
      matchedTerms?: string[];
    };

    //const aiMap = new Map((aiResults ?? []).map((item:any) => [item.jobId,item]));
    // create a map of AI results for quick lookup by jobId
    const aiMap = new Map<string, AiResult>(
      (aiResults ?? []).map((item: any) => [item.jobId as string, item as AiResult])
    );

    // format jobs data with matched skills, missing skills, and match scores
    const formattedJobs = jobs.map((job) => {
  const requiredSkills = job.skills.map((item) => item.skill.name);

  const matchedSkills = requiredSkills.filter((skill) =>
    candidateSkillNames.some((candidateSkill:any) =>
      isSameSkill(candidateSkill, skill)
    )
  );

  const missingSkills = requiredSkills.filter(
    (skill) =>
      !candidateSkillNames.some((candidateSkill:any) =>
        isSameSkill(candidateSkill, skill)
      )
  );
  // calculate fallback match score using heuristic if AI match score is not available
  const fallbackMatchScore =
    requiredSkills.length > 0
      ? heuristicMatchScore(candidateSkillNames, requiredSkills)
      : 0;

   // get AI match result for the job if available   
  const aiMatch = aiMap.get(job.id);
  const application = job.applications[0];

  return {
    id: job.id,
    slug: job.slug,
    title: job.title,
    description: job.description,
    jobType: job.jobType,
    workMode: job.workMode,
    locationCity: job.locationCity,
    locationState: job.locationState,
    locationCountry: job.locationCountry,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    currency: job.currency,
    company: {
      name: job.company.name,
      logo: job.company.logo,
      industry: job.company.industry,
    },
    requiredSkills,
    matchedSkills: aiMatch?.matchedTerms?.length ? aiMatch.matchedTerms : matchedSkills,
    missingSkills,
    matchScore: aiMatch?.matchScore ?? fallbackMatchScore,
    isApplied: Boolean(application),
    applicationStatus: application?.status ?? null,
    appliedAt: application?.appliedAt ?? null,
    applicationDeadline: job.applicationDeadline,
    publishedAt: job.publishedAt,
  };
});

    

    return NextResponse.json({ jobs: formattedJobs });
  } catch (error) {
    console.error("GET_CANDIDATE_JOBS_ERROR:", error);
    return NextResponse.json(
      { message: "Failed to load jobs" },
      { status: 500 }
    );
  }
}
