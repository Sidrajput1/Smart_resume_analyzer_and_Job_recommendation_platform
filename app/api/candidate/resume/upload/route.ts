import authOptions from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function sanitizeFileName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-");
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();

    const file = formData.get("file");
    const title = String(formData.get("title") || "My Resume");
    const summary = String(formData.get("summary") || "");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "File is required" },
        { status: 400 },
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { message: "Only PDF and DOCX files are allowed" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: "File size must be less than 5MB" },
        { status: 400 },
      );
    }

    const candidate = await db.candidateProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        resume: true,
      },
    });

    if (!candidate) {
      return NextResponse.json(
        { message: "Candidate profile not found" },
        { status: 404 },
      );
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "resumes");
    await mkdir(uploadDir, { recursive: true });

    const safeName = sanitizeFileName(file.name);
    const storedFileName = `${Date.now()}-${crypto.randomUUID()}-${safeName}`;
    const filePath = path.join(uploadDir, storedFileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/resumes/${storedFileName}`;

    const resume = await db.resume.upsert({
      where: {
        candidateProfileId: candidate.id,
      },
      create: {
        candidateProfileId: candidate.id,
        title,
        summary: summary || null,
        fileUrl,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        status: "COMPLETED",
        visibility: "PRIVATE",
        parsedAt: null,
      },
      update: {
        title,
        summary: summary || null,
        fileUrl,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        status: "COMPLETED",
        visibility: "PRIVATE",
        parsedAt: null,
        extractedText: null,
      },
    });

    return NextResponse.json(
      {
        message: "Resume uploaded successfully",
        resume,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("UPLOAD_RESUME_ERROR:", error);
    return NextResponse.json(
      { message: "Failed to upload resume" },
      { status: 500 },
    );
  }
}
