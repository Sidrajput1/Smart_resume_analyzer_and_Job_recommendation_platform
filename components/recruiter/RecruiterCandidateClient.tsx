"use client";

import * as React from "react";
import {
  ArrowDownUp,
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarClock,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileText,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Search,
  Sparkles,
  UserRound,
  UsersRound,
  X,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  useRecruiterCandidates,
  useUpdateApplicationStatus,
} from "@/hooks/useRecruiterCandidates";
import ScheduleInterviewDialog from "../interviews/ScheduleInterviewDialog";
import EvidenceComparison from "./EvidenceComparison";


// IMPORTANT: Retain the imports for these TWO EXISTING project hooks from your
// current component; their import paths were not included in the shared snippet.
// import { useRecruiterCandidates, useUpdateApplicationStatus } from "YOUR_HOOK_PATH";

// ------------------------- API types -------------------------
type Status =
  "APPLIED" | "SHORTLISTED" | "INTERVIEW_SCHEDULED" | "REJECTED" | string;
type DetailTab = "profile" | "intelligence" | "application";

type Education = {
  id?: string;
  institutionName?: string | null;
  degree?: string | null;
  fieldOfStudy?: string | null;
};
type Experience = {
  id?: string;
  companyName?: string | null;
  jobTitle?: string | null;
  description?: string | null;
};
type Project = {
  id?: string;
  title?: string | null;
  description?: string | null;
  technologies?: string[] | string | null;
};
type Certification = {
  id?: string;
  title?: string | null;
  issuer?: string | null;
};

type Intelligence = {
  overallScore?: number | null;
  atsScore?: number | null;
  skillScore?: number | null;
  experienceScore?: number | null;
  educationScore?: number | null;
  projectScore?: number | null;
  summary?: string | null;
  strengths?: string[] | null;
  weaknesses?: string[] | null;
  skillGaps?: string[] | null;
  recommendedRoles?: string[] | null;
  analysisMetadata?: {
    parsed?: {
      structuredData?: {
        summary?: string | null;
        personal?: {
          githubUrl?: string | null;
          linkedinUrl?: string | null;
          portfolioUrl?: string | null;
        };
      };
    };
  } | null;
};

type Candidate = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  headline?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  skills?: string[] | null;
  educationCount?: number;
  experienceCount?: number;
  projectCount?: number;
  certificationCount?: number;
  resume?: {
    id: string;
    fileUrl?: string | null;
    fileName?: string | null;
    title?: string | null;
  } | null;
  intelligence?: Intelligence | null;
  // These are optional until you expose full records from your GET API.
  educations?: Education[];
  experiences?: Experience[];
  projects?: Project[];
  certifications?: Certification[];
};

type Application = {
  id: string;
  status: Status;
  appliedAt: string;
  reviewedAt?: string | null;
  respondedAt?: string | null;
  coverLetter?: string | null;
  recruiterNotes?: string | null;
  matchScore?: number | null;
  matchedSkills?: string[] | null;
  missingSkills?: string[] | null;
  job: {
    id: string;
    title: string;
    companyName?: string | null;
    jobType?: string | null;
    workMode?: string | null;
  };
  candidate: Candidate;
};

const STATUS_FILTERS = [
  { value: "", label: "All applications" },
  { value: "APPLIED", label: "To review" },
  { value: "SHORTLISTED", label: "Shortlisted" },
  { value: "INTERVIEW_SCHEDULED", label: "Interviews" },
  { value: "REJECTED", label: "Rejected" },
] as const;

const statusStyles: Record<string, string> = {
  APPLIED: "border-border bg-accent text-primary",
  SHORTLISTED: "border-border bg-accent text-primary",
  INTERVIEW_SCHEDULED: "border-border bg-accent text-primary",
  REJECTED: "border-destructive/20 bg-destructive/10 text-destructive",
};

function statusLabel(status: string) {
  return status === "APPLIED"
    ? "To review"
    : status
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (s) => s.toUpperCase());
}
function dateLabel(value?: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
function scoreLabel(score?: number | null) {
  return typeof score === "number" && Number.isFinite(score)
    ? `${score.toFixed(1)}%`
    : "—";
}
function clampScore(score?: number | null) {
  return typeof score === "number" && Number.isFinite(score)
    ? Math.min(100, Math.max(0, score))
    : 0;
}
function locationLabel(candidate: Candidate) {
  return (
    [candidate.city, candidate.state, candidate.country]
      .filter(Boolean)
      .join(", ") || "Location not provided"
  );
}
function initials(name: string) {
  return (name || "Candidate")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}
function publicUrl(url?: string | null) {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    return ["https:", "http:"].includes(parsed.protocol)
      ? parsed.toString()
      : undefined;
  } catch {
    return undefined;
  }
}
function resumeUrl(url?: string | null) {
  if (!url) return undefined;
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  return publicUrl(url);
}

