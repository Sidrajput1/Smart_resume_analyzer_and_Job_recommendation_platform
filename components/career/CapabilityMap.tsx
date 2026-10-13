"use client";
import { useState } from "react";
import { ArrowUpRight, X, Network } from "lucide-react";
import Link from "next/link";
import type { CandidateProfile } from "@/types/career";
import { skillEvidence } from "@/lib/career";

export default function CapabilityMap({
  profile,
  compact = false,
}: {
  profile?: CandidateProfile;
  compact?: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const skills = profile?.candidateSkills || [];
  const visible =
    expanded && !compact ? skills : skills.slice(0, compact ? 8 : 12);
  const evidence = selected && profile ? skillEvidence(profile, selected) : [];
  return (
    <div className={`capability-board ${compact ? "compact" : ""}`}>
      <div className="map-header">
        <span className="eyebrow">CAPABILITY MAP</span>
        <span className="map-total">
          {skills.length} profile skills
          <Network size={15} />
        </span>
      </div>
      {skills.length > 0 ? (
        <div className="map-canvas">
          <div className="map-axis" aria-hidden="true" />
          <div className="map-origin">
            <span className="origin-cross">+</span>
            <span>YOUR PROFILE</span>
          </div>
          <div className="map-nodes">
            {visible.map(({ id, skill }) => (
              <button
                key={id}
                className={`map-node ${selected === skill.name ? "selected" : ""}`}
                aria-pressed={selected === skill.name}
                onClick={() =>
                  setSelected(selected === skill.name ? null : skill.name)
                }
              >
                <span className="node-dot" />
                <span>
                  {skill.name}
                  <small>{skill.category || "Listed in profile"}</small>
                </span>
                <ArrowUpRight size={13} />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="map-empty">
          <div className="map-reticle" aria-hidden="true">
            <span />
            <span />
            <span />
            <i>+</i>
          </div>
          <h3>A map of what makes you, you.</h3>
          <p>Add your skills to bring your capabilities into focus.</p>
          <Link href="/candidate/resume" className="map-empty-link">
            Start with your resume
            <ArrowUpRight size={15} />
          </Link>
        </div>
      )}
      {selected && (
        <div className="map-evidence" aria-live="polite">
          <button
            className="icon-button"
            aria-label="Close skill evidence"
            onClick={() => setSelected(null)}
          >
            <X size={16} />
          </button>
          <span className="eyebrow">PROFILE EVIDENCE / {selected}</span>
          {evidence.length ? (
            evidence.map((item, index) => (
              <div key={index}>
                <strong>{item.source}</strong>
                <p>{item.text}</p>
              </div>
            ))
          ) : (
            <p>
              This skill is listed in your profile. No explicit mention was
              found in the experience, project, or education descriptions. Add
              context to make your experience clearer.
            </p>
          )}
        </div>
      )}
      <div className="map-legend">
        <span>
          <i className="node-dot" />
          Listed skill — select to inspect evidence
        </span>
        <span>
          {skills.length > visible.length ? (
            compact ? (
              <Link href="/candidate/intelligence">
                Explore all {skills.length} skills ↗
              </Link>
            ) : (
              <button className="map-more" onClick={() => setExpanded(true)}>
                Show all {skills.length} skills +
              </button>
            )
          ) : expanded ? (
            <button className="map-more" onClick={() => setExpanded(false)}>
              Show fewer skills −
            </button>
          ) : (
            "Connections show profile membership"
          )}
        </span>
      </div>
    </div>
  );
}
