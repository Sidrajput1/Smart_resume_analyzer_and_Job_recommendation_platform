import authOptions from "@/lib/auth";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(_request:Request,context: { params: Promise<{ id: string }> }){

    try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "CANDIDATE") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;

    const candidate = await db.candidateProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!candidate) {
      return NextResponse.json(
        { message: "Candidate profile not found" },
        { status: 404 }
      );
    }

    const application = await db.jobApplication.findFirst({
      where: {
        id,
        candidateProfileId: candidate.id,
        deletedAt: null,
      },
      include: {
        job: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { message: "Application not found" },
        { status: 404 }
      );
    }

    if (application.status === "WITHDRAW") {
      return NextResponse.json(
        { message: "Application is already withdrawn" },
        { status: 409 }
      );
    }

    if (application.status === "HIRED" || application.status === "REJECTED") {
      return NextResponse.json(
        { message: "Final applications cannot be withdrawn" },
        { status: 400 }
      );
    }

    const updated = await db.jobApplication.update({
      where: { id },
      data: {
        status: "WITHDRAW",
        respondedAt: new Date(),
        reviewedAt: new Date(),
      },
    });

    await db.notification.create({
      data: {
        userId: session.user.id,
        type: "APPLICATION",
        title: "Application withdrawn",
        message: `You withdrew your application for ${application.job.title}.`,
        link: "/candidate/applications",
        metadata: {
          applicationId: updated.id,
          jobId: application.jobId,
          status: "WITHDRAWN",
        },
      },
    });

    return NextResponse.json({
      message: "Application withdrawn successfully",
      application: updated,
    });
  } catch (error) {
    console.error("WITHDRAW_APPLICATION_ERROR:", error);
    return NextResponse.json(
      { message: "Failed to withdraw application" },
      { status: 500 }
    );
  }

}