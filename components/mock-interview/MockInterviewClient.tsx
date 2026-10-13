"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  LoaderCircle,
  Mic,
  MicOff,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import api from "@/lib/api";

const buttonPrimary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-40";
const buttonSecondary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-card disabled:cursor-not-allowed disabled:opacity-40";
const surface =
  "rounded-md border border-border bg-background p-5 shadow-none sm:p-7";

type Status = "IN_PROGRESS" | "EVALUATING" | "EVALUATION_FAILED" | "COMPLETED";
type Attempt = {
  id: string;
  attemptNumber: number;
  status: Status;
  totalScore: number | null;
  questionSource: string;
  evaluationMethod: string | null;
  createdAt: string;
  completedAt: string | null;
};
type Overview = {
  jobTitle: string;
  companyName: string;
  interviewStatus: string;
  attempts: Attempt[];
  maxAttempts: number;
};
type Evaluation = {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
};
type Session = {
  id: string;
  interviewId: string;
  attemptNumber: number;
  status: Status;
  questionCount: number;
  currentQuestion: number;
  questionSource: string;
  evaluationMethod: string | null;
  jobTitle: string;
  createdAt: string;
  completedAt: string | null;
  submittedCount: number;
  totalScore: number | null;
  question: {
    id: string;
    position: number;
    prompt: string;
    category: string;
  } | null;
  report: {
    summary: string;
    strengths: string[];
    improvements: string[];
  } | null;
  answers: {
    questionId: string;
    prompt: string;
    category: string;
    transcript: string;
    evaluation: Evaluation | null;
  }[];
};

function friendlyError(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } })
      .response;
    if (response?.data?.message) return response.data.message;
  }
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

function prettyDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

// Web Speech API is not yet in every browser's TypeScript definitions.
type RecognitionEvent = {
  results: ArrayLike<{
    isFinal: boolean;
    [index: number]: { transcript: string };
  }>;
};
type RecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type RecognitionConstructor = new () => RecognitionInstance;

