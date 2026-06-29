import authOptions from "@/lib/auth";
import { db } from "@/lib/db";
import { jobCreateSchema } from "@/lib/validators/job";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function generateUniqueSlug(baseTitle: string) {
  const baseSlug = slugify(baseTitle);
  let slug = baseSlug;
  let count = 1;

  while (await db.job.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${count}`;
    count += 1;
  }

  return slug;
}

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

// api for get request
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "RECRUITER") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";

    const recruiter = await db.recruiterProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        company: true,
      },
    });

    if (!recruiter) {
      return NextResponse.json(
        { message: "Recruiter profile not found" },
        { status: 404 },
      );
    }

    const jobs = await db.job.findMany({
      where: {
        companyId: recruiter.companyId,
        deletedAt: null,
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                { slug: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
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
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedJobs = jobs.map((job) => ({
      id: job.id,
      slug: job.slug,
      title: job.title,
      description: job.description,
      responsibilities: job.responsibilities,
      benefits: job.benefits,
      jobType: job.jobType,
      workMode: job.workMode,
      status: job.status,
      locationCity: job.locationCity,
      locationState: job.locationState,
      locationCountry: job.locationCountry,
      experienceLevel: job.experienceLevel,
      requiredExperienceYears: job.requiredExperienceYears,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      currency: job.currency,
      applicationDeadline: job.applicationDeadline,
      publishedAt: job.publishedAt,
      closedAt: job.closedAt,
      company: {
        id: job.company.id,
        name: job.company.name,
        logo: job.company.logo,
        industry: job.company.industry,
      },
      skills: job.skills.map((item) => item.skill.name),
      applicantsCount: job._count.applications,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    }));

    return NextResponse.json({
      jobs: formattedJobs,
      recruiter: {
        companyId: recruiter.companyId,
        companyName: recruiter.company.name,
      },
    });
  } catch (error) {
    console.error("GET_RECRUITER_JOBS_ERROR:", error);
    return NextResponse.json(
      { message: "Failed to load recruiter jobs" },
      { status: 500 },
    );
  }
}

// api for post request

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "RECRUITER") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = jobCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const recruiter = await db.recruiterProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        company: true,
      },
    });

    if (!recruiter) {
      return NextResponse.json(
        { message: "Recruiter profile not found" },
        { status: 404 },
      );
    }

    const slug = await generateUniqueSlug(parsed.data.title);

    const job = await db.$transaction(async (tx) => {
      const createdJob = await tx.job.create({
        data: {
          companyId: recruiter.companyId,
          postedByID: session?.user?.id,
          slug,
          title: parsed.data.title,
          description: parsed.data.description,
          responsibilities: parsed.data.responsibilities ?? null,
          benefits: parsed.data.benefits ?? null,
          jobType: parsed.data.jobType,
          workMode: parsed.data.workMode,
          status: parsed.data.status ?? "DRAFT",
          locationCity: parsed.data.locationCity ?? null,
          locationState: parsed.data.locationState ?? null,
          locationCountry: parsed.data.locationCountry ?? null,
          experienceLevel: parsed.data.experienceLevel ?? null,
          requiredExperienceYears: parsed.data.requiredExperienceYears ?? null,
          salaryMin: parsed.data.salaryMin ?? null,
          salaryMax: parsed.data.salaryMax ?? null,
          currency: parsed.data.currency || "INR",
          applicationDeadline: parsed.data.applicationDeadline
            ? new Date(parsed.data.applicationDeadline)
            : null,
          publishedAt: parsed.data.status === "PUBLISHED" ? new Date() : null,
        },
      });

      for (const skillName of parsed.data.skills) {
        const skill = await findOrCreateSkill(skillName);

        if (!skill) continue;

        await tx.jobSkill.create({
          data: {
            jobId: createdJob.id,
            skillId: skill.id,
            required: true,
            importance: 5,
          },
        });
      }

      return createdJob;
    });

    const fullJob = await db.job.findUnique({
      where: { id: job.id },
      include: {
        company: true,
        skills: {
          include: {
            skill: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Job created successfully",
        job: fullJob,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST_RECRUITER_JOB_ERROR:", error);
    return NextResponse.json(
      { message: "Failed to create job" },
      { status: 500 },
    );
  }
}
