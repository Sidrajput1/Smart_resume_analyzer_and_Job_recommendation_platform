import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import authOptions from "@/lib/auth";
import { db } from "@/lib/db";
import { rankCandidatesForJob } from "@/lib/ai";

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

  const parsedSkills =
    candidate.intelligence?.analysisMetadata?.parsed?.skillsFound;

  if (Array.isArray(parsedSkills) && parsedSkills.length > 0) {
    return parsedSkills.filter(Boolean);
  }

  return [];
}

function buildCandidateText(candidate: any) {
  const parts = [
    candidate.user?.name ?? "",
    candidate.headline ?? "",
    candidate.bio ?? "",
    candidate.resume?.extractedText ?? "",
    candidate.candidateSkills?.map((s: any) => s.skill?.name).filter(Boolean).join(" "),
    candidate.educations
      ?.map((e: any) =>
        [e.institutionName, e.degree, e.fieldOfStudy].filter(Boolean).join(" ")
      )
      .join(" "),
    candidate.experiences
      ?.map((e: any) =>
        [e.companyName, e.jobTitle, e.description].filter(Boolean).join(" ")
      )
      .join(" "),
    candidate.projects
      ?.map((p: any) =>
        [p.title, p.description, p.technologies].filter(Boolean).join(" ")
      )
      .join(" "),
    candidate.certifications
      ?.map((c: any) => [c.title, c.issuer].filter(Boolean).join(" "))
      .join(" "),
    candidate.intelligence?.recommendedRoles?.join(" ") ?? "",
  ];

  return parts.filter(Boolean).join(" ");
}

function buildJobText(job: any) {
  const parts = [
    job.title ?? "",
    job.description ?? "",
    job.responsibilities ?? "",
    job.benefits ?? "",
    job.company?.name ?? "",
    job.skills?.map((s: any) => s.skill?.name).filter(Boolean).join(" "),
  ];

  return parts.filter(Boolean).join(" ");
}

