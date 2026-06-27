import authOptions from "@/lib/auth";
import { db } from "@/lib/db";
import { educationSchema } from "@/lib/validators/education";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const candidate = await db.candidateProfile.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        educations: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!candidate) {
      return NextResponse.json(
        { message: "Candidate profile not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ educations: candidate.educations });
  } catch (error) {
    console.error("GET_EDUCATION_ERROR:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const body = await request.json();
    const parsed = educationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: parsed.error.flatten(),
        },
        { status: 400 },
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
        { status: 404 },
      );
    }

    const education = await db.education.create({
      data: {
        candidateProfileId: candidate.id,
        institutionName: parsed.data.institutionName,
        degree: parsed.data.degree,
        fieldOfStudy: parsed.data.fieldOfStudy ?? null,
        grade: parsed.data.grade ?? null,
        description: parsed.data.description ?? null,
        startDate: parsed.data.startDate
          ? new Date(parsed.data.startDate)
          : null,
        endDate:
          parsed.data.isCurrentlyStudying || !parsed.data.endDate
            ? null
            : new Date(parsed.data.endDate),
        isCurrentlyStudying: parsed.data.isCurrentlyStudying ?? false,
      },
    });

    return NextResponse.json(
      {
        message: "Education added successfully",
        education,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST_EDUCATION_ERROR:", error);
    return NextResponse.json(
      { message: "Failed to add education" },
      { status: 500 },
    );
  }
}