function QuestionCard({
  question,
  total,
  sending,
  onSubmit,
}: {
  question: NonNullable<Session["question"]>;
  total: number;
  sending: boolean;
  onSubmit: (questionId: string, transcript: string) => void;
}) {
  const [draft, setDraft] = React.useState("");
  const [interim, setInterim] = React.useState("");
  const [listening, setListening] = React.useState(false);
  const [speechError, setSpeechError] = React.useState("");
  const supported = React.useSyncExternalStore(
    () => () => {},
    () => {
      const browser = window as typeof window & {
        SpeechRecognition?: RecognitionConstructor;
        webkitSpeechRecognition?: RecognitionConstructor;
      };
      return Boolean(
        browser.SpeechRecognition || browser.webkitSpeechRecognition,
      );
    },
    () => false,
  );
  const recognitionRef = React.useRef<RecognitionInstance | null>(null);
  const draftRef = React.useRef("");
  const baseRef = React.useRef("");
  const stopPendingRef = React.useRef(false);

  React.useEffect(() => {
    return () => {
      stopPendingRef.current = true;
      const recognition = recognitionRef.current;
      if (recognition) {
        recognition.onresult = null;
        recognition.onend = null;
        recognition.onerror = null;
        recognition.abort();
      }
      recognitionRef.current = null;
    };
  }, []);

  function updateDraft(value: string) {
    draftRef.current = value;
    setDraft(value);
  }

  function startMicrophone() {
    const browser = window as typeof window & {
      SpeechRecognition?: RecognitionConstructor;
      webkitSpeechRecognition?: RecognitionConstructor;
    };
    const SpeechRecognition =
      browser.SpeechRecognition || browser.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError(
        "Live transcription is unsupported in this browser. Type your answer instead.",
      );
      return;
    }
    if (!window.isSecureContext) {
      setSpeechError("Microphone transcription requires HTTPS or localhost.");
      return;
    }
    setSpeechError("");
    setInterim("");
    stopPendingRef.current = false;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = true;
    recognition.interimResults = true;
    baseRef.current = draftRef.current.trim();
    recognition.onresult = (event) => {
      const finalParts: string[] = [];
      const interimParts: string[] = [];
      for (let i = 0; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) finalParts.push(result[0].transcript);
        else interimParts.push(result[0].transcript);
      }
      updateDraft(
        [baseRef.current, finalParts.join(" ").trim()]
          .filter(Boolean)
          .join(" "),
      );
      setInterim(interimParts.join(" ").trim());
    };
    recognition.onerror = (event) => {
      setSpeechError(
        `Speech recognition: ${event.error}. You can type or retry your microphone.`,
      );
    };
    recognition.onend = () => {
      setListening(false);
      setInterim("");
      recognitionRef.current = null;
    };
    try {
      recognitionRef.current = recognition;
      recognition.start();
      setListening(true);
    } catch {
      recognitionRef.current = null;
      setListening(false);
      setSpeechError(
        "Could not start the microphone. Check browser permissions.",
      );
    }
  }

  function stopMicrophone() {
    if (stopPendingRef.current) return;
    stopPendingRef.current = true;
    recognitionRef.current?.stop(); // Wait for onend before enabling submission.
  }

  return (
    <section className={surface}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.17em] text-primary">
            Practice question {question.position + 1} of {total}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-foreground">
            {question.category}
          </h2>
        </div>
        <span className="rounded-full border border-border bg-card px-3 py-1 text-xs text-foreground">
          Answer in your own words
        </span>
      </div>
      <div className="mb-6 h-2 overflow-hidden rounded-full bg-card">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${(question.position / total) * 100}%` }}
        />
      </div>
      <div className="rounded-xl border border-border bg-accent p-5">
        <p className="text-lg font-medium leading-8 text-foreground">
          {question.prompt}
        </p>
      </div>
      <div className="mt-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label
            htmlFor="mock-transcript"
            className="text-sm font-semibold text-foreground"
          >
            Your answer (live transcript)
          </label>
          <span className="text-xs text-muted-foreground">
            {draft.length} / 6000 characters
          </span>
        </div>
        <textarea
          id="mock-transcript"
          value={draft}
          onChange={(e) => updateDraft(e.target.value)}
          readOnly={listening}
          maxLength={6000}
          rows={8}
          placeholder="Speak using your microphone or type your answer. You can review and edit it before submitting."
          className="min-h-44 w-full resize-y rounded-xl border border-border bg-background p-4 text-sm leading-7 text-foreground placeholder:text-muted-foreground focus:border-border focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
        />
        {interim && (
          <p
            aria-live="polite"
            className="rounded-lg border border-border bg-accent p-3 text-sm italic text-primary"
          >
            Recognizing: {interim}
          </p>
        )}
        {speechError && (
          <p role="alert" className="text-sm text-primary">
            {speechError}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          {listening ? (
            <button
              type="button"
              className={buttonSecondary}
              onClick={stopMicrophone}
              disabled={sending}
            >
              <MicOff className="h-4 w-4" /> Stop microphone
            </button>
          ) : (
            <button
              type="button"
              className={buttonSecondary}
              onClick={startMicrophone}
              disabled={!supported || sending}
            >
              <Mic className="h-4 w-4" />{" "}
              {draft ? "Continue speaking" : "Start microphone"}
            </button>
          )}
          <button
            type="button"
            className={buttonPrimary}
            disabled={
              listening ||
              sending ||
              draft.trim().length < 5 ||
              draft.trim().length > 6000
            }
            onClick={() => onSubmit(question.id, draft.trim())}
          >
            {sending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}{" "}
            {question.position + 1 === total
              ? "Submit & evaluate"
              : "Submit & next question"}
          </button>
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          Voice recognition depends on your browser and may use its speech
          service. Only the final transcript is saved by this application, not a
          microphone audio recording. Review the text before submitting. If
          recognition stops, press Continue speaking.
        </p>
      </div>
    </section>
  );
}

function Report({ session }: { session: Session }) {
  const report = session.report;
  return (
    <div className="space-y-5">
      <section className={surface}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
              Practice report · Attempt {session.attemptNumber}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-foreground">
              Your interview practice results
            </h2>
          </div>
          <div className="rounded-md border border-border bg-accent p-4 text-center">
            <p className="text-3xl font-bold text-foreground">
              {session.totalScore?.toFixed(1) ?? "—"}
              <span className="text-base text-muted-foreground">/100</span>
            </p>
            <p className="text-xs text-primary">Practice estimate</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-7 text-foreground">
          {report?.summary}
        </p>
        <p className="mt-3 rounded-lg bg-card p-3 text-xs text-foreground">
          Method:{" "}
          {session.evaluationMethod === "LLM"
            ? "LLM analysis of written transcripts"
            : "Basic keyword / answer-length heuristic — not a correctness assessment"}
          . Neither is a hiring decision or an assessment of speaking
          confidence, accent, or emotion.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-accent p-4">
            <h3 className="font-semibold text-primary">Strengths</h3>
            <ul className="mt-3 list-disc space-y-2 pl-4 text-sm text-foreground">
              {(report?.strengths || []).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-accent p-4">
            <h3 className="font-semibold text-primary">Improvements</h3>
            <ul className="mt-3 list-disc space-y-2 pl-4 text-sm text-foreground">
              {(report?.improvements || []).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">
          Question-by-question feedback
        </h3>
        {session.answers.map((a, index) => (
          <article key={a.questionId} className={surface}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs uppercase tracking-wider text-primary">
                  Question {index + 1} · {a.category}
                </span>
                <h4 className="mt-2 font-semibold leading-7 text-foreground">
                  {a.prompt}
                </h4>
              </div>
              <span className="shrink-0 rounded-lg bg-accent px-3 py-2 font-semibold text-primary">
                {a.evaluation?.score ?? "—"}/100
              </span>
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Your transcript
            </p>
            <p className="mt-2 whitespace-pre-wrap break-words rounded-xl bg-card p-4 text-sm leading-7 text-foreground">
              {a.transcript}
            </p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Coach feedback
            </p>
            <p className="mt-2 text-sm leading-7 text-foreground">
              {a.evaluation?.feedback || "No feedback"}
            </p>
            {a.evaluation?.improvements?.length ? (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-primary">
                {a.evaluation.improvements.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </section>
    </div>
  );
}

export default function MockInterviewClient({
  interviewId,
}: {
  interviewId: string;
}) {
  const queryClient = useQueryClient();
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [consented, setConsented] = React.useState(false);
  const overviewQuery = useQuery({
    queryKey: ["practice-overview", interviewId],
    queryFn: async () =>
      (await api.get<Overview>(`/candidate/interviews/${interviewId}/mock`))
        .data,
  });
  const sessionQuery = useQuery({
    queryKey: ["practice-session", sessionId],
    enabled: Boolean(sessionId),
    queryFn: async () =>
      (
        await api.get<{ session: Session }>(
          `/candidate/mock-interviews/${sessionId}`,
        )
      ).data.session,
    refetchInterval: (query) =>
      query.state.data?.status === "EVALUATING" ? 3000 : false,
  });
  const start = useMutation({
    mutationFn: async () =>
      (
        await api.post<{ session: Session }>(
          `/candidate/interviews/${interviewId}/mock`,
        )
      ).data,
    onSuccess: (data) => {
      setSessionId(data.session.id);
      queryClient.setQueryData(
        ["practice-session", data.session.id],
        data.session,
      );
      void queryClient.invalidateQueries({
        queryKey: ["practice-overview", interviewId],
      });
    },
  });
  const complete = useMutation({
    mutationFn: async () =>
      (
        await api.post<{ session?: Session; message?: string }>(
          `/candidate/mock-interviews/${sessionId}/complete`,
        )
      ).data,
    onSuccess: (data) => {
      if (data.session)
        queryClient.setQueryData(["practice-session", sessionId], data.session);
      void queryClient.invalidateQueries({
        queryKey: ["practice-overview", interviewId],
      });
    },
  });
  const submit = useMutation({
    mutationFn: async (payload: { questionId: string; transcript: string }) =>
      (
        await api.post<{ session: Session; shouldComplete: boolean }>(
          `/candidate/mock-interviews/${sessionId}/answer`,
          payload,
        )
      ).data,
    onSuccess: (result) => {
      queryClient.setQueryData(["practice-session", sessionId], result.session);
      if (result.shouldComplete) complete.mutate();
    },
  });

  const info = overviewQuery.data;
  const s = sessionQuery.data;
  const busy = start.isPending || submit.isPending || complete.isPending;

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 pb-16 text-foreground">
      <Link
        href="/candidate/interviews"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to scheduled interviews
      </Link>
      <header className={surface}>
        <div className="flex items-center gap-3 text-primary">
          <Sparkles className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-[0.18em]">
            AI interview practice
          </span>
        </div>
        <h1 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">
          Prepare for your {info?.jobTitle || "upcoming"} interview
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Answer five questions one at a time using your voice or keyboard.
          Review the live transcript before submitting; get personalized
          feedback when finished.
        </p>
      </header>

      {overviewQuery.isLoading && (
        <div className={`${surface} animate-pulse text-foreground`}>
          Loading your interview…
        </div>
      )}
      {overviewQuery.isError && (
        <div role="alert" className={`${surface} text-destructive`}>
          {friendlyError(overviewQuery.error)}
        </div>
      )}
      {info && !sessionId && (
        <>
          <section className={surface}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Practice setup
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {info.companyName} · {info.jobTitle}
                </p>
              </div>
              <span className="rounded-full bg-card px-3 py-2 text-xs text-foreground">
                {info.maxAttempts - info.attempts.length} new attempts remaining
              </span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-card p-4">
                <BookOpen className="h-5 w-5 text-primary" />
                <p className="mt-2 text-sm font-semibold">
                  5 interview questions
                </p>
              </div>
              <div className="rounded-xl bg-card p-4">
                <Mic className="h-5 w-5 text-primary" />
                <p className="mt-2 text-sm font-semibold">Live voice-to-text</p>
              </div>
              <div className="rounded-xl bg-card p-4">
                <FileText className="h-5 w-5 text-primary" />
                <p className="mt-2 text-sm font-semibold">
                  Saved feedback report
                </p>
              </div>
            </div>
            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background p-4 text-xs leading-6 text-foreground">
              <input
                type="checkbox"
                checked={consented}
                onChange={(e) => setConsented(e.target.checked)}
                className="mt-1 h-4 w-4 accent-indigo-500"
              />
              <span>
                I agree to use my resume and submitted practice-answer
                transcripts for question generation and feedback. With an LLM
                enabled, this content is sent to the configured AI provider.
                Browser speech recognition may use a separate speech service.
                Recruiters do not automatically see my practice answers.
              </span>
            </label>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {info.attempts.some((a) => a.status !== "COMPLETED") ? (
                <button
                  type="button"
                  className={buttonPrimary}
                  onClick={() =>
                    setSessionId(
                      info.attempts.find((a) => a.status !== "COMPLETED")!.id,
                    )
                  }
                >
                  Resume previous attempt <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  className={buttonPrimary}
                  disabled={
                    busy ||
                    !consented ||
                    info.attempts.length >= info.maxAttempts ||
                    info.interviewStatus !== "SCHEDULED"
                  }
                  onClick={() => start.mutate()}
                >
                  {start.isPending ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}{" "}
                  Start AI mock interview
                </button>
              )}
              {info.interviewStatus !== "SCHEDULED" && (
                <p className="text-sm text-primary">
                  New practice is available only while your recruiter interview
                  is scheduled.
                </p>
              )}
            </div>
            {start.isError && (
              <p role="alert" className="mt-3 text-sm text-destructive">
                {friendlyError(start.error)}
              </p>
            )}
          </section>
          {info.attempts.length > 0 && (
            <section className={surface}>
              <h2 className="mb-4 text-lg font-semibold">Previous attempts</h2>
              <div className="space-y-3">
                {info.attempts.map((a) => (
                  <div
                    key={a.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
                  >
                    <div>
                      <p className="font-medium">
                        Attempt {a.attemptNumber} ·{" "}
                        {a.status.replaceAll("_", " ")}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {prettyDate(a.createdAt)}{" "}
                        {a.totalScore !== null
                          ? `· ${a.totalScore.toFixed(1)}/100`
                          : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={buttonSecondary}
                      onClick={() => setSessionId(a.id)}
                    >
                      {a.status === "COMPLETED" ? "View report" : "Resume"}{" "}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {sessionId && (
        <>
          {sessionQuery.isLoading && (
            <div className={surface}>
              <LoaderCircle className="mr-2 inline h-4 w-4 animate-spin" />{" "}
              Loading attempt…
            </div>
          )}
          {sessionQuery.isError && (
            <div role="alert" className={`${surface} text-destructive`}>
              {friendlyError(sessionQuery.error)}{" "}
              <button
                type="button"
                className={buttonSecondary}
                onClick={() => setSessionId(null)}
              >
                Back
              </button>
            </div>
          )}
          {s?.status === "IN_PROGRESS" && (
            <p className="text-xs text-muted-foreground">
              Question source:{" "}
              {s.questionSource === "LLM"
                ? "AI-generated from resume and job description"
                : "Role/skill-based templates (configure LLM for more personalization)"}
            </p>
          )}
          {s?.status === "IN_PROGRESS" && s.question && (
            <QuestionCard
              key={s.question.id}
              question={s.question}
              total={s.questionCount}
              sending={submit.isPending}
              onSubmit={(questionId, transcript) =>
                submit.mutate({ questionId, transcript })
              }
            />
          )}
          {s?.status === "EVALUATING" && (
            <section className={surface}>
              <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
              <h2 className="mt-4 text-lg font-semibold">
                Preparing your feedback
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Your answers are saved. If this takes longer than expected, you
                can return later and reopen this attempt.
              </p>
              <button
                type="button"
                className={`${buttonSecondary} mt-4`}
                disabled={complete.isPending}
                onClick={() => complete.mutate()}
              >
                Check evaluation / retry
              </button>
            </section>
          )}
          {s?.status === "EVALUATION_FAILED" && (
            <section className={surface}>
              <AlertCircle className="h-6 w-6 text-primary" />
              <h2 className="mt-3 text-lg font-semibold">
                Evaluation unavailable
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Your answers are safely saved. Please try evaluation again.
              </p>
              <button
                type="button"
                className={`${buttonPrimary} mt-4`}
                onClick={() => complete.mutate()}
                disabled={complete.isPending}
              >
                <RotateCcw className="h-4 w-4" /> Retry evaluation
              </button>
            </section>
          )}
          {s?.status === "COMPLETED" && <Report session={s} />}
          {(submit.isError || complete.isError) && (
            <div
              role="alert"
              className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive"
            >
              {friendlyError(submit.error || complete.error)}
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={buttonSecondary}
              onClick={() => {
                setSessionId(null);
                void overviewQuery.refetch();
              }}
            >
              <ArrowLeft className="h-4 w-4" /> All attempts
            </button>
            {s?.status === "COMPLETED" && (
              <Link href="/candidate/interviews" className={buttonSecondary}>
                <CheckCircle2 className="h-4 w-4" /> Back to interviews
              </Link>
            )}
          </div>
        </>
      )}
      <p className="flex items-start gap-2 text-xs leading-6 text-muted-foreground">
        <Clock3 className="mt-1 h-3.5 w-3.5 shrink-0" /> This is a private
        practice tool, not the recruiter interview. Your answers and feedback
        are not automatically shared with recruiters.
      </p>
    </main>
  );
}
