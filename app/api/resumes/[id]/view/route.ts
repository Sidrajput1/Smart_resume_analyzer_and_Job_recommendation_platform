import authOptions from "@/lib/auth";
import { db } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabase-admin";

import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET || "candidate-resumes";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const resume = await db.resume.findUnique({
      where: { id },
      select: {
        id: true,
        fileUrl: true,
        candidateProfileId: true,
        candidateProfile: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!resume?.fileUrl) {
      return NextResponse.json(
        { message: "Resume not found" },
        { status: 404 }
      );
    }

    const isOwner =
      session.user.role === "CANDIDATE" &&
      resume.candidateProfile.userId === session.user.id;

    let isAuthorizedRecruiter = false;

    if (session.user.role === "RECRUITER") {
      const recruiter =
        await db.recruiterProfile.findUnique({
          where: {
            userId: session.user.id,
          },
          select: {
            companyId: true,
          },
        });

      if (recruiter) {
        // Recruiters may view resumes attached to
        // applications for jobs belonging to their company.
        const application =
          await db.jobApplication.findFirst({
            where: {
              resumeId: resume.id,
              candidateProfileId:
                resume.candidateProfileId,
              deletedAt: null,
              job: {
                companyId: recruiter.companyId,
                deletedAt: null,
              },
            },
            select: {
              id: true,
            },
          });

        isAuthorizedRecruiter = Boolean(application);
      }
    }

    if (!isOwner && !isAuthorizedRecruiter) {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      );
    }

    if (!resume.fileUrl.startsWith("supabase:")) {
      return NextResponse.json(
        {
          message:
            "This resume uses legacy local storage. Please migrate it.",
        },
        { status: 409 }
      );
    }

    const storagePath = resume.fileUrl.slice(
      "supabase:".length
    );

    // Generate a temporary URL for an authorized viewer.
    const { data, error } =
      await supabaseAdmin.storage
        .from(BUCKET)
        .createSignedUrl(storagePath, 60);

    if (error || !data?.signedUrl) {
      return NextResponse.json(
        { message: "Unable to open resume" },
        { status: 500 }
      );
    }

    return NextResponse.redirect(data.signedUrl, {
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("VIEW_RESUME_ERROR:", error);

    return NextResponse.json(
      { message: "Failed to open resume" },
      { status: 500 }
    );
  }
}