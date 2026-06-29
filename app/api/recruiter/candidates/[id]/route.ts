import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const ALLOWED_STATUSES = [
  "APPLIED",
  "SHORTLISTED",
  "INTERVIEW_SCHEDULED",
  "OFFERED",
  "HIRED",
  "REJECTED",
  "WITHDRAWN",
] as const;

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "RECRUITER") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();

    const status = body?.status as string;

    if (!ALLOWED_STATUSES.includes(status as any)) {
      return NextResponse.json(
        { message: "Invalid application status" },
        { status: 400 }
      );
    }

    const recruiter = await db.recruiterProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        companyId: true,
      },
    });

    if (!recruiter) {
      return NextResponse.json(
        { message: "Recruiter profile not found" },
        { status: 404 }
      );
    }

    const application = await db.jobApplication.findFirst({
      where: {
        id,
        job: {
          companyId: recruiter.companyId,
        },
      },
      include: {
        job: true,
        candidateProfile: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { message: "Application not found" },
        { status: 404 }
      );
    }

    const updated = await db.jobApplication.update({
      where: { id },
      data: {
        status: status as any,
        reviewedAt: new Date(),
        respondedAt:
          status === "SHORTLISTED" ||
          status === "INTERVIEW_SCHEDULED" ||
          status === "OFFERED" ||
          status === "HIRED" ||
          status === "REJECTED"
            ? new Date()
            : undefined,
      },
    });

    await db.notification.create({
      data: {
        userId: application.candidateProfile.userId,
        type: "APPLICATION",
        title: "Application status updated",
        message: `Your application for ${application.job.title} is now ${status.replaceAll("_", " ").toLowerCase()}.`,
        link: "/candidate/jobs",
        metadata: {
          applicationId: updated.id,
          jobId: application.jobId,
          status,
        },
      },
    });

    return NextResponse.json({
      message: "Application status updated successfully",
      application: updated,
    });
  } catch (error) {
    console.error("PATCH_RECRUITER_APPLICATION_STATUS_ERROR:", error);
    return NextResponse.json(
      { message: "Failed to update application status" },
      { status: 500 }
    );
  }
}