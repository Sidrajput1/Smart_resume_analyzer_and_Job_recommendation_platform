import { db } from "@/lib/db";
import {
  callAi,
  candidateUserId,
  HttpError,
  ownInterview,
  ownSession,
  publicSession,
  toErrorResponse,
} from "@/lib/mock-interview";
import { Prisma } from "@prisma/client";

export const runtime = "nodejs";

interface GeneratedQuestion {
  prompt: string;
  category: string;
  focusSkills: string[];
}
interface GenerateResult {
  questions: GeneratedQuestion[];
  source: "LLM" | "TEMPLATE";
}

type Context = { params: Promise<{ interviewId: string }> };

export async function GET(_request: Request, { params }: Context) {
  try {
    const userId = await candidateUserId();
    const { interviewId } = await params;
    const interview = await ownInterview(interviewId, userId);
    const attempts = await db.mockInterviewSession.findMany({
      where: { interviewId: interview.id },
      orderBy: { attemptNumber: "desc" },
      select: {
        id: true,
        attemptNumber: true,
        status: true,
        totalScore: true,
        questionSource: true,
        evaluationMethod: true,
        createdAt: true,
        completedAt: true,
      },
    });
    return Response.json({
      jobTitle: interview.application.job.title,
      companyName: interview.application.job.company.name,
      interviewStatus: interview.status,
      attempts,
      maxAttempts: 3,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(_request: Request, { params }: Context) {
  try {
    const userId = await candidateUserId();
    const { interviewId } = await params;
    const interview = await ownInterview(interviewId, userId);
    if (interview.status !== "SCHEDULED")
      throw new HttpError(
        "Mock practice is only available for scheduled interviews.",
        409,
      );

    const prior = await db.mockInterviewSession.findMany({
      where: { interviewId: interview.id },
      orderBy: { attemptNumber: "desc" },
      select: { id: true, attemptNumber: true, status: true },
    });
    const inProgress = prior.find((s) => s.status !== "COMPLETED");
    if (inProgress) {
      const existing = await ownSession(inProgress.id, userId);
      return Response.json({ session: publicSession(existing), resumed: true });
    }
    if (prior.length >= 3)
      throw new HttpError("Maximum 3 practice attempts per interview.", 409);
    const attemptNumber = (prior[0]?.attemptNumber ?? 0) + 1;
    const job = interview.application.job;
    const candidate = interview.application.candidateProfile;

    const result = await callAi<GenerateResult>("/mock-interview/generate", {
      jobTitle: job.title,
      jobDescription: [job.description, job.responsibilities ?? ""]
        .join("\n")
        .slice(0, 9000),
      jobSkills: job.skills.map((s) => s.skill.name),
      resumeText: (candidate.resume?.extractedText || "").slice(0, 12000),
      candidateSkills: candidate.candidateSkills.map((s) => s.skill.name),
      questionCount: 5,
    });
    if (
      !Array.isArray(result.questions) ||
      result.questions.length !== 5 ||
      !["LLM", "TEMPLATE"].includes(result.source)
    ) {
      throw new HttpError("AI service returned invalid questions.", 502);
    }
    for (const item of result.questions) {
      if (
        typeof item.prompt !== "string" ||
        !item.prompt.trim() ||
        item.prompt.length > 1500 ||
        typeof item.category !== "string" ||
        !Array.isArray(item.focusSkills)
      ) {
        throw new HttpError(
          "AI service returned invalid question details.",
          502,
        );
      }
    }
    let created;
    try {
      created = await db.mockInterviewSession.create({
        data: {
          interviewId: interview.id,
          attemptNumber,
          status: "IN_PROGRESS",
          questionSource: result.source,
          questionCount: result.questions.length,
          questions: {
            create: result.questions.map((q, position) => ({
              position,
              prompt: q.prompt,
              category: q.category,
              focusSkills: q.focusSkills.slice(0, 10),
            })),
          },
        },
        select: { id: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new HttpError(
          "Another practice attempt was just started. Refresh to resume it.",
          409,
        );
      }
      throw error;
    }
    const session = await ownSession(created.id, userId);
    return Response.json(
      { session: publicSession(session), resumed: false },
      { status: 201 },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
