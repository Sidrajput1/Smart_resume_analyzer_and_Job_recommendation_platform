import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "CANDIDATE") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id: jobId } = await context.params;

    const candidate = await db.candidateProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        resume: true,
      },
    });

    if (!candidate) {
      return NextResponse.json(
        { message: "Candidate profile not found" },
        { status: 404 }
      );
    }

    if (!candidate.resume) {
      return NextResponse.json(
        { message: "Please upload your resume before applying" },
        { status: 400 }
      );
    }

    const job = await db.job.findFirst({
      where: {
        id: jobId,
        status: "PUBLISHED",
        deletedAt: null,
      },
    });

    if (!job) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    const existingApplication = await db.jobApplication.findFirst({
      where: {
        candidateProfileId: candidate.id,
        jobId,
      },
    });

    if (existingApplication) {
      return NextResponse.json(
        { message: "You have already applied for this job" },
        { status: 409 }
      );
    }

    const application = await db.jobApplication.create({
      data: {
        candidateProfileId: candidate.id,
        jobId,
        resumeId: candidate.resume.id,
        status: "APPLIED",
      },
    });

    await db.notification.create({
      data: {
        userId: session.user.id,
        type: "APPLICATION",
        title: "Application submitted",
        message: `You successfully applied for ${job.title}.`,
        link: "/candidate/jobs",
        metadata: {
          jobId,
          applicationId: application.id,
        },
      },
    });

    return NextResponse.json(
      {
        message: "Applied successfully",
        application,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("APPLY_JOB_ERROR:", error);
    return NextResponse.json(
      { message: "Failed to apply for job" },
      { status: 500 }
    );
  }
}