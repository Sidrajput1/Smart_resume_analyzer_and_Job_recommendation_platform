import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import {
  callAi,
  candidateUserId,
  HttpError,
  ownSession,
  publicSession,
  toErrorResponse,
} from "@/lib/mock-interview";
export const runtime = "nodejs";

interface EvaluationQuestion {
  questionId: string;
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}
interface EvaluationResult {
  method: "LLM" | "HEURISTIC";
  overallScore: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  questions: EvaluationQuestion[];
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  let lockedId: string | null = null;
  let acquiredAt: Date | null = null;
  try {
    const userId = await candidateUserId();
    const sessionId = (await params).sessionId;
    const session = await ownSession(sessionId, userId);
    if (session.status === "COMPLETED")
      return Response.json({ session: publicSession(session) });
    if (
      !["EVALUATING", "EVALUATION_FAILED"].includes(session.status) ||
      session.questions.some((q) => !q.answer)
    ) {
      throw new HttpError(
        "Answer all questions before requesting your report.",
        409,
      );
    }

    // A short lease prevents concurrent evaluation attempts. A crashed request
    // can be retried when the lease expires (2 minutes).
    const acquired = new Date();
    const stale = new Date(Date.now() - 120_000);
    const lock = await db.mockInterviewSession.updateMany({
      where: {
        id: sessionId,
        OR: [
          { status: "EVALUATION_FAILED" },
          { status: "EVALUATING", evaluationStartedAt: null },
          { status: "EVALUATING", evaluationStartedAt: { lt: stale } },
        ],
      },
      data: { status: "EVALUATING", evaluationStartedAt: acquired },
    });
    if (lock.count !== 1) {
      return Response.json(
        { message: "Evaluation already running. Check again shortly." },
        { status: 202 },
      );
    }
    lockedId = sessionId;
    acquiredAt = acquired;

    const result = await callAi<EvaluationResult>("/mock-interview/evaluate", {
      jobTitle: session.interview.application.job.title,
      questions: session.questions.map((q) => ({
        questionId: q.id,
        prompt: q.prompt,
        category: q.category,
        focusSkills: q.focusSkills,
        transcript: q.answer!.transcript,
      })),
    });
    const expectedIds = new Set(session.questions.map((q) => q.id));
    if (
      !result ||
      !["LLM", "HEURISTIC"].includes(result.method) ||
      !Array.isArray(result.questions) ||
      result.questions.length !== expectedIds.size ||
      !Number.isFinite(result.overallScore) ||
      result.overallScore < 0 ||
      result.overallScore > 100 ||
      typeof result.summary !== "string" ||
      !Array.isArray(result.strengths) ||
      !Array.isArray(result.improvements) ||
      !result.questions.every(
        (q) =>
          expectedIds.has(q.questionId) &&
          Number.isFinite(q.score) &&
          q.score >= 0 &&
          q.score <= 100 &&
          typeof q.feedback === "string" &&
          Array.isArray(q.strengths) &&
          Array.isArray(q.improvements),
      ) ||
      new Set(result.questions.map((q) => q.questionId)).size !==
        expectedIds.size
    ) {
      throw new HttpError(
        "The evaluation service returned an invalid report.",
        502,
      );
    }

    await db.$transaction(async (tx) => {
      const updated = await tx.mockInterviewSession.updateMany({
        where: {
          id: sessionId,
          status: "EVALUATING",
          evaluationStartedAt: acquired,
        },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          totalScore: result.overallScore,
          evaluationMethod: result.method,
          report: {
            summary: result.summary,
            strengths: result.strengths,
            improvements: result.improvements,
          } as Prisma.InputJsonValue,
        },
      });
      if (updated.count !== 1)
        throw new HttpError(
          "Evaluation was already completed by another request.",
          409,
        );
      for (const item of result.questions) {
        await tx.mockInterviewAnswer.update({
          where: { questionId: item.questionId },
          data: {
            evaluation: {
              score: item.score,
              feedback: item.feedback,
              strengths: item.strengths,
              improvements: item.improvements,
            } as Prisma.InputJsonValue,
          },
        });
      }
    });
    const completed = await ownSession(sessionId, userId);
    return Response.json({ session: publicSession(completed) });
  } catch (error) {
    // Retryable state for upstream failures; don't leave an attempt permanently stuck.
    if (lockedId && acquiredAt) {
      try {
        await db.mockInterviewSession.updateMany({
          where: {
            id: lockedId,
            status: "EVALUATING",
            evaluationStartedAt: acquiredAt,
          },
          data: { status: "EVALUATION_FAILED", evaluationStartedAt: null },
        });
      } catch {
        /* Original error remains authoritative. */
      }
    }
    return toErrorResponse(error);
  }
}
