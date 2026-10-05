import authOptions from "@/lib/auth";
import { db } from "@/lib/db";
import { readFile } from "fs/promises";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import path from "path";

export const runtime = "nodejs";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://127.0.0.1:8001";

function normalizeSkillName(skill: string) {
  return skill.trim().toLowerCase();
}

//helper function to build a summary string from the intelligence data
function buildSummary(intelligence: {
  overallScore: number;
  atsScore: number;
  strengths: string[];
  recommendedRoles: string[];
}) {
  const strengths =
    intelligence.strengths.slice(0, 3).join(", ") || "good technical potential";
  const roles =
    intelligence.recommendedRoles.slice(0, 2).join(", ") ||
    "software developer";
  return `Overall score ${intelligence.overallScore}/100, ATS score ${intelligence.atsScore}/100. Strong areas include ${strengths}. Recommended roles: ${roles}.`;
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const candidate = await db.candidateProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        resume: true,
      },
    });

    if (!candidate) {
      return NextResponse.json(
        { message: "Candidate profile not found" },
        { status: 404 },
      );
    }

    if (!candidate.resume) {
      return NextResponse.json(
        { message: "Please upload your resume first" },
        { status: 400 },
      );
    }

    if (!candidate.resume.fileUrl) {
      return NextResponse.json(
        { message: "Resume file not found" },
        { status: 404 },
      );
    }

    // read the resume file from the public folder
    const filePath = path.join(
      process.cwd(),
      "public",
      candidate.resume.fileUrl,
    );
    const fileBuffer = await readFile(filePath);

    const formData = new FormData();

    // append the resume file to the form data
    formData.append(
      "file",
      new Blob([fileBuffer], {
        type: candidate.resume.mimeType ?? "application/pdf",
      }),
      candidate.resume.fileName ?? "resume.pdf",
    );

    // call the AI service to analyze the resume
    const aiResponse = await fetch(`${AI_SERVICE_URL}/analyze-resume`, {
      method: "POST",
      body: formData,
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      return NextResponse.json(
        {
          message: "AI service failed",
          error: errorText,
        },
        { status: 500 },
      );
    }

    const result = await aiResponse.json();
    const parsed = result?.data?.parsed;
    const intelligence = result?.data?.intelligence;

    if (!parsed || !intelligence) {
      return NextResponse.json(
        { message: "Invalid AI response" },
        { status: 500 },
      );
    }

    const summary = buildSummary(intelligence);

    const extractedSkills: string[] = parsed.skillsFound ?? [];

     const record = await db.$transaction(async (tx) => {
      // 1) Sync extracted skills into SkillMaster + CandidateSkill
      for (const skillName of extractedSkills) {
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
            data: {
              name: skillName,
            },
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
            notes: "Extracted automatically from resume",
          },
          update: {
            proficiencyLevel: "ADVANCED",
            notes: "Extracted automatically from resume",
          },
        });
      }

      // 2) Save candidate intelligence
      const intelligenceRecord = await tx.candidateIntelligence.upsert({
        where: {
          candidateProfileId: candidate.id,
        },
        create: {
          candidateProfileId: candidate.id,
          resumeId: candidate.resume.id,
          overallScore: intelligence.overallScore,
          atsScore: intelligence.atsScore,
          skillScore: intelligence.skillScore,
          experienceScore: intelligence.experienceScore,
          educationScore: intelligence.educationScore,
          projectScore: intelligence.projectScore,
          strengths: intelligence.strengths ?? [],
          weaknesses: intelligence.weaknesses ?? [],
          skillGaps: intelligence.skillGaps ?? [],
          recommendedRoles: intelligence.recommendedRoles ?? [],
          summary,
          suggestions: Array.isArray(intelligence.suggestions)
            ? intelligence.suggestions.join("\n")
            : "",
          modelVersion: "phase-4-v1",
          analysisMetadata: {
            parsed,
            intelligence,
          },
        },
        update: {
          resumeId: candidate.resume.id,
          overallScore: intelligence.overallScore,
          atsScore: intelligence.atsScore,
          skillScore: intelligence.skillScore,
          experienceScore: intelligence.experienceScore,
          educationScore: intelligence.educationScore,
          projectScore: intelligence.projectScore,
          strengths: intelligence.strengths ?? [],
          weaknesses: intelligence.weaknesses ?? [],
          skillGaps: intelligence.skillGaps ?? [],
          recommendedRoles: intelligence.recommendedRoles ?? [],
          summary,
          suggestions: Array.isArray(intelligence.suggestions)
            ? intelligence.suggestions.join("\n")
            : "",
          modelVersion: "phase-4-v1",
          analysisMetadata: {
            parsed,
            intelligence,
          },
          deletedAt: null,
        },
      });

      // 3) Save extracted text to resume
      await tx.resume.update({
        where: { id: candidate.resume.id },
        data: {
          extractedText: parsed.cleanedText,
          parsedAt: new Date(),
        },
      });

      return intelligenceRecord;
    });

    return NextResponse.json({
      message: "Candidate intelligence generated successfully",
      intelligence: record,
    });
  } catch (error) {
    console.log("GENERATE_INTELLIGENCE_ERROR:", error);
    return NextResponse.json(
      {
        message: "Failed to generate candidate intelligence",
      },
      { status: 500 }
    );
  }
  
}