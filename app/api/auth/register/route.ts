import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validators/auth";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function generateUniqueSlug(tx: typeof db, baseName: string) {
  const baseSlug = slugify(baseName);
  let slug = baseSlug;
  let count = 1;

  while (await tx.company.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${count}`;
    count += 1;
  }

  return slug;
}

// this route handles -
// candidate registration , recruiter registration , password hashing, duplicate email protection,
// automatci candidate profile creation , automatic company creation for recruiter , recruiter profile creation and clean JSON response for React Query

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Validate failed",
          errors: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const existingUser = await db.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Email already exist" },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    if (data.role === "CANDIDATE") {
      const user = await db.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role: Role.CANDIDATE,
          candidate: {
            create: {},
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          candidate: {
            select: {
              id: true,
            },
          },
        },
      });

      return NextResponse.json(
        {
          message: "Candidate account created successfully",
          user,
        },
        { status: 201 },
      );
    }

    // adding recruiter registration

    const result = await db.$transaction(async (tx) => {
      const slug = await generateUniqueSlug(tx, data.companyName);

      const company = await tx.company.create({
        data: {
          name: data.companyName,
          slug,
        },
      });

      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role: Role.RECRUITER,
          recruiter: {
            create: {
              companyId: company.id,
              designation: data.designation ?? null,
              phone: data.phone ?? null,
            },
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          recruiter: {
            select: {
              id: true,
              companyId: true,
            },
          },
        },
      });

      return { user, company };
    });

    return NextResponse.json(
      {
        message: "Recruiter account added successfully",
        ...result,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("REGISTER_API_ERROR:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
