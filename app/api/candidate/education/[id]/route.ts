import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { educationSchema } from "@/lib/validators/education";

// for update
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const parsed = educationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: parsed.error.flatten(),
        },
        { status: 400 }
      );
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
      return NextResponse.json(
        { message: "Candidate profile not found" },
        { status: 404 }
      );
    }

    const existing = await db.education.findFirst({
      where: {
        id,
        candidateProfileId: candidate.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Education not found" },
        { status: 404 }
      );
    }

    const education = await db.education.update({
      where: {
        id,
      },
      data: {
        institutionName: parsed.data.institutionName,
        degree: parsed.data.degree,
        fieldOfStudy: parsed.data.fieldOfStudy ?? null,
        grade: parsed.data.grade ?? null,
        description: parsed.data.description ?? null,
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
        endDate:
          parsed.data.isCurrentlyStudying || !parsed.data.endDate
            ? null
            : new Date(parsed.data.endDate),
        isCurrentlyStudying: parsed.data.isCurrentlyStudying ?? false,
      },
    });

    return NextResponse.json({
      message: "Education updated successfully",
      education,
    });
  } catch (error) {
    console.error("PATCH_EDUCATION_ERROR:", error);
    return NextResponse.json(
      { message: "Failed to update education" },
      { status: 500 }
    );
  }
}


// for deletion

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const candidate = await db.candidateProfile.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!candidate) {
      return NextResponse.json(
        { message: "Candidate profile not found" },
        { status: 404 }
      );
    }

    const existing = await db.education.findFirst({
      where: {
        id,
        candidateProfileId: candidate.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Education not found" },
        { status: 404 }
      );
    }

    await db.education.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      message: "Education deleted successfully",
    });
  } catch (error) {
    console.error("DELETE_EDUCATION_ERROR:", error);
    return NextResponse.json(
      { message: "Failed to delete education" },
      { status: 500 }
    );
  }
}