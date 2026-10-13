"use client";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRecruiterJobs } from "@/hooks/useRecruiterJobs";
import { useRecruiterCandidates } from "@/hooks/useRecruiterCandidates";
import {
  ActionLink,
  EmptyState,
  LoadingBriefing,
  PageHeading,
  QueryError,
  SectionHeading,
  TextLink,
} from "@/components/career/Primitives";
import { dateLabel, humanize } from "@/lib/career";
import type { RecruiterJob, TalentApplication } from "@/types/career";
export default function RecruiterHeroPage() {
  const jobsQuery = useRecruiterJobs();
  const talentQuery = useRecruiterCandidates();
  const jobs: RecruiterJob[] = jobsQuery.data?.jobs || [];
  const applications: TalentApplication[] =
    talentQuery.data?.applications || [];
  const review = applications.filter((app) => app.status === "APPLIED");
  return (
    <div className="signal-desk">
      <PageHeading
        eyebrow="01 / TALENT SIGNAL DESK"
        title="Good decisions start with evidence."
        description={`Your hiring workspace${jobsQuery.data?.recruiter?.companyName ? ` at ${jobsQuery.data.recruiter.companyName}` : ""}. Focus on what needs your attention, then look a little closer.`}
      >
        <ActionLink href="/recruiter/jobs?create=1">
          Create an opening
        </ActionLink>
      </PageHeading>
      {jobsQuery.isError && <QueryError onRetry={() => jobsQuery.refetch()} />}
      {talentQuery.isError && (
        <QueryError onRetry={() => talentQuery.refetch()} />
      )}
      <div className="desk-counts">
        {[
          {
            label: "Published openings",
            value: jobsQuery.isSuccess
              ? jobs.filter((job) => job.status === "PUBLISHED").length
              : null,
          },
          {
            label: "Applications received",
            value: talentQuery.isSuccess ? applications.length : null,
          },
          {
            label: "Awaiting review",
            value: talentQuery.isSuccess ? review.length : null,
          },
          {
            label: "Shortlisted",
            value: talentQuery.isSuccess
              ? applications.filter((app) => app.status === "SHORTLISTED")
                  .length
              : null,
          },
        ].map((metric, i) => (
          <div key={metric.label}>
            <span className="eyebrow">
              0{i + 1} / {metric.label}
            </span>
            <strong>{metric.value ?? "—"}</strong>
          </div>
        ))}
      </div>
      <div className="desk-workstreams">
        <section className="desk-reviews">
          <SectionHeading number="01" title="On your review desk">
            <TextLink href="/recruiter/candidates">All applicants</TextLink>
          </SectionHeading>
          <p className="section-note">
            Recent applications, shown in the order they arrived.
          </p>
          {talentQuery.isLoading ? (
            <LoadingBriefing />
          ) : talentQuery.isError ? (
            <p>Applications are unavailable until the connection recovers.</p>
          ) : review.length ? (
            review.slice(0, 5).map((app) => (
              <Link
                href={`/recruiter/candidates?application=${encodeURIComponent(app.id)}`}
                key={app.id}
                className="desk-applicant"
              >
                <span className="talent-initial">
                  {app.candidate.name?.slice(0, 1) || "?"}
                </span>
                <div>
                  <h3>{app.candidate.name || "Candidate"}</h3>
                  <p>{app.job.title}</p>
                  <small>
                    {app.matchedSkills.length} role skills identified ·{" "}
                    {dateLabel(app.appliedAt)}
                  </small>
                </div>
                <ArrowUpRight size={18} />
              </Link>
            ))
          ) : (
            <EmptyState
              title="A clear review desk."
              action={
                <TextLink href="/recruiter/jobs">Review your openings</TextLink>
              }
            >
              New applications will appear here. Every applicant deserves a
              closer look.
            </EmptyState>
          )}
        </section>
        <aside className="attention-note">
          <span className="eyebrow">THE NEXT ACTION</span>
          <span className="attention-number">
            {talentQuery.isSuccess
              ? String(review.length).padStart(2, "0")
              : "—"}
          </span>
          <h3>
            {review.length
              ? "Applications awaiting a human perspective."
              : "Make room for your next great hire."}
          </h3>
          <p>
            {review.length
              ? "Review the evidence in each profile against the role requirements. Similarity is a starting point for investigation."
              : "A thoughtful role description helps candidates understand the work and the capabilities you’re looking for."}
          </p>
          <ActionLink
            href={review.length ? "/recruiter/candidates" : "/recruiter/jobs"}
          >
            {review.length ? "Start reviewing" : "Manage your openings"}
          </ActionLink>
        </aside>
      </div>
      <section>
        <SectionHeading number="02" title="Your active workstreams">
          <TextLink href="/recruiter/jobs">Manage openings</TextLink>
        </SectionHeading>
        <div className="workstream-table">
          {jobsQuery.isLoading ? (
            <LoadingBriefing />
          ) : jobs.filter((job) => !["CLOSED", "ARCHIVED"].includes(job.status))
              .length ? (
            jobs
              .filter((job) => !["CLOSED", "ARCHIVED"].includes(job.status))
              .map((job, index) => (
                <Link
                  key={job.id}
                  href="/recruiter/jobs"
                  className="workstream-row"
                >
                  <span className="index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3>{job.title}</h3>
                    <p>
                      {job.skills.slice(0, 4).join(" · ") ||
                        "No skills specified"}
                    </p>
                  </div>
                  <span
                    className={`status-label status-${job.status.toLowerCase()}`}
                  >
                    {humanize(job.status)}
                  </span>
                  <span className="applicant-count">
                    <strong>{job.applicantsCount}</strong> applications
                  </span>
                  <ArrowRight size={18} />
                </Link>
              ))
          ) : (
            !jobsQuery.isError && (
              <EmptyState
                title="Start your first workstream."
                action={
                  <ActionLink href="/recruiter/jobs?create=1">
                    Create an opening
                  </ActionLink>
                }
              >
                Define the role, the work, and the evidence that matters.
              </EmptyState>
            )
          )}
        </div>
      </section>
      <section className="desk-pipeline">
        <SectionHeading number="03" title="Application stages" />
        <div className="stage-strip">
          {[
            "APPLIED",
            "SHORTLISTED",
            "INTERVIEW_SCHEDULED",
            "OFFERED",
            "HIRED",
            "REJECTED",
            "WITHDRAWN",
          ].map((status, i) => (
            <div key={status}>
              <span className="eyebrow">{String(i + 1).padStart(2, "0")}</span>
              <strong>
                {talentQuery.isSuccess
                  ? applications.filter((app) => app.status === status).length
                  : "—"}
              </strong>
              <span>{humanize(status)}</span>
            </div>
          ))}
        </div>
        <p className="section-note">
          Current statuses across your applications. Counts reflect the stored
          status, not a predicted progression.
        </p>
      </section>
    </div>
  );
}
