import authOptions from "@/lib/auth";
import { db } from "@/lib/db";
import { experienceSchema } from "@/lib/validators/experience";
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
    const parsed = experienceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const existing = await db.experience.findFirst({
      where: {
        id,
        candidateProfileId: candidate!.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ message: "Experience not found" }, { status: 404 });
    }

    const updated = await db.experience.update({
      where: { id },
      data: {
        companyName: parsed.data.companyName,
        jobTitle: parsed.data.jobTitle,
        employmentType: parsed.data.employmentType ?? "FULL_TIME",
        location: parsed.data.location ?? null,
        description: parsed.data.description ?? null,
        responsibilities: parsed.data.responsibilities ?? null,
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
        endDate:
          parsed.data.isCurrent || !parsed.data.endDate
            ? null
            : new Date(parsed.data.endDate),
        isCurrent: parsed.data.isCurrent ?? false,
      },
    });

    return NextResponse.json({
      message: "Experience updated successfully",
      experience: updated,
    });
  } catch (error) {
    console.error("PATCH_CANDIDATE_EXPERIENCE_ERROR:", error);
    return NextResponse.json(
      { message: "Failed to update experience" },
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
    const existing = await db.experience.findFirst({
      where: {
        id,
        candidateProfileId: candidate!.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ message: "Experience not found" }, { status: 404 });
    }

    await db.experience.delete({ where: { id } });

    return NextResponse.json({ message: "Experience deleted successfully" });
  } catch (error) {
    console.error("DELETE_CANDIDATE_EXPERIENCE_ERROR:", error);
    return NextResponse.json(
      { message: "Failed to delete experience" },
      { status: 500 },
    );
  }
}
