import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

function calculateMatchScore(candidateSkills: string[], jobSkills: string[]) {
  if (!jobSkills.length) return 0;

  const candidateSet = new Set(
    candidateSkills.map((s) => s.trim().toLowerCase())
  );

  const matched = jobSkills.filter((skill) =>
    candidateSet.has(skill.trim().toLowerCase())
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
          companyId: recruiter?.companyId,
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
           // intelligence: true as any,
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

    const formatted = applications.map((app) => {
      const candidateSkills = app.candidateProfile.candidateSkills.map(
        (item) => item.skill.name
      );
      const jobSkills = app.job.skills.map((item) => item.skill.name);

      const matchedSkills = jobSkills.filter((skill) =>
        candidateSkills.some(
          (candidateSkill) =>
            candidateSkill.trim().toLowerCase() === skill.trim().toLowerCase()
        )
      );

      const missingSkills = jobSkills.filter(
        (skill) =>
          !candidateSkills.some(
            (candidateSkill) =>
              candidateSkill.trim().toLowerCase() === skill.trim().toLowerCase()
          )
      );

      const liveMatchScore = calculateMatchScore(candidateSkills, jobSkills);

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
          skills: app.candidateProfile.candidateSkills.map(
            (item) => item.skill.name
          ),
          intelligence: (app.candidateProfile as any).intelligence ?? null,
        },
        matchScore:
          (app.candidateProfile as any).intelligence?.overallScore ??
          liveMatchScore,
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