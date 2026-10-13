import { db } from "@/lib/db";
import {
  candidateUserId,
  HttpError,
  ownSession,
  publicSession,
  toErrorResponse,
} from "@/lib/mock-interview";
export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const userId = await candidateUserId();
    const sessionId = (await params).sessionId;
    const session = await ownSession(sessionId, userId);
    if (session.status !== "IN_PROGRESS")
      throw new HttpError("This attempt is no longer accepting answers.", 409);
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new HttpError("Invalid JSON body.", 400);
    }
    const input = body as Record<string, unknown> | null;
    const transcript =
      typeof input?.transcript === "string" ? input.transcript.trim() : "";
    if (
      typeof input?.questionId !== "string" ||
      !transcript ||
      transcript.length > 6000
    ) {
      throw new HttpError(
        "Select the current question and provide an answer (1–6000 characters).",
        400,
      );
    }
    const question = session.questions.find(
      (q) => q.position === session.currentQuestion,
    );
    if (!question || question.id !== input.questionId || question.answer) {
      throw new HttpError(
        "You must answer the current question in order.",
        409,
      );
    }
    // Protect against double submissions from tabs or rapid clicking.
    await db.$transaction(async (tx) => {
      const updated = await tx.mockInterviewSession.updateMany({
        where: {
          id: sessionId,
          status: "IN_PROGRESS",
          currentQuestion: question.position,
        },
        data: {
          currentQuestion: question.position + 1,
          status:
            question.position + 1 === session.questionCount
              ? "EVALUATING"
              : "IN_PROGRESS",
        },
      });
      if (updated.count !== 1)
        throw new HttpError("Answer already submitted. Refresh the page.", 409);
      await tx.mockInterviewAnswer.create({
        data: { questionId: question.id, transcript },
      });
    });
    const updated = await ownSession(sessionId, userId);
    return Response.json({
      session: publicSession(updated),
      shouldComplete: updated.status === "EVALUATING",
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
