"use client";
import { ArrowUpRight, FileText, Check, CornerDownRight } from "lucide-react";
import Link from "next/link";
import { useCandidateResume } from "@/hooks/useCandidateResume";
import { useCandidateJobs } from "@/hooks/useCandidateJobs";
import { useCandidateApplications } from "@/hooks/useCandidateApplications";
import CapabilityMap from "@/components/career/CapabilityMap";
import {
  ActionLink,
  EmptyState,
  LoadingBriefing,
  QueryError,
  SectionHeading,
  TextLink,
} from "@/components/career/Primitives";
import { dateLabel, humanize } from "@/lib/career";
import type { CandidateProfile, Opportunity } from "@/types/career";

export default function CandidateHeroPage({ name }: { name: string }) {
  const resumeQuery = useCandidateResume();
  const jobsQuery = useCandidateJobs();
  const applicationsQuery = useCandidateApplications();
  if (resumeQuery.isLoading) return <LoadingBriefing />;
  if (resumeQuery.isError)
    return <QueryError onRetry={() => resumeQuery.refetch()} />;
  const profile: CandidateProfile | undefined = resumeQuery.data?.candidate;
  const intelligence = profile?.intelligence;
  const resume = profile?.resume;
  const jobs: Opportunity[] = jobsQuery.data?.jobs || [];
  const opportunities = [...jobs]
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);
  const action = intelligence?.weaknesses?.[0] || intelligence?.skillGaps?.[0];
  const hasFile = Boolean(resume?.fileUrl);
  
  return (
    <div className="atlas">
      <div className="briefing-kicker">
        <span className="eyebrow">YOUR PERSONAL CAREER BRIEFING</span>
        <span className="eyebrow">01 / CAREER ATLAS</span>
      </div>
      <section className="atlas-opening">
        <div className="atlas-intro">
          <p className="greeting">
            Hello, {name.split(" ")[0]} <span className="greeting-line" />
          </p>
          <h1>
            {intelligence ? (
              <>
                Your experience
                <br />
                has a <em>direction.</em>
              </>
            ) : (
              <>
                Your next chapter
                <br />
                starts <em>here.</em>
              </>
            )}
          </h1>
          <p>
            {intelligence?.summary ||
              "Connect what you know, the evidence behind it, and the opportunities ahead. Let’s make your next step a little clearer."}
          </p>
          <div className="intro-actions">
            <ActionLink
              href={hasFile ? "/candidate/intelligence" : "/candidate/resume"}
            >
              {hasFile
                ? "Explore your intelligence"
                : "Bring your resume to life"}
            </ActionLink>
            <TextLink href="/candidate/jobs">Discover opportunities</TextLink>
          </div>
          <div className="briefing-source">
            <span className="status-dot" />
            <span>
              {intelligence
                ? `Analysis generated ${dateLabel(intelligence.updatedAt || intelligence.generatedAt)}`
                : hasFile
                  ? "Your document is ready for analysis"
                  : "Your career, in your own words"}
            </span>
          </div>
        </div>
        <CapabilityMap profile={profile} compact />
      </section>
      <section className="atlas-mid">
        <div className="next-step">
          <SectionHeading number="01" title="Your next useful step" />
          <span className="next-step-marker">
            <CornerDownRight size={24} />
          </span>
          <h3>
            {action ||
              (hasFile
                ? "Turn your resume into a clearer picture."
                : "Start with the story you already have.")}
          </h3>
          <p>
            {action
              ? intelligence?.suggestions ||
                "Review this finding alongside your experience, then update your profile with relevant examples."
              : hasFile
                ? "Parse your document, review the extracted details, and generate a report from your profile."
                : "Upload a PDF or DOCX. Review what’s extracted before adding it to your profile."}
          </p>
          <TextLink
            href={action ? "/candidate/intelligence" : "/candidate/resume"}
          >
            {action
              ? "Review your findings"
              : hasFile
                ? "Open your resume"
                : "Upload your first resume"}
          </TextLink>
        </div>
        <div className="resume-dossier">
          <SectionHeading number="02" title="Resume dossier" />
          <div className="dossier-inner">
            <div className="document-thumb" aria-hidden="true">
              <FileText size={27} strokeWidth={1.1} />
              <span />
              <span />
              <span />
              <i />
            </div>
            <div>
              <span className="eyebrow">YOUR SOURCE DOCUMENT</span>
              <h3>
                {resume?.fileName ||
                  resume?.title ||
                  "A story waiting to be told"}
              </h3>
              <p>
                {hasFile
                  ? `${humanize(resume!.status)} · Updated ${dateLabel(resume!.updatedAt)}`
                  : "No document uploaded yet"}
              </p>
              <Link href="/candidate/resume" className="text-link">
                {hasFile ? "Review document" : "Add document"}
                <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
          <div className="dossier-foot">
            <span>
              <Check size={13} />
              You review extracted details
            </span>
            <span>PDF / DOCX · 5 MB max.</span>
          </div>
        </div>
      </section>
      <section className="opportunity-stream">
        <SectionHeading number="03" title="Possibilities worth exploring">
          <TextLink href="/candidate/jobs">All opportunities</TextLink>
        </SectionHeading>
        <p className="section-note">
          Relevant openings, with the evidence behind each connection.
        </p>
        {jobsQuery.isLoading ? (
          <p role="status" className="inline-status">
            Finding available openings…
          </p>
        ) : jobsQuery.isError ? (
          <QueryError onRetry={() => jobsQuery.refetch()} />
        ) : opportunities.length ? (
          opportunities.map((job, index) => (
            <Link
              className="opportunity-row"
              href={`/candidate/jobs?job=${encodeURIComponent(job.id)}`}
              key={job.id}
            >
              <span className="opportunity-index">0{index + 1}</span>
              <span className="company-initial">
                {job.company.name.slice(0, 1)}
              </span>
              <div className="opportunity-name">
                <p>
                  {job.company.name}
                  <span> / {humanize(job.workMode)}</span>
                </p>
                <h3>{job.title}</h3>
                <small>
                  {job.requiredSkills.slice(0, 3).join(" · ") ||
                    "See role requirements"}
                </small>
              </div>
              <div className="opportunity-match">
                <strong>
                  {Number.isFinite(job.matchScore)
                    ? `${Math.round(job.matchScore)}%`
                    : "—"}
                </strong>
                <span>profile similarity</span>
              </div>
              <ArrowUpRight size={21} />
            </Link>
          ))
        ) : (
          <EmptyState
            title="Your possibilities are still taking shape."
            action={
              <TextLink href="/candidate/jobs">Explore the job board</TextLink>
            }
          >
            Published openings will appear here when available. Keep your
            profile up to date so you’re ready.
          </EmptyState>
        )}
      </section>
      <div className="atlas-bottom">
        <span>
          <span className="index">↗</span> A career is more than a collection of
          keywords.
        </span>
        <TextLink href="/candidate/applications-tracking">
          {applicationsQuery.isSuccess
            ? `Follow your ${applicationsQuery.data?.applications?.length || 0} applications`
            : "Follow your applications"}
        </TextLink>
      </div>
    </div>
  );
}
