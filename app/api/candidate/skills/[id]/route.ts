import authOptions from "@/lib/auth";
import { db } from "@/lib/db";
import { candidateSkillUpdateSchema } from "@/lib/validators/skill";
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
    const parsed = candidateSkillUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const existing = await db.candidateSkill.findFirst({
      where: {
        id,
        candidateProfileId: candidate!.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ message: "Skill not found" }, { status: 404 });
    }

    const updated = await db.candidateSkill.update({
      where: { id },
      data: {
        proficiencyLevel: parsed.data.proficiencyLevel ?? existing.proficiencyLevel,
        yearsOfExperience:
          parsed.data.yearsOfExperience === undefined
            ? existing.yearsOfExperience
            : parsed.data.yearsOfExperience,
        isPrimary: parsed.data.isPrimary ?? existing.isPrimary,
        notes:
          parsed.data.notes === undefined ? existing.notes : parsed.data.notes,
      },
      include: { skill: true },
    });

    return NextResponse.json({
      message: "Skill updated successfully",
      candidateSkill: updated,
    });
  } catch (error) {
    console.error("PATCH_CANDIDATE_SKILL_ERROR:", error);
    return NextResponse.json(
      { message: "Failed to update skill" },
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
    const existing = await db.candidateSkill.findFirst({
      where: {
        id,
        candidateProfileId: candidate!.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ message: "Skill not found" }, { status: 404 });
    }

    await db.candidateSkill.delete({ where: { id } });

    return NextResponse.json({ message: "Skill removed successfully" });
  } catch (error) {
    console.error("DELETE_CANDIDATE_SKILL_ERROR:", error);
    return NextResponse.json(
      { message: "Failed to remove skill" },
      { status: 500 },
    );
  }
}
