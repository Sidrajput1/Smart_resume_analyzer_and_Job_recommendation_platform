import authOptions from "@/lib/auth";
import { db } from "@/lib/db";
import { projectSchema } from "@/lib/validators/project";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

async function getCandidateProfileForSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      session: null,
      candidate: null,
      response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }

  if (session.user.role !== "CANDIDATE") {
    return {
      session,
      candidate: null,
      response: NextResponse.json({ message: "Forbidden" }, { status: 403 }),
    };
  }

  const candidate = await db.candidateProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!candidate) {
    return {
      session,
      candidate: null,
      response: NextResponse.json(
        { message: "Candidate profile not found" },
        { status: 404 },
      ),
    };
  }

  return { session, candidate, response: null };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { candidate, response } = await getCandidateProfileForSession();
    if (response) return response;

    const { id } = await context.params;
    const body = await request.json();
    const parsed = projectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const existing = await db.candidateProject.findFirst({
      where: {
        id,
        candidateProfileId: candidate!.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }

    const project = await db.candidateProject.update({
      where: { id },
      data: {
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        technologies: parsed.data.technologies ?? null,
        githubUrl: parsed.data.githubUrl ?? null,
        liveUrl: parsed.data.liveUrl ?? null,
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
      },
    });

    return NextResponse.json({
      message: "Project updated successfully",
      project,
    });
  } catch (error) {
    console.error("PATCH_CANDIDATE_PROJECT_ERROR:", error);
    return NextResponse.json(
      { message: "Failed to update project" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { candidate, response } = await getCandidateProfileForSession();
    if (response) return response;

    const { id } = await context.params;
    const existing = await db.candidateProject.findFirst({
      where: {
        id,
        candidateProfileId: candidate!.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }

    await db.candidateProject.delete({ where: { id } });

    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("DELETE_CANDIDATE_PROJECT_ERROR:", error);
    return NextResponse.json(
      { message: "Failed to delete project" },
      { status: 500 },
    );
  }
}
