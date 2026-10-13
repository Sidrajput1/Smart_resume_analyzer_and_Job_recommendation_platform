"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Search,
  MapPin,
  Check,
  X,
  Building2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useApplyJob, useCandidateJobs } from "@/hooks/useCandidateJobs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useSearchParams } from "next/navigation";
import { Opportunity } from "@/types/career";
import {
  dateLabel,
  filterOpportunities,
  humanize,
  salaryLabel,
} from "@/lib/career";
import {
  EmptyState,
  LoadingBriefing,
  PageHeading,
  QueryError,
  TextLink,
} from "../career/Primitives";

export default function CandidateJobsClient() {
  // const [searchInput, setSearchInput] = React.useState("");
  // const [search, setSearch] = React.useState("");

  // const { data, isLoading } = useCandidateJobs(search);
  // const applyMutation = useApplyJob();

  // const jobs = data?.jobs ?? [];

  // function handleSearch(e: React.FormEvent<HTMLFormElement>) {
  //   e.preventDefault();
  //   setSearch(searchInput.trim());
  // }

  // async function handleApply(jobId: string) {
  //   await applyMutation.mutateAsync(jobId);
  // }

  const params = useSearchParams();
  const [now] = React.useState(Date.now);
  const [input, setInput] = useState(params.get("q") || "");
  const [search, setSearch] = useState(params.get("q") || "");
  const [mode, setMode] = useState("");
  const [onlyMatched, setOnlyMatched] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const query = useCandidateJobs(search);
  const apply = useApplyJob();
  const jobs: Opportunity[] = query.data?.jobs || [];
  const visible = filterOpportunities(jobs, mode, onlyMatched);
  const requestedId = selectedId || params.get("job");
  const selected = visible.find((job) => job.id === requestedId) || visible[0];

  // if (isLoading) {
  //   return <JobsSkeleton />;
  // }

  return (
    <div className="job-explorer">
      <PageHeading
        eyebrow="04 / OPPORTUNITY EXPLORER"
        title="Find your next meaningful move."
        description="Explore the work, understand the requirements, and see where your experience connects."
      />
      <form
        className="opportunity-search"
        onSubmit={(event) => {
          event.preventDefault();
          setSearch(input.trim());
          setSelectedId(null);
        }}
      >
        <Search size={21} />
        <label className="sr-only" htmlFor="job-search">
          Search roles, companies, or keywords
        </label>
        <input
          id="job-search"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="A role, a company, a possibility…"
        />
        <button className="action" type="submit">
          Explore
          <ArrowRight size={17} />
        </button>
      </form>
      <div className="opportunity-filters">
        <div className="filter-pills" aria-label="Work arrangement">
          {[
            { value: "", label: "All arrangements" },
            { value: "REMOTE", label: "Remote" },
            { value: "HYBRID", label: "Hybrid" },
            { value: "ONSITE", label: "On site" },
          ].map((filter) => (
            <button
              key={filter.value}
              aria-pressed={mode === filter.value}
              className={mode === filter.value ? "selected" : ""}
              onClick={() => {
                setMode(filter.value);
                setSelectedId(null);
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <label className="match-filter">
          <input
            type="checkbox"
            checked={onlyMatched}
            onChange={(event) => setOnlyMatched(event.target.checked)}
          />
          Has matching signals
        </label>
      </div>
      {query.isLoading ? (
        <LoadingBriefing />
      ) : query.isError ? (
        <QueryError onRetry={() => query.refetch()} />
      ) : !visible.length ? (
        <EmptyState
          title="A different direction might open things up."
          action={
            <button
              className="action action-secondary"
              onClick={() => {
                setInput("");
                setSearch("");
                setMode("");
                setOnlyMatched(false);
              }}
            >
              Reset search & filters
            </button>
          }
        >
          {jobs.length
            ? "No openings match these filters. Broaden your search to see more possibilities."
            : "No published openings match your search right now. Try another role or check back when new jobs are published."}
        </EmptyState>
      ) : (
        <div className="job-split">
          <section className="job-list" aria-label="Available opportunities">
            <div className="results-caption">
              <span className="eyebrow">
                {visible.length} OPEN{" "}
                {visible.length === 1 ? "POSSIBILITY" : "POSSIBILITIES"}
              </span>
              <span>Explore, then look closer.</span>
            </div>
            {visible.map((job, index) => (
              <button
                className={`job-list-row ${selected?.id === job.id ? "active" : ""}`}
                key={job.id}
                aria-pressed={selected?.id === job.id}
                onClick={() => {
                  setSelectedId(job.id);
                  apply.reset();
                }}
              >
                <div className="job-row-top">
                  <span className="company-initial">
                    {job.company.name.slice(0, 1)}
                  </span>
                  <span>{job.company.name}</span>
                  <span className="index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h2>{job.title}</h2>
                <p>
                  <MapPin size={13} />
                  {job.locationCity ||
                    job.locationCountry ||
                    "Location not listed"}
                  <span>· {humanize(job.workMode)}</span>
                </p>
                <div className="job-row-bottom">
                  <span>
                    {job.isApplied ? (
                      <>
                        <Check size={13} />
                        Applied
                      </>
                    ) : (
                      `${job.matchedSkills.length} matching signals`
                    )}
                  </span>
                  <span>
                    {Number.isFinite(job.matchScore)
                      ? `${Math.round(job.matchScore)}% similarity`
                      : "Score unavailable"}
                    <ArrowUpRight size={15} />
                  </span>
                </div>
              </button>
            ))}
          </section>
          {selected && (
            <section
              className="job-details"
              aria-label={`Details for ${selected.title}`}
            >
              <div className="job-detail-company">
                <Building2 size={19} />
                <span>{selected.company.name}</span>
                <span className="eyebrow">ROLE / DETAILS</span>
              </div>
              <h2>{selected.title}</h2>
              <div className="job-detail-metadata">
                <span>{humanize(selected.jobType)}</span>
                <span>{humanize(selected.workMode)}</span>
                <span>
                  {selected.locationCity ||
                    selected.locationCountry ||
                    "Location not listed"}
                </span>
              </div>
              <p className="job-salary">{salaryLabel(selected)}</p>
              <div className="job-detail-apply">
                <button
                  className="action"
                  disabled={
                    selected.isApplied ||
                    apply.isPending ||
                    Boolean(
                      selected.applicationDeadline &&
                      now > Date.parse(selected.applicationDeadline),
                    )
                  }
                  onClick={() => setConfirm(true)}
                >
                  {selected.isApplied
                    ? "Application sent ✓"
                    : selected.applicationDeadline &&
                        now > Date.parse(selected.applicationDeadline)
                      ? "Deadline passed"
                      : "Apply to this opportunity"}
                  <ArrowUpRight size={16} />
                </button>
                {selected.isApplied && (
                  <TextLink href="/candidate/applications-tracking">
                    Track application
                  </TextLink>
                )}
              </div>
              <div className="fit-evidence">
                <div>
                  <span className="eyebrow">YOUR CONNECTION TO THIS ROLE</span>
                  <strong>
                    {Number.isFinite(selected.matchScore)
                      ? `${Math.round(selected.matchScore)}%`
                      : "—"}
                  </strong>
                  <small>profile similarity</small>
                </div>
                <p>
                  Profile similarity compares your available information with
                  this role using text or skill matching. It is a signal to
                  explore, not a prediction of hiring success. The method used
                  for this result is not provided.
                </p>
                <div className="matching-signals">
                  <span className="eyebrow">MATCHING SIGNALS</span>
                  {selected.matchedSkills.length ? (
                    selected.matchedSkills.map((skill, index) => (
                      <span key={index}>
                        <Check size={13} />
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p>No matching signals were identified.</p>
                  )}
                </div>
              </div>
              <div className="job-description">
                <span className="eyebrow">01 / ABOUT THE WORK</span>
                <p>{selected.description}</p>
              </div>
              <div className="requirement-sheet">
                <span className="eyebrow">02 / SKILLS REQUESTED</span>
                {selected.requiredSkills.length ? (
                  selected.requiredSkills.map((skill, index) => (
                    <div key={index}>
                      <span>{skill}</span>
                      {selected.missingSkills.includes(skill) ? (
                        <small className="not-found">
                          Not found in profile
                        </small>
                      ) : (
                        <small>
                          <Check size={13} />
                          Matching signal
                        </small>
                      )}
                    </div>
                  ))
                ) : (
                  <p>No skills have been specified for this role.</p>
                )}
                <p className="metric-context">
                  “Not found” means the available profile information doesn’t
                  mention this requirement. It does not mean you lack the
                  capability.
                </p>
              </div>
              <div className="job-detail-foot">
                <span>Published {dateLabel(selected.publishedAt)}</span>
                {selected.applicationDeadline && (
                  <span>
                    Apply by {dateLabel(selected.applicationDeadline)}
                  </span>
                )}
              </div>
            </section>
          )}
        </div>
      )}
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for {selected?.title}?</DialogTitle>
            <DialogDescription>
              Your current resume will be submitted to {selected?.company.name}.
              Review your source document if you’d like to update it first.
            </DialogDescription>
          </DialogHeader>
          <div className="confirmation-actions">
            <button
              className="action action-secondary"
              disabled={apply.isPending}
              onClick={() => setConfirm(false)}
            >
              <X size={15} />
              Cancel
            </button>
            <button
              className="action"
              disabled={apply.isPending || selected?.isApplied}
              onClick={() =>
                selected &&
                apply.mutate(selected.id, {
                  onSuccess: () => setConfirm(false),
                })
              }
            >
              {apply.isPending ? "Submitting…" : "Submit application ↗"}
            </button>
          </div>
          {apply.isError && (
            <p className="validation-error" role="alert">
              Application could not be submitted. Check that you have uploaded
              your resume and try again.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// function Metric({ title, value }: { title: string; value: string }) {
//   return (
//     <Card className="border-white/10 bg-white/5 text-white backdrop-blur">
//       <CardContent className="p-5">
//         <p className="text-sm text-slate-400">{title}</p>
//         <p className="mt-1 text-3xl font-bold">{value}</p>
//       </CardContent>
//     </Card>
//   );
// }

// function JobsSkeleton() {
//   return (
//     <div className="space-y-4">
//       <Skeleton className="h-28 w-full rounded-3xl bg-white/10" />
//       <Skeleton className="h-12 w-full rounded-2xl bg-white/10" />
//       <div className="grid gap-4 xl:grid-cols-2">
//         <Skeleton className="h-72 rounded-3xl bg-white/10" />
//         <Skeleton className="h-72 rounded-3xl bg-white/10" />
//       </div>
//     </div>
//   );
// }
