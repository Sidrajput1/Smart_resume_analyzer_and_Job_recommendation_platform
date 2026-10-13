import authOptions from "@/lib/auth";
import { db } from "@/lib/db";
import { InterviewMode } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

class SchedulingError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "SchedulingError";
  }
}

type SchedulePayload = {
  applicationId: string;
  scheduledAt: Date;
  durationMinutes: number;
  mode: InterviewMode;
  meetingUrl: string | null;
  location: string | null;
  notes: string | null;
};

function requiredTrimmed(
  value: unknown,
  field: string,
  maxLength: number,
): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new SchedulingError(`${field} is required.`, 400);
  }
  if (value.trim().length > maxLength) {
    throw new SchedulingError(`${field} is too long.`, 400);
  }
  return value.trim();
}

function optionalTrimmed(
  value: unknown,
  field: string,
  maxLength: number,
): string | null {
  if (value == null || value === "") return null;
  if (typeof value !== "string")
    throw new SchedulingError(`${field} must be text.`, 400);
  const trimmed = value.trim();
  if (trimmed.length > maxLength)
    throw new SchedulingError(`${field} is too long.`, 400);
  return trimmed || null;
}

function parsePayload(body: unknown): SchedulePayload {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new SchedulingError("A JSON object is required.", 400);
  }
  const input = body as Record<string, unknown>;
  const applicationId = requiredTrimmed(
    input.applicationId,
    "Application ID",
    128,
  );

  // ISO 8601 with an explicit offset is required; never interpret a date as server-local time.
  const rawScheduledAt = requiredTrimmed(
    input.scheduledAt,
    "Interview time",
    40,
  );
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(
      rawScheduledAt,
    )
  ) {
    throw new SchedulingError(
      "scheduledAt must be an ISO datetime with a timezone offset.",
      400,
    );
  }
  const scheduledAt = new Date(rawScheduledAt);
  if (
    !Number.isFinite(scheduledAt.getTime()) ||
    scheduledAt.getTime() <= Date.now()
  ) {
    throw new SchedulingError(
      "Choose a valid future interview date and time.",
      400,
    );
  }

  const durationMinutes = input.durationMinutes;
  if (
    typeof durationMinutes !== "number" ||
    ![15, 30, 45, 60, 90, 120].includes(durationMinutes)
  ) {
    throw new SchedulingError("Choose a valid interview duration.", 400);
  }

  if (
    typeof input.mode !== "string" ||
    !Object.values(InterviewMode).includes(input.mode as InterviewMode)
  ) {
    throw new SchedulingError(
      "Choose VIDEO, PHONE, or ONSITE interview mode.",
      400,
    );
  }
  const mode = input.mode as InterviewMode;
  const meetingUrl = optionalTrimmed(input.meetingUrl, "Meeting URL", 2048);
  const location = optionalTrimmed(input.location, "Location", 300);
  const notes = optionalTrimmed(input.notes, "Notes", 2000);

  if (mode === "VIDEO" && meetingUrl) {
    try {
      const url = new URL(meetingUrl);
      if (url.protocol !== "https:") throw new Error("Invalid protocol");
    } catch {
      throw new SchedulingError("Provide a valid HTTPS meeting URL.", 400);
    }
  }
  if (mode === "ONSITE" && !location) {
    throw new SchedulingError(
      "An office/address location is required for an onsite interview.",
      400,
    );
  }

  return {
    applicationId,
    scheduledAt,
    durationMinutes,
    mode,
    meetingUrl: mode === "VIDEO" ? meetingUrl : null,
    location: mode === "ONSITE" ? location : null,
    notes,
  };
}

// post /api/recruiter/interviews for a scheduled application interview

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "RECRUITER") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { message: "Invalid JSON body." },
        { status: 400 },
      );
    }
    const input = parsePayload(body);

    const recruiter = await db.recruiterProfile.findUnique({
      where: { userId: session.user.id },
      select: { companyId: true },
    });
    if (!recruiter) {
      return NextResponse.json(
        { message: "Recruiter profile not found." },
        { status: 404 },
      );
    }

    const application = await db.jobApplication.findFirst({
      where: {
        id: input.applicationId,
        deletedAt: null,
        job: { companyId: recruiter.companyId, deletedAt: null },
      },
      select: {
        id: true,
        status: true,
        jobId: true,
        job: { select: { title: true } },
        candidateProfile: {
          select: { userId: true, user: { select: { name: true } } },
        },
      },
    });
    if (!application) {
      return NextResponse.json(
        { message: "Application not found." },
        { status: 404 },
      );
    }
    if (application.status !== "SHORTLISTED") {
      return NextResponse.json(
        {
          message:
            "Only shortlisted applications can be scheduled for an interview.",
        },
        { status: 409 },
      );
    }
    const now = new Date();
    // All writes succeed or roll back together. The conditional status update also
    // prevents two simultaneous scheduling requests for the same shortlist.
    const interview = await db.$transaction(async (tx) => {
      const updated = await tx.jobApplication.updateMany({
        where: {
          id: application.id,
          status: "SHORTLISTED",
          deletedAt: null,
          job: { companyId: recruiter.companyId, deletedAt: null },
        },
        data: {
          status: "INTERVIEW_SCHEDULED",
          reviewedAt: now,
          respondedAt: now,
        },
      });
      if (updated.count !== 1) {
        throw new SchedulingError(
          "This application has already changed. Refresh and try again.",
          409,
        );
      }

      // Extra protection if a previous workflow manually changed the status.
      const activeInterview = await tx.interview.findFirst({
        where: { applicationId: application.id, status: "SCHEDULED" },
        select: { id: true },
      });
      if (activeInterview) {
        throw new SchedulingError(
          "An active interview already exists for this application.",
          409,
        );
      }

      const created = await tx.interview.create({
        data: {
          applicationId: application.id,
          scheduledAt: input.scheduledAt,
          durationMinutes: input.durationMinutes,
          mode: input.mode,
          meetingUrl: input.meetingUrl,
          location: input.location,
          notes: input.notes,
          status: "SCHEDULED",
          createdById: session.user.id,
        },
        select: {
          id: true,
          applicationId: true,
          scheduledAt: true,
          durationMinutes: true,
          mode: true,
          meetingUrl: true,
          location: true,
          notes: true,
          status: true,
        },
      });
      await tx.applicationEvent.create({
        data: {
          applicationId: application.id,
          actorUserId: session.user.id,
          type: "INTERVIEW_SCHEDULED",
          title: "Interview scheduled",
          message: `An interview has been scheduled for ${application.job.title}.`,
          metadata: {
            interviewId: created.id,
            scheduledAt: created.scheduledAt.toISOString(),
            mode: created.mode,
            durationMinutes: created.durationMinutes,
          },
        },
      });

      await tx.notification.create({
        data: {
          userId: application.candidateProfile.userId,
          type: "APPLICATION",
          title: "Your interview is scheduled",
          message: `Your interview for ${application.job.title} has been scheduled. Open your interviews page to view the date, time, and details.`,
          link: "/candidate/interviews",
          metadata: {
            interviewId: created.id,
            applicationId: application.id,
            jobId: application.jobId,
          },
        },
      });

      return created;
    });

    return NextResponse.json(
      { message: "Interview scheduled successfully.", interview },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof SchedulingError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.statusCode },
      );
    }
    console.error("SCHEDULE_INTERVIEW_ERROR:", error);
    return NextResponse.json(
      { message: "Could not schedule interview." },
      { status: 500 },
    );
  }
}
