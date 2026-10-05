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
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
    },
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
      where: {
        id: candidate!.id,
      },
      select: {
        experiences: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    return NextResponse.json({ experiences: profile?.experiences ?? [] });
  } catch (error) {
    console.error("GET_CANDIDATE_EXPERIENCE_ERROR:", error);
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

    const experience = await db.experience.create({
      data: {
        candidateProfileId: candidate!.id,
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

    return NextResponse.json(
      {
        message: "Experience added successfully",
        experience,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST_CANDIDATE_EXPERIENCE_ERROR:", error);
    return NextResponse.json(
      { message: "Failed to add experience" },
      { status: 500 },
    );
  }
}
