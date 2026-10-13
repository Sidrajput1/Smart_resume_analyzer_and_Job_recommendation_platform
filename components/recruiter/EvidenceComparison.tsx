"use client";
import { useState } from "react";
import { Check, Minus, ArrowUpRight } from "lucide-react";
type EvidenceApplication = {
  id: string;
  job: { id: string; title: string };
  candidate: { name: string; resume?: { fileUrl?: string | null } | null };
  matchedSkills?: string[] | null;
  missingSkills?: string[] | null;
};
export default function EvidenceComparison({
  applications,
}: {
  applications: EvidenceApplication[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [jobId, setJobId] = useState("");
  const [firstId, setFirstId] = useState("");
  const [secondId, setSecondId] = useState("");
  const roles = [
    ...new Map(
      applications.map((app) => [app.job.id, app.job.title]),
    ).entries(),
  ];
  const activeJob = roles.some(([id]) => id === jobId) ? jobId : roles[0]?.[0];
  const pool = applications.filter((app) => app.job.id === activeJob);
  const first = pool.find((app) => app.id === firstId) || pool[0];
  const second =
    pool.find((app) => app.id === secondId && app.id !== first?.id) ||
    pool.find((app) => app.id !== first?.id);
  const requirements = [
    ...new Set([
      ...(first?.matchedSkills || []),
      ...(first?.missingSkills || []),
      ...(second?.matchedSkills || []),
      ...(second?.missingSkills || []),
    ]),
  ];
  return (
    <section className="evidence-comparison">
      <button
        className="comparison-toggle"
        aria-expanded={expanded}
        onClick={() => setExpanded(!expanded)}
      >
        <span>
          <span className="eyebrow">A SHARED FRAME OF REFERENCE</span>
          <strong>Compare evidence for the same role</strong>
        </span>
        <span>{expanded ? "Close −" : "Open +"}</span>
      </button>
      {expanded && (
        <div className="comparison-content">
          <div className="comparison-selectors">
            <div>
              <label htmlFor="comparison-role">Role requirements</label>
              <select
                id="comparison-role"
                value={activeJob || ""}
                onChange={(event) => {
                  setJobId(event.target.value);
                  setFirstId("");
                  setSecondId("");
                }}
              >
                {roles.map(([id, title]) => (
                  <option value={id} key={id}>
                    {title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="comparison-first">First profile</label>
              <select
                id="comparison-first"
                value={first?.id || ""}
                onChange={(event) => setFirstId(event.target.value)}
              >
                {pool.map((app) => (
                  <option value={app.id} key={app.id}>
                    {app.candidate.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="comparison-second">Second profile</label>
              <select
                id="comparison-second"
                value={second?.id || ""}
                onChange={(event) => setSecondId(event.target.value)}
              >
                {pool
                  .filter((app) => app.id !== first?.id)
                  .map((app) => (
                    <option value={app.id} key={app.id}>
                      {app.candidate.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          {!second ? (
            <p className="section-note">
              This role needs at least two applications to compare. Try another
              role.
            </p>
          ) : (
            <div className="comparison-scroll">
              <table>
                <caption className="sr-only">
                  Profile mentions against the same role requirements
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Role requirement</th>
                    <th scope="col">{first?.candidate.name}</th>
                    <th scope="col">{second.candidate.name}</th>
                  </tr>
                </thead>
                <tbody>
                  {requirements.map((skill) => (
                    <tr key={skill}>
                      <th scope="row">{skill}</th>
                      {[first, second].map((app, i) => (
                        <td key={i}>
                          {app?.matchedSkills?.includes(skill) ? (
                            <span className="evidence-found">
                              <Check size={13} />
                              Mention identified
                            </span>
                          ) : app?.missingSkills?.includes(skill) ? (
                            <span>
                              <Minus size={13} />
                              Not found in profile
                            </span>
                          ) : (
                            <span>Not evaluated</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {requirements.length === 0 && (
                    <tr>
                      <td colSpan={3}>
                        No requirement evidence is available for these
                        applications.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          <p className="metric-context">
            This comparison uses terms identified in the available profile
            information. A mention needs context; a term not found is not proof
            that a candidate lacks a capability. Inspect the source resumes
            before making a decision.
          </p>
          <div className="comparison-resumes">
            {[first, second].filter(Boolean).map(
              (app) =>
                app?.candidate.resume?.fileUrl && (
                  <a
                    className="text-link"
                    key={app.id}
                    href={app.candidate.resume.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {app.candidate.name}’s resume
                    <ArrowUpRight size={15} />
                  </a>
                ),
            )}
          </div>
        </div>
      )}
    </section>
  );
}