export default function RecruiterCandidateClient() {
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [jobId, setJobId] = React.useState("all");
  const [sortBy, setSortBy] = React.useState("newest");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [detailTab, setDetailTab] = React.useState<DetailTab>("profile");
  const [interviewCandidate, setInterviewCandidate] =
    React.useState<Application | null>(null);
  const [rejectCandidate, setRejectCandidate] =
    React.useState<Application | null>(null);
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [scheduleSuccess, setScheduleSuccess] = React.useState<string | null>(
    null,
  );

  // These are your existing TanStack Query hooks. Keep their original imports.
  const { data, isLoading, isError, refetch } = useRecruiterCandidates(
    search,
    status,
  );
  const updateStatusMutation = useUpdateApplicationStatus();
  const applications = React.useMemo(
    () => (data?.applications ?? []) as Application[],
    [data?.applications],
  );

  const jobs = React.useMemo(() => {
    const seen = new Map<string, string>();
    for (const app of applications) seen.set(app.job.id, app.job.title);
    return [...seen]
      .map(([id, title]) => ({ id, title }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [applications]);

  // The server already filters search and status; job and sorting are local.
  const activeJobId = jobs.some((job) => job.id === jobId) ? jobId : "all";
  const visibleApplications = React.useMemo(() => {
    const filtered = applications.filter(
      (app) => activeJobId === "all" || app.job.id === activeJobId,
    );
    return [...filtered].sort((a, b) => {
      if (sortBy === "newest")
        return (
          new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
        );
      if (sortBy === "oldest")
        return (
          new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime()
        );
      if (sortBy === "name")
        return a.candidate.name.localeCompare(b.candidate.name);
      return (b.matchScore ?? -1) - (a.matchScore ?? -1);
    });
  }, [applications, activeJobId, sortBy]);

  const stats = React.useMemo(() => {
    const scored = visibleApplications.filter(
      (a) => typeof a.matchScore === "number" && Number.isFinite(a.matchScore),
    );
    const average = scored.length
      ? scored.reduce((sum, a) => sum + (a.matchScore ?? 0), 0) / scored.length
      : null;
    return {
      total: visibleApplications.length,
      shortlisted: visibleApplications.filter((a) => a.status === "SHORTLISTED")
        .length,
      interviews: visibleApplications.filter(
        (a) => a.status === "INTERVIEW_SCHEDULED",
      ).length,
      average,
    };
  }, [visibleApplications]);

  // selected is looked up from the latest query result, not a stale copy.
  const selected = applications.find((app) => app.id === selectedId) ?? null;
  const hasFilters = Boolean(search || status || activeJobId !== "all");

  function changeStatus(
    app: Application,
    nextStatus: "SHORTLISTED" | "REJECTED",
  ) {
    if (pendingId || app.status === nextStatus) return;
    setPendingId(app.id);
    updateStatusMutation.mutate(
      { id: app.id, status: nextStatus },
      {
        onSuccess: () => {
          void refetch();
        },
        onSettled: () => setPendingId(null),
      },
    );
  }

  function openDetails(app: Application) {
    setDetailTab("profile");
    setSelectedId(app.id);
  }

  // function openInterviewPlaceholder(app: Application) {
  //   setSelectedId(null); // avoid stacked dialogs
  //   setInterviewCandidate(app);
  // }
  function openInterviewScheduler(app: Application) {
    setScheduleSuccess(null);
    setSelectedId(null); // avoid stacked dialogs
    setInterviewCandidate(app);
  }

  function requestReject(app: Application) {
    setSelectedId(null); // avoid stacked dialogs if confirmation starts in profile
    setRejectCandidate(app);
  }

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setStatus("");
    setJobId("all");
    setSortBy("newest");
  }

  return (
    <main className="legacy-workspace talent-workspace mx-auto w-full max-w-7xl space-y-5 pb-12 text-foreground sm:space-y-6">
      {/* Header */}
      <header className="relative overflow-hidden rounded-lg border border-border bg-background px-5 py-6 shadow-none shadow-black/10 sm:px-7 sm:py-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-32 h-72 w-72 rounded-full bg-accent blur-3xl"
        />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <UsersRound className="h-4 w-4" /> Talent workspace
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Talent evidence desk
            </h1>
            <p className="text-sm leading-6 text-muted-foreground sm:text-base">
              Review applications, inspect role evidence, and move relevant
              people through your hiring process.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start rounded-full border border-border bg-card px-3 py-2 text-xs text-foreground">
            <Sparkles className="h-4 w-4 text-primary" /> AI-assisted review
          </div>
        </div>
      </header>

      {scheduleSuccess && (
        <div
          role="status"
          className="rounded-md border border-border bg-accent p-4 text-sm"
        >
          {scheduleSuccess}
        </div>
      )}
      <EvidenceComparison applications={applications} />
      {/* These metrics reflect the CURRENT server-filtered result set, not company-wide totals. */}
      <section
        aria-label="Current results overview"
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        <Metric
          title="Applications in view"
          value={String(stats.total)}
          icon={<UsersRound className="h-4 w-4" />}
        />
        <Metric
          title="Shortlisted in view"
          value={String(stats.shortlisted)}
          icon={<BadgeCheck className="h-4 w-4" />}
        />
        <Metric
          title="Interviews in view"
          value={String(stats.interviews)}
          icon={<CalendarClock className="h-4 w-4" />}
        />
        <Metric
          title="Avg. profile similarity"
          value={scoreLabel(stats.average)}
          icon={<Sparkles className="h-4 w-4" />}
        />
      </section>

      <section className="overflow-hidden rounded-md border border-border bg-background">
        <div
          className="overflow-x-auto border-b border-border px-3 pt-3 sm:px-5"
          aria-label="Application status filters"
        >
          <div className="flex w-max min-w-full items-center gap-1 pb-3">
            {STATUS_FILTERS.map((item) => (
              <button
                type="button"
                key={item.value || "all"}
                onClick={() => {
                  setStatus(item.value);
                  setJobId("all");
                }}
                aria-pressed={status === item.value}
                className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  status === item.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-card hover:text-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-3 p-3 sm:p-5 lg:grid-cols-[minmax(0,1fr)_200px_200px]">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setSearch(searchInput.trim());
            }}
            className="flex min-w-0 gap-2"
          >
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search candidates and jobs"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search name, headline or job..."
                className="h-10 border-border bg-background pl-9 text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
              />
            </div>
            <Button
              type="submit"
              className="h-10 shrink-0 bg-primary px-4 text-primary-foreground hover:bg-primary"
            >
              Search
            </Button>
          </form>
          <label className="relative block">
            <span className="sr-only">Filter by job</span>
            <select
              value={activeJobId}
              onChange={(e) => setJobId(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All jobs</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          </label>
          <label className="relative block">
            <span className="sr-only">Sort candidates</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="score_desc">
                Profile similarity: high to low
              </option>
              <option value="newest">Newest applications</option>
              <option value="oldest">Oldest applications</option>
              <option value="name">Candidate name A–Z</option>
            </select>
          </label>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowDownUp className="h-4 w-4" />
          {isLoading
            ? "Loading candidates..."
            : `${visibleApplications.length} candidate application${visibleApplications.length === 1 ? "" : "s"} found`}
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary"
          >
            <X className="h-4 w-4" /> Clear filters
          </button>
        )}
      </div>

      {updateStatusMutation.isError && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          The status update failed. Your application was not confirmed as
          changed; please try again.
        </div>
      )}

      {isLoading ? (
        <div
          className="space-y-3"
          role="status"
          aria-label="Loading candidates"
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-md border border-border bg-background"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-8 text-center">
          <CircleAlert className="mx-auto mb-3 h-7 w-7 text-destructive" />
          <p className="font-semibold text-foreground">
            Could not load candidates
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Check the API connection and try again.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void refetch()}
            className="mt-4 border-border bg-card text-foreground hover:bg-card"
          >
            Retry
          </Button>
        </div>
      ) : visibleApplications.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-background p-10 text-center sm:p-14">
          <UsersRound className="mx-auto mb-4 h-9 w-9 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">
            No applications found
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {hasFilters
              ? "Try a different name, job, or pipeline stage."
              : "New candidate applications will appear here after people apply to your jobs."}
          </p>
          {hasFilters && (
            <Button
              type="button"
              onClick={clearFilters}
              variant="outline"
              className="mt-4 border-border bg-card text-foreground hover:bg-card"
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <section aria-label="Candidate applications" className="space-y-3">
          {visibleApplications.map((app) => (
            <CandidateRow
              key={app.id}
              app={app}
              busy={pendingId === app.id}
              anyBusy={pendingId !== null}
              onView={() => openDetails(app)}
              onShortlist={() => changeStatus(app, "SHORTLISTED")}
              onReject={() => requestReject(app)}
              onSchedule={() => openInterviewScheduler(app)}
            />
          ))}
        </section>
      )}

      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      >
        {selected && (
          <CandidateDetails
            app={selected}
            tab={detailTab}
            setTab={setDetailTab}
            busy={pendingId === selected.id}
            anyBusy={pendingId !== null}
            onShortlist={() => changeStatus(selected, "SHORTLISTED")}
            onReject={() => requestReject(selected)}
            onSchedule={() => openInterviewScheduler(selected)}
          />
        )}
      </Dialog>

      {/* Keep destructive actions deliberate: reject only after explicit confirmation. */}
      <Dialog
        open={Boolean(rejectCandidate)}
        onOpenChange={(open) => {
          if (!open) setRejectCandidate(null);
        }}
      >
        <DialogContent className="w-[calc(100vw-1.25rem)] max-w-md border-border bg-background text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <XCircle className="h-5 w-5 text-destructive" /> Reject
              application?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {rejectCandidate
                ? `Mark ${rejectCandidate.candidate.name}'s application for ${rejectCandidate.job.title} as rejected?`
                : "Confirm rejection"}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm leading-6 text-foreground">
            This will update the application status in your existing system.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectCandidate(null)}
              className="border-border bg-card text-foreground hover:bg-card"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={pendingId !== null}
              onClick={() => {
                if (rejectCandidate) changeStatus(rejectCandidate, "REJECTED");
                setRejectCandidate(null);
              }}
              className="bg-destructive/10 text-foreground hover:bg-destructive/10"
            >
              Reject application
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ScheduleInterviewDialog
        key={interviewCandidate?.id || "closed"}
        application={
          interviewCandidate
            ? {
                id: interviewCandidate.id,
                candidateName: interviewCandidate.candidate.name,
                jobTitle: interviewCandidate.job.title,
              }
            : null
        }
        onOpenChange={(open) => {
          if (!open) setInterviewCandidate(null);
        }}
        onScheduled={() => {
          setScheduleSuccess(
            "Interview scheduled successfully. The candidate can now see it on My Interviews.",
          );
          void refetch();
        }}
      />
      {/* <Dialog
        open={Boolean(interviewCandidate)}
        onOpenChange={(open) => {
          if (!open) setInterviewCandidate(null);
        }}
      >
        <DialogContent className="w-[calc(100vw-1.25rem)] max-w-md border-border bg-background text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <CalendarClock className="h-5 w-5 text-primary" /> Schedule
              interview
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {interviewCandidate
                ? `Interview setup for ${interviewCandidate.candidate.name} — ${interviewCandidate.job.title}.`
                : "Interview setup"}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-border bg-accent p-4 text-sm leading-6 text-foreground">
            This is the placeholder for the next feature. We will add date/time,
            interview mode, participants and invitations later. No interview has
            been scheduled.
          </div>
          <Button
            type="button"
            onClick={() => setInterviewCandidate(null)}
            className="w-full bg-primary text-primary-foreground hover:bg-primary"
          >
            Got it
          </Button>
        </DialogContent>
      </Dialog> */}
    </main>
  );
}

function Metric({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="rounded-md border-border bg-background text-foreground shadow-none">
      <CardContent className="p-4 sm:p-5">
        <div className="mb-2 flex items-center justify-between gap-2 text-muted-foreground">
          <span className="text-xs font-medium sm:text-sm">{title}</span>
          <span className="text-primary">{icon}</span>
        </div>
        <p className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge
      variant="outline"
      className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium ${statusStyles[status] ?? "border-border bg-card text-foreground"}`}
    >
      {statusLabel(status)}
    </Badge>
  );
}

function MatchScore({
  score,
  compact = false,
}: {
  score?: number | null;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "min-w-[118px]" : "w-full"}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium text-muted-foreground">
          Profile similarity
        </span>
        <span className="text-xl font-bold tabular-nums text-foreground">
          {scoreLabel(score)}
        </span>
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-background"
        role="progressbar"
        aria-label="Profile similarity score"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={
          typeof score === "number" ? clampScore(score) : undefined
        }
      >
        <div
          className="h-full rounded-full   "
          style={{ width: `${clampScore(score)}%` }}
        />
      </div>
    </div>
  );
}

function CandidateRow({
  app,
  busy,
  anyBusy,
  onView,
  onShortlist,
  onReject,
  onSchedule,
}: {
  app: Application;
  busy: boolean;
  anyBusy: boolean;
  onView: () => void;
  onShortlist: () => void;
  onReject: () => void;
  onSchedule: () => void;
}) {
  const candidate = app.candidate;
  const skills = candidate.skills ?? [];
  const matched = app.matchedSkills ?? [];
  const isShortlisted = app.status === "SHORTLISTED";
  const isRejected = app.status === "REJECTED";
  const isInterview = app.status === "INTERVIEW_SCHEDULED";
  const url = resumeUrl(candidate.resume?.fileUrl);
  return (
    <article className="rounded-md border border-border bg-background p-4 shadow-none shadow-black/5 transition-colors hover:border-border hover:bg-background sm:p-5">
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-accent text-sm font-semibold text-primary sm:h-14 sm:w-14">
            {initials(candidate.name)}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="break-words text-base font-semibold text-foreground sm:text-lg">
                {candidate.name}
              </h2>
              <StatusBadge status={app.status} />
            </div>
            <p className="text-sm text-foreground">
              {candidate.headline || "Candidate profile"}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground sm:text-sm">
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <BriefcaseBusiness className="h-3.5 w-3.5 shrink-0" />
                <span className="wrap-break">{app.job.title}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {locationLabel(candidate)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5 shrink-0" />
                Applied {dateLabel(app.appliedAt)}
              </span>
            </div>
          </div>
        </div>
        <div className="w-full rounded-xl border border-border bg-background p-3 lg:w-48 lg:shrink-0">
          <MatchScore score={app.matchScore} />
          <p className="mt-2 text-[11px] text-muted-foreground">
            Similarity score; method not provided
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {matched.length ? (
          <>
            <span className="mr-1 text-xs font-medium text-muted-foreground">
              Matching signals
            </span>
            {matched.slice(0, 4).map((skill, i) => (
              <SkillPill key={`${skill}-${i}`} text={skill} positive />
            ))}
            {matched.length > 4 && (
              <span className="text-xs text-muted-foreground">
                +{matched.length - 4} more
              </span>
            )}
          </>
        ) : (
          <>
            <span className="mr-1 text-xs font-medium text-muted-foreground">
              Profile skills
            </span>
            {skills.slice(0, 4).map((skill, i) => (
              <SkillPill key={`${skill}-${i}`} text={skill} />
            ))}
            {skills.length > 4 && (
              <span className="text-xs text-muted-foreground">
                +{skills.length - 4} more
              </span>
            )}
            {!skills.length && (
              <span className="text-xs text-muted-foreground">
                Not provided
              </span>
            )}
          </>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onView}
            className="border-border bg-card text-foreground hover:bg-card hover:text-foreground"
          >
            <UserRound className="mr-1.5 h-4 w-4" /> View profile{" "}
            <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Button>
          {candidate.resume?.id && (
            <a
              //href={url}
              href={`/api/resumes/${candidate.resume.id}/view`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-primary hover:bg-accent hover:text-primary"
            >
              <FileText className="h-4 w-4" /> Resume{" "}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {isShortlisted ? (
            <Button
              type="button"
              size="sm"
              onClick={onSchedule}
              className="bg-primary text-primary-foreground hover:bg-primary"
            >
              <CalendarClock className="mr-1.5 h-4 w-4" /> Schedule interview
            </Button>
          ) : isInterview ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-accent px-3 py-2 text-xs text-primary">
              <CalendarClock className="h-4 w-4" /> Interview scheduled
            </span>
          ) : isRejected ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <XCircle className="h-4 w-4" /> Rejected
            </span>
          ) : (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={anyBusy}
                onClick={onReject}
                className="border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <XCircle className="mr-1.5 h-4 w-4" /> Reject
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={anyBusy}
                onClick={onShortlist}
                className="bg-accent text-foreground hover:bg-accent"
              >
                <BadgeCheck className="mr-1.5 h-4 w-4" />
                {busy ? "Saving..." : "Shortlist"}
              </Button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

function CandidateDetails({
  app,
  tab,
  setTab,
  busy,
  anyBusy,
  onShortlist,
  onReject,
  onSchedule,
}: {
  app: Application;
  tab: DetailTab;
  setTab: (tab: DetailTab) => void;
  busy: boolean;
  anyBusy: boolean;
  onShortlist: () => void;
  onReject: () => void;
  onSchedule: () => void;
}) {
  const { candidate } = app;
  const intel = candidate.intelligence;
  const external = intel?.analysisMetadata?.parsed?.structuredData?.personal;
  const links = [
    { label: "GitHub", url: publicUrl(external?.githubUrl) },
    { label: "LinkedIn", url: publicUrl(external?.linkedinUrl) },
    { label: "Portfolio", url: publicUrl(external?.portfolioUrl) },
  ].filter((item): item is { label: string; url: string } => Boolean(item.url));
  const cvUrl = resumeUrl(candidate.resume?.fileUrl);
  const sections = [
    { value: "profile" as const, label: "Profile & resume" },
    { value: "intelligence" as const, label: "AI insights" },
    { value: "application" as const, label: "Application" },
  ];

  return (
    <DialogContent className="flex max-h-[94dvh] w-[calc(100vw-1rem)] max-w-5xl flex-col gap-0 overflow-hidden border-border bg-background p-0 text-foreground sm:w-full">
      <DialogHeader className="shrink-0 border-b border-border px-5 pb-5 pt-6 pr-11 sm:px-7 sm:pt-7">
        <div className="flex flex-wrap items-start gap-3 sm:gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-accent font-semibold text-primary sm:h-14 sm:w-14">
            {initials(candidate.name)}
          </div>
          <div className="min-w-0 flex-1 space-y-1.5 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <DialogTitle className="wrap-break text-xl font-semibold sm:text-2xl">
                {candidate.name}
              </DialogTitle>
              <StatusBadge status={app.status} />
            </div>
            <DialogDescription className="text-sm text-muted-foreground">
              {candidate.headline || "Candidate profile"} · Applied to{" "}
              {app.job.title}
            </DialogDescription>
          </div>
          <div className="w-full rounded-xl border border-border bg-card p-3 sm:w-44">
            <MatchScore score={app.matchScore} compact />
          </div>
        </div>
        <div
          role="tablist"
          aria-label="Candidate detail sections"
          className="mt-5 flex gap-1 overflow-x-auto rounded-xl bg-card p-1"
        >
          {sections.map((section) => (
            <button
              type="button"
              role="tab"
              aria-selected={tab === section.value}
              key={section.value}
              onClick={() => setTab(section.value)}
              className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:text-sm ${tab === section.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-card hover:text-foreground"}`}
            >
              {section.label}
            </button>
          ))}
        </div>
      </DialogHeader>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
        {tab === "profile" && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <CountTile
                label="Education records"
                value={
                  candidate.educationCount ?? candidate.educations?.length ?? 0
                }
                icon={<GraduationCap className="h-4 w-4" />}
              />
              <CountTile
                label="Experience records"
                value={
                  candidate.experienceCount ??
                  candidate.experiences?.length ??
                  0
                }
                icon={<BriefcaseBusiness className="h-4 w-4" />}
              />
              <CountTile
                label="Projects"
                value={
                  candidate.projectCount ?? candidate.projects?.length ?? 0
                }
                icon={<Sparkles className="h-4 w-4" />}
              />
              <CountTile
                label="Certifications"
                value={
                  candidate.certificationCount ??
                  candidate.certifications?.length ??
                  0
                }
                icon={<BadgeCheck className="h-4 w-4" />}
              />
            </div>

            <Panel title="Contact & links">
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <InfoRow
                  icon={<Mail className="h-4 w-4" />}
                  label="Email"
                  value={candidate.email || "Not provided"}
                  href={
                    candidate.email ? `mailto:${candidate.email}` : undefined
                  }
                />
                <InfoRow
                  icon={<Phone className="h-4 w-4" />}
                  label="Phone"
                  value={candidate.phone || "Not provided"}
                  href={candidate.phone ? `tel:${candidate.phone}` : undefined}
                />
                <InfoRow
                  icon={<MapPin className="h-4 w-4" />}
                  label="Location"
                  value={locationLabel(candidate)}
                />
                <InfoRow
                  icon={<BriefcaseBusiness className="h-4 w-4" />}
                  label="Applied position"
                  value={app.job.title}
                />
              </div>
              {links.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {links.map((link) => (
                    <a
                      key={link.label}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs text-primary hover:bg-card"
                    >
                      {link.label}
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="Resume & professional summary">
              <p className="text-sm leading-6 text-foreground">
                {intel?.analysisMetadata?.parsed?.structuredData?.summary ||
                  candidate.headline ||
                  "No structured summary is available. Open the resume to review the full background."}
              </p>
              {cvUrl ? (
                <a
                  href={cvUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-accent px-3 py-2 text-sm font-medium text-primary hover:bg-accent"
                >
                  <FileText className="h-4 w-4" />{" "}
                  {candidate.resume?.fileName || "Open attached resume"}
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  No resume file attached.
                </p>
              )}
            </Panel>
            <Panel title={`Profile skills (${candidate.skills?.length ?? 0})`}>
              <Pills
                items={candidate.skills ?? []}
                empty="No structured skills available"
              />
            </Panel>
            <Panel title="Structured work experience">
              <RecordList
                items={(candidate.experiences ?? []).map((e) => ({
                  title: e.jobTitle || "Role not specified",
                  meta: e.companyName,
                  description: e.description,
                }))}
                empty="No experience records available. Review the attached resume."
              />
            </Panel>
            <Panel title="Education">
              <RecordList
                items={(candidate.educations ?? []).map((e) => ({
                  title: e.degree || "Degree not specified",
                  meta: [e.institutionName, e.fieldOfStudy]
                    .filter(Boolean)
                    .join(" · "),
                }))}
                empty="No education records available. Review the attached resume."
              />
            </Panel>
            <Panel title="Projects">
              <RecordList
                items={(candidate.projects ?? []).map((p) => ({
                  title: p.title || "Untitled project",
                  meta: Array.isArray(p.technologies)
                    ? p.technologies.join(", ")
                    : p.technologies,
                  description: p.description,
                }))}
                empty="No project records available. Review the attached resume."
              />
            </Panel>
            <Panel title="Certifications">
              <RecordList
                items={(candidate.certifications ?? []).map((c) => ({
                  title: c.title || "Certification",
                  meta: c.issuer,
                }))}
                empty="No certification records available. Review the attached resume."
              />
            </Panel>
          </>
        )}

        {tab === "intelligence" && (
          <>
            <div className="rounded-xl border border-border bg-accent p-4 text-sm leading-6 text-foreground">
              <Sparkles className="mr-2 inline h-4 w-4 text-primary" />
              <strong className="text-foreground">
                Job match is separate from resume analysis.
              </strong>{" "}
              The {scoreLabel(app.matchScore)} score measures TF-IDF text
              similarity for this job. ATS and overall scores assess the resume
              itself; neither is a probability of hiring success.
            </div>
            <Panel title="Job match assessment">
              <MatchScore score={app.matchScore} />
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-primary">
                    Matched job skills
                  </h3>
                  <Pills
                    items={app.matchedSkills ?? []}
                    positive
                    empty="No structured matches returned; job skill requirements may not be configured."
                  />
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-primary">
                    Unmatched job skills
                  </h3>
                  <Pills
                    items={app.missingSkills ?? []}
                    empty="No unmatched job skills returned. This isn't proof of full coverage."
                  />
                </div>
              </div>
            </Panel>
            {intel ? (
              <>
                <Panel title="Resume intelligence scores">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <IntelligenceTile
                      label="Overall"
                      score={intel.overallScore}
                    />
                    <IntelligenceTile label="ATS" score={intel.atsScore} />
                    <IntelligenceTile label="Skills" score={intel.skillScore} />
                    <IntelligenceTile
                      label="Experience"
                      score={intel.experienceScore}
                    />
                    <IntelligenceTile
                      label="Education"
                      score={intel.educationScore}
                    />
                    <IntelligenceTile
                      label="Projects"
                      score={intel.projectScore}
                    />
                  </div>
                </Panel>
                {intel.summary && (
                  <Panel title="AI resume summary">
                    <p className="text-sm leading-6 text-foreground">
                      {intel.summary}
                    </p>
                  </Panel>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  <Panel title="Identified strengths">
                    <Pills
                      items={intel.strengths ?? []}
                      positive
                      empty="None recorded"
                    />
                  </Panel>
                  <Panel title="Skills to improve">
                    <Pills
                      items={intel.skillGaps ?? []}
                      empty="None recorded"
                    />
                  </Panel>
                </div>
                <Panel title="Suggested roles">
                  <Pills
                    items={intel.recommendedRoles ?? []}
                    empty="None recorded"
                  />
                </Panel>
                {Boolean(intel.weaknesses?.length) && (
                  <Panel title="Other improvement areas">
                    <Pills
                      items={intel.weaknesses ?? []}
                      empty="None recorded"
                    />
                  </Panel>
                )}
              </>
            ) : (
              <Panel title="Resume intelligence">
                <p className="text-sm text-muted-foreground">
                  This candidate has no stored intelligence profile yet.
                </p>
              </Panel>
            )}
          </>
        )}

        {tab === "application" && (
          <>
            <Panel title="Application timeline">
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoRow
                  icon={<Clock3 className="h-4 w-4" />}
                  label="Applied"
                  value={dateLabel(app.appliedAt)}
                />
                <InfoRow
                  icon={<Check className="h-4 w-4" />}
                  label="Reviewed"
                  value={dateLabel(app.reviewedAt)}
                />
                <InfoRow
                  icon={<CalendarClock className="h-4 w-4" />}
                  label="Response recorded"
                  value={dateLabel(app.respondedAt)}
                />
                <InfoRow
                  icon={<BriefcaseBusiness className="h-4 w-4" />}
                  label="Job type / mode"
                  value={
                    [app.job.jobType, app.job.workMode]
                      .filter(Boolean)
                      .join(" · ")
                      .replaceAll("_", " ") || "Not provided"
                  }
                />
              </div>
            </Panel>
            <Panel title="Cover letter">
              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
                {app.coverLetter || "No cover letter supplied."}
              </p>
            </Panel>
            <Panel title="Recruiter notes">
              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
                {app.recruiterNotes || "No notes saved yet."}
              </p>
            </Panel>
          </>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border bg-background px-5 py-3 sm:px-7">
        <span className="text-xs text-muted-foreground">
          {app.job.companyName || "Company"} · {dateLabel(app.appliedAt)}
        </span>
        <div className="flex flex-wrap justify-end gap-2">
          {app.status === "SHORTLISTED" ? (
            <Button
              type="button"
              size="sm"
              onClick={onSchedule}
              className="bg-primary text-primary-foreground hover:bg-primary"
            >
              <CalendarClock className="mr-1.5 h-4 w-4" /> Schedule interview
            </Button>
          ) : app.status === "APPLIED" ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={anyBusy}
                onClick={onReject}
                className="border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/10 hover:text-foreground"
              >
                <XCircle className="mr-1.5 h-4 w-4" /> Reject
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={anyBusy}
                onClick={onShortlist}
                className="bg-accent text-foreground hover:bg-accent"
              >
                <BadgeCheck className="mr-1.5 h-4 w-4" />
                {busy ? "Saving..." : "Shortlist candidate"}
              </Button>
            </>
          ) : (
            <StatusBadge status={app.status} />
          )}
        </div>
      </div>
    </DialogContent>
  );
}

function CountTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-2 text-muted-foreground">
        <span className="text-xs">{label}</span>
        {icon}
      </div>
      <div className="mt-2 text-xl font-semibold text-foreground">{value}</div>
    </div>
  );
}
function InfoRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2.5 rounded-lg border border-border bg-card p-3">
      <div className="mt-0.5 shrink-0 text-muted-foreground">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        {href ? (
          <a
            href={href}
            className="break-all text-sm text-primary hover:underline"
          >
            {value}
          </a>
        ) : (
          <p className="break-words text-sm text-foreground">{value}</p>
        )}
      </div>
    </div>
  );
}
function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-background p-4 sm:p-5">
      <h3 className="mb-3 text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  );
}
function SkillPill({
  text,
  positive = false,
}: {
  text: string;
  positive?: boolean;
}) {
  return (
    <span
      className={`max-w-full break-words rounded-lg border px-2.5 py-1 text-xs ${positive ? "border-border bg-accent text-primary" : "border-border bg-card text-foreground"}`}
    >
      {text}
    </span>
  );
}
function Pills({
  items,
  empty,
  positive = false,
}: {
  items: string[];
  empty: string;
  positive?: boolean;
}) {
  return items.length ? (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <SkillPill key={`${item}-${i}`} text={item} positive={positive} />
      ))}
    </div>
  ) : (
    <p className="text-xs leading-5 text-muted-foreground">{empty}</p>
  );
}
function RecordList({
  items,
  empty,
}: {
  items: { title: string; meta?: string | null; description?: string | null }[];
  empty: string;
}) {
  if (!items.length)
    return <p className="text-sm leading-6 text-muted-foreground">{empty}</p>;
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          className="border-l-2 border-border pl-3"
          key={`${item.title}-${i}`}
        >
          <p className="text-sm font-semibold text-foreground">{item.title}</p>
          {item.meta && (
            <p className="mt-1 text-xs text-primary">{item.meta}</p>
          )}
          {item.description && (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
              {item.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
function IntelligenceTile({
  label,
  score,
}: {
  label: string;
  score?: number | null;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
        {typeof score === "number" ? `${score}/100` : "—"}
      </p>
    </div>
  );
}
