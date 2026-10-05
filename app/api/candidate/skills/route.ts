import authOptions from "@/lib/auth";
import { db } from "@/lib/db";
import { candidateSkillSchema } from "@/lib/validators/skill";
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

export async function GET() {
  try {
    const { candidate, response } = await getCandidateProfileForSession();
    if (response) return response;

    const profile = await db.candidateProfile.findUnique({
      where: { id: candidate!.id },
      select: {
        candidateSkills: {
          include: {
            skill: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    return NextResponse.json({ candidateSkills: profile?.candidateSkills ?? [] });
  } catch (error) {
    console.error("GET_CANDIDATE_SKILLS_ERROR:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { candidate, response } = await getCandidateProfileForSession();
    if (response) return response;

    const body = await request.json();
    const parsed = candidateSkillSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const skillName = parsed.data.name.trim();

    const candidateSkill = await db.$transaction(async (tx) => {
      let skill = await tx.skillMaster.findFirst({
        where: {
          name: {
            equals: skillName,
            mode: "insensitive",
          },
        },
      });

      if (!skill) {
        skill = await tx.skillMaster.create({
          data: {
            name: skillName,
          },
        });
      }

      const existing = await tx.candidateSkill.findUnique({
        where: {
          candidateProfileId_skillId: {
            candidateProfileId: candidate!.id,
            skillId: skill.id,
          },
        },
      });

      if (existing) {
        throw Object.assign(new Error("Candidate already has this skill"), {
          code: "P2002",
        });
      }

      return tx.candidateSkill.create({
        data: {
          candidateProfileId: candidate!.id,
          skillId: skill.id,
          proficiencyLevel: parsed.data.proficiencyLevel ?? "INTERMEDIATE",
          yearsOfExperience: parsed.data.yearsOfExperience ?? null,
          isPrimary: parsed.data.isPrimary ?? false,
          notes: parsed.data.notes ?? null,
        },
        include: { skill: true },
      });
    });

    return NextResponse.json(
      {
        message: "Skill added successfully",
        candidateSkill,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    const prismaError = error as { code?: string };
    if (prismaError?.code === "P2002") {
      return NextResponse.json(
        {
          message: "Skill already added to your profile",
        },
        { status: 409 },
      );
    }

    console.error("POST_CANDIDATE_SKILLS_ERROR:", error);
    return NextResponse.json(
      { message: "Failed to add skill" },
      { status: 500 },
    );
  }
}
