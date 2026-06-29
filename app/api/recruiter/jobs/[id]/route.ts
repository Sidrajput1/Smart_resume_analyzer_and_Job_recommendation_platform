import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { jobCreateSchema } from "@/lib/validators/job";

async function findOrCreateSkill(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const existing = await db.skillMaster.findFirst({
    where: {
      name: {
        equals: trimmed,
        mode: "insensitive",
      },
    },
  });

  if (existing) return existing;

  return db.skillMaster.create({
    data: {
      name: trimmed,
    },
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "RECRUITER") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const parsed = jobCreateSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const recruiter = await db.recruiterProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!recruiter) {
      return NextResponse.json(
        { message: "Recruiter profile not found" },
        { status: 404 }
      );
    }

    const existingJob = await db.job.findFirst({
      where: {
        id,
        companyId: recruiter.companyId,
        deletedAt: null,
      },
    });

    if (!existingJob) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    const updatedJob = await db.$transaction(async (tx) => {
      const job = await tx.job.update({
        where: { id },
        data: {
          title: parsed.data.title ?? undefined,
          description: parsed.data.description ?? undefined,
          responsibilities: parsed.data.responsibilities ?? undefined,
          benefits: parsed.data.benefits ?? undefined,
          jobType: parsed.data.jobType ?? undefined,
          workMode: parsed.data.workMode ?? undefined,
          status: parsed.data.status ?? undefined,
          locationCity: parsed.data.locationCity ?? undefined,
          locationState: parsed.data.locationState ?? undefined,
          locationCountry: parsed.data.locationCountry ?? undefined,
          experienceLevel: parsed.data.experienceLevel ?? undefined,
          requiredExperienceYears:
            parsed.data.requiredExperienceYears ?? undefined,
          salaryMin: parsed.data.salaryMin ?? undefined,
          salaryMax: parsed.data.salaryMax ?? undefined,
          currency: parsed.data.currency ?? undefined,
          applicationDeadline: parsed.data.applicationDeadline
            ? new Date(parsed.data.applicationDeadline)
            : undefined,
          publishedAt:
            parsed.data.status === "PUBLISHED" && !existingJob.publishedAt
              ? new Date()
              : undefined,
          closedAt:
            parsed.data.status === "CLOSED" || parsed.data.status === "ARCHIVED"
              ? new Date()
              : undefined,
        },
      });

      if (parsed.data.skills) {
        await tx.jobSkill.deleteMany({
          where: { jobId: id },
        });

        for (const skillName of parsed.data.skills) {
          const skill = await findOrCreateSkill(skillName);
          if (!skill) continue;

          await tx.jobSkill.create({
            data: {
              jobId: id,
              skillId: skill.id,
              required: true,
              importance: 5,
            },
          });
        }
      }

      return job;
    });

    const fullJob = await db.job.findUnique({
      where: { id: updatedJob.id },
      include: {
        company: true,
        skills: {
          include: {
            skill: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Job updated successfully",
      job: fullJob,
    });
  } catch (error) {
    console.error("PATCH_RECRUITER_JOB_ERROR:", error);
    return NextResponse.json(
      { message: "Failed to update job" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "RECRUITER") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;

    const recruiter = await db.recruiterProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!recruiter) {
      return NextResponse.json(
        { message: "Recruiter profile not found" },
        { status: 404 }
      );
    }

    const existingJob = await db.job.findFirst({
      where: {
        id,
        companyId: recruiter.companyId,
        deletedAt: null,
      },
    });

    if (!existingJob) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    await db.job.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: "ARCHIVED",
        closedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Job deleted successfully",
    });
  } catch (error) {
    console.error("DELETE_RECRUITER_JOB_ERROR:", error);
    return NextResponse.json(
      { message: "Failed to delete job" },
      { status: 500 }
    );
  }
}