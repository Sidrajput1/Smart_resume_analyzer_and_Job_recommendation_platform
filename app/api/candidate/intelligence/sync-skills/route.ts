import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

function normalizeSkillName(skill: string) {
  return skill.trim().toLowerCase();
}

function parseMaybeJson(value: unknown) {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value;
}

function extractSkillsFromMetadata(metadata: unknown): string[] {
  const data = parseMaybeJson(metadata) as any;

  const possiblePaths = [
    data?.parsed?.skillsFound,
    data?.parsed?.skills,
    data?.skillsFound,
    data?.intelligence?.skillsFound,
    data?.analysis?.skillsFound,
  ];

  for (const item of possiblePaths) {
    if (Array.isArray(item) && item.length > 0) {
      return item
        .map((s) => String(s).trim())
        .filter(Boolean);
    }
  }

  return [];
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const candidate = await db.candidateProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        intelligence: true,
      },
    });

    if (!candidate) {
      return NextResponse.json(
        { message: "Candidate profile not found" },
        { status: 404 }
      );
    }

    const metadata = candidate.intelligence?.analysisMetadata;
    const parsedSkills = extractSkillsFromMetadata(metadata);

    if (parsedSkills.length === 0) {
      return NextResponse.json(
        {
          message: "No parsed skills found in intelligence metadata",
          debug: {
            metadataType: typeof metadata,
            metadataKeys:
              metadata && typeof metadata === "object"
                ? Object.keys(metadata as Record<string, unknown>)
                : [],
          },
        },
        { status: 400 }
      );
    }

    const syncedSkills: string[] = [];

    await db.$transaction(async (tx) => {
      for (const skillNameRaw of parsedSkills) {
        const skillName = skillNameRaw.trim();
        if (!skillName) continue;

        const normalized = normalizeSkillName(skillName);
        if (!normalized) continue;

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
            data: { name: skillName },
          });
        }

        await tx.candidateSkill.upsert({
          where: {
            candidateProfileId_skillId: {
              candidateProfileId: candidate.id,
              skillId: skill.id,
            },
          },
          create: {
            candidateProfileId: candidate.id,
            skillId: skill.id,
            proficiencyLevel: "ADVANCED",
            isPrimary: false,
            notes: "Backfilled from candidate intelligence metadata",
          },
          update: {
            proficiencyLevel: "ADVANCED",
            notes: "Backfilled from candidate intelligence metadata",
          },
        });

        syncedSkills.push(skill.name);
      }
    });

    return NextResponse.json({
      message: "Candidate skills synced successfully",
      syncedSkills,
    });
  } catch (error) {
    console.error("SYNC_SKILLS_ERROR:", error);
    return NextResponse.json(
      { message: "Failed to sync candidate skills" },
      { status: 500 }
    );
  }

  return POST();
}