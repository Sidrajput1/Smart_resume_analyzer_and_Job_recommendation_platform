import axios from "axios";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export class HttpError extends Error {
  constructor(
    message: string,
    public statusCode = 400,
  ) {
    super(message);
  }
}

export async function candidateUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new HttpError("Sign in to continue.", 401);
  if (session.user.role !== "CANDIDATE") throw new HttpError("Forbidden.", 403);
  return session.user.id;
}

export async function ownInterview(interviewId: string, userId: string) {
  if (!interviewId || interviewId.length > 128)
    throw new HttpError("Invalid interview ID.", 400);
  const interview = await db.interview.findFirst({
    where: {
      id: interviewId,
      application: { candidateProfile: { userId }, deletedAt: null },
    },
    select: {
      id: true,
      status: true,
      scheduledAt: true,
      application: {
        select: {
          candidateProfile: {
            select: {
              resume: { select: { extractedText: true } },
              candidateSkills: {
                select: { skill: { select: { name: true } } },
              },
            },
          },
          job: {
            select: {
              title: true,
              description: true,
              responsibilities: true,
              skills: { select: { skill: { select: { name: true } } } },
              company: { select: { name: true } },
            },
          },
        },
      },
    },
  });
  if (!interview) throw new HttpError("Interview not found.", 404);
  return interview;
}

export async function ownSession(sessionId: string, userId: string) {
  if (!sessionId || sessionId.length > 128)
    throw new HttpError("Invalid session ID.", 400);
  const session = await db.mockInterviewSession.findFirst({
    where: {
      id: sessionId,
      interview: {
        application: { candidateProfile: { userId }, deletedAt: null },
      },
    },
    include: {
      questions: {
        orderBy: { position: "asc" },
        include: { answer: true },
      },
      interview: {
        select: {
          application: { select: { job: { select: { title: true } } } },
        },
      },
    },
  });
  if (!session) throw new HttpError("Practice attempt not found.", 404);
  return session;
}

export function publicSession(session: Awaited<ReturnType<typeof ownSession>>) {
  const isCompleted = session.status === "COMPLETED";
  const next = session.questions.find(
    (q) => q.position === session.currentQuestion,
  );
  return {
    id: session.id,
    interviewId: session.interviewId,
    attemptNumber: session.attemptNumber,
    status: session.status,
    questionCount: session.questionCount,
    currentQuestion: session.currentQuestion,
    questionSource: session.questionSource,
    evaluationMethod: session.evaluationMethod,
    jobTitle: session.interview.application.job.title,
    createdAt: session.createdAt,
    completedAt: session.completedAt,
    // Hide all unanswered questions AND answer evaluations until completion.
    question:
      session.status === "IN_PROGRESS" && next
        ? {
            id: next.id,
            position: next.position,
            prompt: next.prompt,
            category: next.category,
          }
        : null,
    submittedCount: session.questions.filter((q) => q.answer !== null).length,
    report: isCompleted ? session.report : null,
    totalScore: isCompleted ? session.totalScore : null,
    answers: isCompleted
      ? session.questions.map((q) => ({
          questionId: q.id,
          prompt: q.prompt,
          category: q.category,
          transcript: q.answer?.transcript ?? "",
          evaluation: q.answer?.evaluation ?? null,
        }))
      : [],
  };
}

export const aiInternal = axios.create({
  baseURL: process.env.AI_SERVICE_URL || "http://127.0.0.1:8001",
  timeout: 55000,
  headers: { "Content-Type": "application/json" },
});

export async function callAi<T>(route: string, body: unknown): Promise<T> {
  const token = process.env.AI_INTERNAL_TOKEN;
  if (!token)
    throw new HttpError("AI_INTERNAL_TOKEN is not configured on Next.js.", 503);
  try {
    const { data } = await aiInternal.post<T>(route, body, {
      headers: { "X-Internal-Token": token },
    });
    return data;
  } catch (error) {
    // No raw payload/logging: resume and transcript data are sensitive.
    // console.error(
    //   "Mock interview AI service request failed:",
    //   axios.isAxiosError(e) ? (e.response?.status ?? e.code) : "Unknown error",
    // );
    if (axios.isAxiosError(error)) {
    console.error("FASTAPI ERROR:", {
      status: error.response?.status,
      detail: error.response?.data?.detail,
      code: error.code,
    });
  }
    throw new HttpError("AI service unavailable. Please try again.", 503);
  }
}

export function toErrorResponse(error: unknown) {
  if (error instanceof HttpError)
    return Response.json(
      { message: error.message },
      { status: error.statusCode },
    );
  console.error(
    "Mock interview API error:",
    error instanceof Error ? error.name : "Unknown error",
  );
  return Response.json(
    { message: "Request could not be completed." },
    { status: 500 },
  );
}
