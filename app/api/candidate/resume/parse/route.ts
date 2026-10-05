import authOptions from "@/lib/auth";
import { db } from "@/lib/db";
import { readFile } from "fs/promises";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import path from "path";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://127.0.0.1:8001";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const candidate = await db.candidateProfile.findUnique({
      where: {
        userId: session.user.id,
      },
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

    if (!candidate.resume.fileName) {
      return NextResponse.json(
        { message: "Resume file name not found" },
        { status: 400 },
      );
    }

    // resume url are stored like /uploads/abc_resume.pdf but we have store lile under project /public/uplaod/resume/abc_resum.pdf

    const relativePath = candidate.resume.fileUrl.replace(/^\/+/, "");

    const filePath = path.join(process.cwd(), "public", relativePath);

    const fileBuffer = await readFile(filePath);

    const formData = new FormData();

    formData.append(
      "file",
      new Blob([fileBuffer], {
        type: candidate.resume.mimeType ?? "application/octet-stream",
      }),
      candidate.resume.fileName,
    );

    const aiResponse = await fetch(`${AI_SERVICE_URL}/parse-resume`, {
      method: "POST",
      body: formData,
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();

      console.error("AI_PARSE_SERVICE_ERROR:", errorText);

      return NextResponse.json(
        {
          message: "Resume parsing service failed",
        },
        { status: 502 },
      );
    }

    const result = await aiResponse.json();

    const parsed = result?.data;

    if (!parsed?.structuredData) {
      return NextResponse.json(
        {
          message: "Resume parser returned invalid data",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "Resume parsed successfully",
      data: parsed,
    });
  } catch (error) {
    console.error("PARSE_CANDIDATE_RESUME_ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to parse resume",
      },
      { status: 500 },
    );
  }
}
