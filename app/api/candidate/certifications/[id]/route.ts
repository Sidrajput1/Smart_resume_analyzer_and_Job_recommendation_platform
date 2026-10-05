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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { candidate, response } = await getCandidateProfileForSession();
    if (response) return response;

    const { id } = await context.params;
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

    const existing = await db.certification.findFirst({
      where: {
        id,
        candidateProfileId: candidate!.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ message: "Certification not found" }, { status: 404 });
    }

    const certification = await db.certification.update({
      where: { id },
      data: {
        title: parsed.data.title,
        issuer: parsed.data.issuer,
        credentialId: parsed.data.credentialId ?? null,
        credentialUrl: parsed.data.credentialUrl ?? null,
        issueDate: parsed.data.issueDate ? new Date(parsed.data.issueDate) : null,
        expiryDate: parsed.data.expiryDate ? new Date(parsed.data.expiryDate) : null,
      },
    });

    return NextResponse.json({
      message: "Certification updated successfully",
      certification,
    });
  } catch (error) {
    console.error("PATCH_CANDIDATE_CERTIFICATION_ERROR:", error);
    return NextResponse.json(
      { message: "Failed to update certification" },
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
    const existing = await db.certification.findFirst({
      where: {
        id,
        candidateProfileId: candidate!.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ message: "Certification not found" }, { status: 404 });
    }

    await db.certification.delete({ where: { id } });

    return NextResponse.json({ message: "Certification deleted successfully" });
  } catch (error) {
    console.error("DELETE_CANDIDATE_CERTIFICATION_ERROR:", error);
    return NextResponse.json(
      { message: "Failed to delete certification" },
      { status: 500 },
    );
  }
}
