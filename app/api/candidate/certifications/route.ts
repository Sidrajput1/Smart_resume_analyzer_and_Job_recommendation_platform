import authOptions from "@/lib/auth";
import { db } from "@/lib/db";
import { certificationSchema } from "@/lib/validators/certification";
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
        certifications: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    return NextResponse.json({ certifications: profile?.certifications ?? [] });
  } catch (error) {
    console.error("GET_CANDIDATE_CERTIFICATION_ERROR:", error);
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
    const parsed = certificationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const certification = await db.certification.create({
      data: {
        candidateProfileId: candidate!.id,
        title: parsed.data.title,
        issuer: parsed.data.issuer,
        credentialId: parsed.data.credentialId ?? null,
        credentialUrl: parsed.data.credentialUrl ?? null,
        issueDate: parsed.data.issueDate ? new Date(parsed.data.issueDate) : null,
        expiryDate: parsed.data.expiryDate ? new Date(parsed.data.expiryDate) : null,
      },
    });

    return NextResponse.json(
      {
        message: "Certification added successfully",
        certification,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST_CANDIDATE_CERTIFICATION_ERROR:", error);
    return NextResponse.json(
      { message: "Failed to add certification" },
      { status: 500 },
    );
  }
}
