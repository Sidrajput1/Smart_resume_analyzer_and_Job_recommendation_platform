"use client";

import * as React from "react";
import {
  CalendarClock,
  Clock3,
  MapPin,
  PhoneCall,
  Video,
  BriefcaseBusiness,
  RefreshCcw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useCandidateInterviews,
  type CandidateInterview,
} from "@/hooks/useInterview";
import Link from "next/link";

const MODE_LABELS = {
  VIDEO: "Video call",
  PHONE: "Phone call",
  ONSITE: "Onsite",
} as const;

function dateAndTime(iso: string): string {
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return "Invalid interview date";
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(value);
}

function CandidateInterviewCard({
  interview,
}: {
  interview: CandidateInterview;
}) {
  const [now] = React.useState(Date.now);
  const when = new Date(interview.scheduledAt).getTime();
  const upcoming = interview.status === "SCHEDULED" && when >= now;
  const validMeetingUrl = (() => {
    if (interview.mode !== "VIDEO" || !interview.meetingUrl) return null;
    try {
      const u = new URL(interview.meetingUrl);
      return u.protocol === "https:" ? u.toString() : null;
    } catch {
      return null;
    }
  })();
  return (
    <article className="rounded-md border border-border bg-background p-5 shadow-none sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary">
            <BriefcaseBusiness className="h-4 w-4" />{" "}
            {interview.job.companyName}
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            {interview.job.title}
          </h2>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${interview.status === "CANCELLED" ? "border-destructive/20 bg-destructive/10 text-destructive" : interview.status === "COMPLETED" ? "border-border bg-card text-foreground" : "border-border bg-accent text-primary"}`}
        >
          {interview.status === "SCHEDULED"
            ? upcoming
              ? "Upcoming"
              : "Scheduled · date passed"
            : interview.status.toLowerCase()}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
          <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">
              Date & time (your timezone)
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {dateAndTime(interview.scheduledAt)}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
          <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Duration</p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {interview.durationMinutes} minutes
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
          {interview.mode === "VIDEO" ? (
            <Video className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          ) : interview.mode === "PHONE" ? (
            <PhoneCall className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          ) : (
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          )}
          <div>
            <p className="text-xs text-muted-foreground">Interview mode</p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {MODE_LABELS[interview.mode]}
            </p>
          </div>
        </div>
        {interview.location && (
          <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Location</p>
              <p className="mt-1 wrap-break-word text-sm font-medium text-foreground">
                {interview.location}
              </p>
            </div>
          </div>
        )}
      </div>

      {interview.notes && (
        <div className="mt-4 rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground">
            Recruiter’s instructions
          </h3>
          <p className="mt-2 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-foreground">
            {interview.notes}
          </p>
        </div>
      )}

      {interview.status === "SCHEDULED" && validMeetingUrl && (
        <a
          href={validMeetingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary"
        >
          <Video className="h-4 w-4" /> Open meeting link
        </a>
      )}
      {interview.status === "SCHEDULED" && (
        <Link
          href={`/candidate/interview/${encodeURIComponent(interview.id)}/practice`}
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-accent px-4 py-2 text-sm font-semibold text-primary hover:bg-accent"
        >
          <Sparkles className="h-4 w-4" /> Practice with AI
        </Link>
      )}
      {interview.status === "SCHEDULED" &&
        interview.mode === "VIDEO" &&
        !validMeetingUrl && (
          <p className="mt-4 rounded-lg border border-border bg-accent p-3 text-sm text-primary">
            Meeting link hasn’t been provided yet. Please coordinate with the
            recruiter before your interview.
          </p>
        )}
    </article>
  );
}

export default function CandidateInterviewsClient() {
  const {
    data = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useCandidateInterviews();
  const [now] = React.useState(Date.now);
  const interviews = React.useMemo(
    () =>
      [...data].sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
      ),
    [data],
  );
  const upcoming = interviews.filter(
    (i) => i.status === "SCHEDULED" && new Date(i.scheduledAt).getTime() >= now,
  );
  const other = interviews.filter((i) => !upcoming.some((u) => u.id === i.id));

  return (
    <main className="mx-auto w-full max-w-5xl space-y-7 pb-12 text-foreground">
      <header className="rounded-md border border-border bg-background p-5 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
              Candidate workspace
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
              My interviews
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Track interview schedules and joining instructions from
              recruiters.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={isFetching}
            onClick={() => void refetch()}
            className="border-border bg-card text-foreground hover:bg-card hover:text-foreground"
          >
            <RefreshCcw
              className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />{" "}
            Refresh
          </Button>
        </div>
      </header>

      {isLoading ? (
        <div className="space-y-3" aria-label="Loading interviews">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-xl bg-background"
            />
          ))}
        </div>
      ) : isError ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/20 bg-destructive/10 p-5 text-sm text-destructive"
        >
          {error instanceof Error
            ? error.message
            : "Unable to load interviews."}{" "}
          <Button
            type="button"
            onClick={() => void refetch()}
            variant="outline"
            className="ml-2 border-border text-foreground"
          >
            Retry
          </Button>
        </div>
      ) : interviews.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-background p-12 text-center">
          <CalendarClock className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-3 text-lg font-semibold text-foreground">
            No interviews scheduled yet
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            When a recruiter schedules an interview for one of your
            applications, it will appear here.
          </p>
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              Upcoming interviews ({upcoming.length})
            </h2>
            {upcoming.length ? (
              upcoming.map((interview) => (
                <CandidateInterviewCard
                  key={interview.id}
                  interview={interview}
                />
              ))
            ) : (
              <p className="rounded-xl border border-border bg-background p-5 text-sm text-muted-foreground">
                No upcoming interviews.
              </p>
            )}
          </section>
          {other.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">
                Past / other interviews
              </h2>
              {other.map((interview) => (
                <CandidateInterviewCard
                  key={interview.id}
                  interview={interview}
                />
              ))}
            </section>
          )}
        </>
      )}
    </main>
  );
}
