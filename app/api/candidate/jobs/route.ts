import authOptions from "@/lib/auth";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

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

    const candidate = await db.candidateProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        candidateSkills: {
          include: {
            skill: true,
          },
        },
      },
    });

    if (!candidate) {
      return NextResponse.json(
        { message: "Candidate profile not found" },
        { status: 404 }
      );
    }

    const jobs = await db.job.findMany({
      where: {
        status: "PUBLISHED",
        deletedAt: null,
        ...(search
          ? {
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

    const candidateSkillSet = new Set(
      candidate.candidateSkills.map((item) =>
        item.skill.name.trim().toLowerCase()
      )
    );

    const formattedJobs = jobs.map((job) => {
      const requiredSkills = job.skills.map((item) => item.skill.name);
      const matchedSkills = requiredSkills.filter((skill) =>
        candidateSkillSet.has(skill.trim().toLowerCase())
      );
      const missingSkills = requiredSkills.filter(
        (skill) => !candidateSkillSet.has(skill.trim().toLowerCase())
      );

      const matchScore =
        requiredSkills.length > 0
          ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
          : 0;

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
        matchedSkills,
        missingSkills,
        matchScore,
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