function heuristicMatchScore(candidateSkills: string[], jobSkills: string[]) {
  if (!jobSkills.length) return 0;

  const candidateSet = new Set(candidateSkills.map((s) => normalizeSkillName(s)));

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

    if (session.user.role !== "RECRUITER") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    //parse search and status query parameters from the request URL
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";


    const recruiter = await db.recruiterProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        companyId: true,
      },
    });

    if (!recruiter) {
      return NextResponse.json(
        { message: "Recruiter profile not found" },
        { status: 404 }
      );
    }

    const applications = await db.jobApplication.findMany({
      where: {
        job: {
          companyId: recruiter.companyId,
          deletedAt: null,
          ...(status ? { status: status as any } : {}),
        },
        ...(search
          ? {
              OR: [
                {
                  candidateProfile: {
                    user: {
                      name: { contains: search, mode: "insensitive" },
                    },
                  },
                },
                {
                  candidateProfile: {
                    headline: { contains: search, mode: "insensitive" },
                  },
                },
                {
                  job: {
                    title: { contains: search, mode: "insensitive" },
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        candidateProfile: {
          include: {
            user: true,
            resume: true,
            educations: {
              orderBy: { createdAt: "desc" },
            },
            experiences: {
              orderBy: { createdAt: "desc" },
            },
            projects: {
              orderBy: { createdAt: "desc" },
            },
            certifications: {
              orderBy: { createdAt: "desc" },
            },
            candidateSkills: {
              include: {
                skill: true,
              },
            },
            intelligence: true,
          },
        },
        job: {
          include: {
            skills: {
              include: {
                skill: true,
              },
            },
            company: true,
          },
        },
        resume: true,
      },
      orderBy: {
        appliedAt: "desc",
      },
    });

    // group applications by jobId to prepare for AI ranking
    const applicationsByJob = new Map<string, any[]>();

    
    for (const app of applications) {
      const list = applicationsByJob.get(app.jobId) ?? [];
      list.push(app);
      applicationsByJob.set(app.jobId, list);
    }

    const mlScoreMap = new Map<string, number>();
    // call AI function to rank candidates for each job and store the match scores in a map
    for (const [jobId, groupApplications] of applicationsByJob.entries()) {
      const firstApp = groupApplications[0];
      const jobText = buildJobText(firstApp.job);

      const candidatesForAi = groupApplications.map((app) => ({
        candidateId: app.candidateProfile.id,
        name: app.candidateProfile.user.name,
        headline: app.candidateProfile.headline ?? "",
        resumeText: buildCandidateText(app.candidateProfile),
        skills: getCandidateSkillNames(app.candidateProfile),
        recommendedRoles: app.candidateProfile.intelligence?.recommendedRoles ?? [],
        location: [
          app.candidateProfile.city,
          app.candidateProfile.state,
          app.candidateProfile.country,
        ]
          .filter(Boolean)
          .join(", "),
      }));

      const ranked = await rankCandidatesForJob(jobText, candidatesForAi);

      if (ranked) {
        for (const item of ranked as any[]) {
          mlScoreMap.set(`${jobId}:${item.candidateId}`, item.matchScore);
        }
      }
    }
    // format applications with matched skills, missing skills, and match scores
    const formatted = applications.map((app) => {
      const candidateSkillNames = getCandidateSkillNames(app.candidateProfile);
      const jobSkills = app.job.skills.map((item) => item.skill.name);

      const matchedSkills = jobSkills.filter((skill) =>
        candidateSkillNames.some((candidateSkill:any) =>
          isSameSkill(candidateSkill, skill)
        )
      );

      const missingSkills = jobSkills.filter(
        (skill) =>
          !candidateSkillNames.some((candidateSkill:any) =>
            isSameSkill(candidateSkill, skill)
          )
      );

      const fallbackMatchScore = heuristicMatchScore(candidateSkillNames, jobSkills);
      const mlMatchScore = mlScoreMap.get(`${app.jobId}:${app.candidateProfile.id}`);

      return {
        id: app.id,
        status: app.status,
        appliedAt: app.appliedAt,
        reviewedAt: app.reviewedAt,
        respondedAt: app.respondedAt,
        coverLetter: app.coverLetter,
        recruiterNotes: app.recruiterNotes,
        job: {
          id: app.job.id,
          title: app.job.title,
          slug: app.job.slug,
          companyName: app.job.company.name,
          jobType: app.job.jobType,
          workMode: app.job.workMode,
          status: app.job.status,
        },
        candidate: {
          id: app.candidateProfile.id,
          name: app.candidateProfile.user.name,
          email: app.candidateProfile.user.email,
          headline: app.candidateProfile.headline,
          city: app.candidateProfile.city,
          state: app.candidateProfile.state,
          country: app.candidateProfile.country,
          phone: app.candidateProfile.phone,
          resume: app.resume
            ? {
                id: app.resume.id,
                title: app.resume.title,
                fileUrl: app.resume.fileUrl,
                fileName: app.resume.fileName,
                mimeType: app.resume.mimeType,
              }
            : null,
          educationCount: app.candidateProfile.educations.length,
          experienceCount: app.candidateProfile.experiences.length,
          projectCount: app.candidateProfile.projects.length,
          certificationCount: app.candidateProfile.certifications.length,
          skills: candidateSkillNames,
          intelligence: app.candidateProfile.intelligence ?? null,
        },
        matchScore: mlMatchScore ?? fallbackMatchScore,
        matchedSkills,
        missingSkills,
      };
    });

    return NextResponse.json({
      applications: formatted,
      recruiter: {
        companyId: recruiter.companyId,
      },
    });
  } catch (error) {
    console.error("GET_RECRUITER_CANDIDATES_ERROR:", error);
    return NextResponse.json(
      { message: "Failed to load candidates" },
      { status: 500 }
    );
  }
}