import { Check, ArrowUpRight } from "lucide-react";
import type { CandidateProfile } from "@/types/career";
import { dateLabel } from "@/lib/career";
import { EmptyState, SectionHeading, TextLink } from "./Primitives";
import CapabilityMap from "./CapabilityMap";
export default function IntelligenceReport({
  profile,
}: {
  profile: CandidateProfile;
}) {
  const report = profile.intelligence;
  if (!report)
    return (
      <EmptyState title="Your experience deserves a closer look.">
        Upload and parse your resume, review your profile, then generate your
        first intelligence report.
      </EmptyState>
    );
  const metrics = [
    { name: "ATS compatibility", value: report.atsScore },
    { name: "Skills", value: report.skillScore },
    { name: "Experience", value: report.experienceScore },
    { name: "Education", value: report.educationScore },
    { name: "Projects", value: report.projectScore },
  ];
  return (
    <div className="intelligence-report">
      <section className="report-assessment">
        <div className="report-score">
          <span className="eyebrow">OVERALL ASSESSMENT</span>
          <div>
            <strong>
              {Number.isFinite(report.overallScore)
                ? Math.round(report.overallScore)
                : "—"}
            </strong>
            <span>/ 100</span>
          </div>
          <span className="score-caption">Generated resume assessment</span>
        </div>
        <div className="report-summary">
          <span className="eyebrow">THE BIGGER PICTURE</span>
          <h2>Your experience, brought into focus.</h2>
          <p>
            {report.summary ||
              "Explore the evidence and suggestions below to understand the generated assessment."}
          </p>
          <small>
            Last generated {dateLabel(report.updatedAt || report.generatedAt)}
            {report.modelVersion && ` · ${report.modelVersion}`}
          </small>
        </div>
      </section>
      {profile.resume?.updatedAt &&
        Date.parse(profile.resume.updatedAt) -
          Date.parse(report.updatedAt || report.generatedAt) >
          60_000 && (
          <p className="validation-error">
            This report predates your latest resume update. Refresh intelligence
            to assess the current document.
          </p>
        )}
      <p className="metric-context">
        These are generated resume assessments. They describe the information in
        this profile; they do not measure your overall capability or predict
        hiring outcomes. Scoring details are not available with this assessment.
      </p>
      <div className="assessment-bars">
        {metrics.map((metric) => (
          <div key={metric.name}>
            <div>
              <span>{metric.name}</span>
              <strong>
                {Number.isFinite(metric.value) ? Math.round(metric.value) : "—"}
                <small> / 100</small>
              </strong>
            </div>
            <div className="assessment-track">
              <span
                style={{
                  width: `${Number.isFinite(metric.value) ? Math.min(100, Math.max(0, metric.value)) : 0}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="report-evidence-grid">
        <section>
          <SectionHeading number="01" title="What comes through" />
          {report.strengths.length ? (
            <ul className="finding-list">
              {report.strengths.map((item, i) => (
                <li key={i}>
                  <Check size={16} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="section-note">
              No strengths were returned in this analysis.
            </p>
          )}
        </section>
        <section>
          <SectionHeading number="02" title="Room to make it clearer" />
          {report.weaknesses.length ? (
            <ol className="numbered-findings">
              {report.weaknesses.map((item, i) => (
                <li key={i}>
                  <span className="index">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="section-note">
              No improvement findings were returned.
            </p>
          )}
        </section>
      </div>
      <section>
        <SectionHeading number="03" title="The capability behind the keyword" />
        <CapabilityMap profile={profile} />
      </section>
      <div className="report-evidence-grid">
        <section>
          <SectionHeading number="04" title="Directions to explore" />
          <p className="section-note">
            Roles suggested by this analysis. Explore their actual requirements.
          </p>
          {report.recommendedRoles.length ? (
            report.recommendedRoles.map((role, i) => (
              <div className="recommended-role" key={i}>
                <span className="index">0{i + 1}</span>
                <h3>{role}</h3>
                <TextLink
                  href={`/candidate/jobs?q=${encodeURIComponent(role)}`}
                >
                  <span className="sr-only">Find {role} jobs</span>
                  <ArrowUpRight size={17} />
                </TextLink>
              </div>
            ))
          ) : (
            <p className="section-note">No role suggestions available.</p>
          )}
        </section>
        <section className="improvement-note">
          <span className="eyebrow">FROM INSIGHT TO ACTION</span>
          <h3>Your next iteration.</h3>
          <p>
            {report.suggestions ||
              "Add specific context to your experience: the work you did, the tools you used, and the results you can support."}
          </p>
          {report.skillGaps.length > 0 && (
            <>
              <p className="eyebrow">SKILLS SUGGESTED FOR EXPLORATION</p>
              <ul>
                {report.skillGaps.map((gap, i) => (
                  <li key={i}>{gap}</li>
                ))}
              </ul>
              <p className="metric-context">
                These are analysis suggestions, not verified gaps in your
                abilities.
              </p>
            </>
          )}
          <TextLink href="/candidate/profile">
            Add evidence to your profile
          </TextLink>
        </section>
      </div>
    </div>
  );
}
