import authOptions from "@/lib/auth";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // GET request logic here
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          message: "unauthorized",
        },
        { status: 401 },
      );
    }

    if (session.user.role !== "CANDIDATE") {
      return NextResponse.json(
        {
          message: "Forbidden",
        },
        { status: 403 },
      );
    }

    const candidate = await db.candidateProfile.findUnique({
      where: { userId: session?.user?.id },
      select: { id: true },
    });

    if (!candidate) {
      return NextResponse.json(
        { message: "Candidate profile not found" },
        { status: 404 },
      );
    }

    const applications = await db.jobApplication.findMany({
      where: {
        candidateProfileId: candidate.id,
        deletedAt: null,
      },
      include: {
        job: {
          include: {
            company: true,
            skills: {
              include: {
                skill: true,
              },
            },
          },
        },
        resume: true,
      },
      orderBy: {
        appliedAt: "desc",
      },
    });

    const formatted = applications.map((app) => ({
      id: app.id,
      status: app.status,
      appliedAt: app.appliedAt,
      reviewedAt: app.reviewedAt,
      respondedAt: app.respondedAt,
      recruiterNotes: app.recruiterNotes,
      job: {
        id: app.job.id,
        title: app.job.title,
        slug: app.job.slug,
        companyName: app.job.company.name,
        companyLogo: app.job.company.logo,
        jobType: app.job.jobType,
        workMode: app.job.workMode,
        status: app.job.status,
        locationCity: app.job.locationCity,
        locationState: app.job.locationState,
        locationCountry: app.job.locationCountry,
        salaryMin: app.job.salaryMin,
        salaryMax: app.job.salaryMax,
        currency: app.job.currency,
        requiredSkills: app.job.skills.map((s) => s.skill.name),
      },
      resume: app.resume
        ? {
            id: app.resume.id,
            title: app.resume.title,
            fileName: app.resume.fileName,
            fileUrl: app.resume.fileUrl,
          }
        : null,
    }));

    return NextResponse.json({ applications: formatted });
  } catch (error) {
    console.error("GET_CANDIDATE_APPLICATIONS_ERROR:", error);
    return NextResponse.json(
      { message: "Failed to load applications" },
      { status: 500 },
    );
  }
}
