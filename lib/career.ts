import type { CandidateProfile, Opportunity } from "@/types/career";
export function humanize(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
export function dateLabel(value?: string | null) {
  if (!value || Number.isNaN(Date.parse(value))) return "Not available";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}
export function salaryLabel(job: Opportunity) {
  if (job.salaryMin == null && job.salaryMax == null)
    return "Salary not listed";
  const format = (amount: number) =>
    `${job.currency || "INR"} ${new Intl.NumberFormat("en-IN").format(amount)}`;
  if (job.salaryMin != null && job.salaryMax != null)
    return `${format(job.salaryMin)} – ${new Intl.NumberFormat("en-IN").format(job.salaryMax)}`;
  return job.salaryMin != null
    ? `From ${format(job.salaryMin)}`
    : `Up to ${format(job.salaryMax!)}`;
}
export function skillEvidence(profile: CandidateProfile, skill: string) {
  const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const term = new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, "i");
  const evidence: { source: string; text: string }[] = [];
  profile.experiences?.forEach((item) => {
    const text = [item.description, item.responsibilities]
      .filter(Boolean)
      .join(" ");
    if (term.test(text))
      evidence.push({ source: `${item.jobTitle} · ${item.companyName}`, text });
  });
  profile.projects?.forEach((item) => {
    const text = [item.technologies, item.description]
      .filter(Boolean)
      .join(" ");
    if (term.test(text)) evidence.push({ source: item.title, text });
  });
  profile.educations?.forEach((item) => {
    const text = [item.fieldOfStudy, item.description]
      .filter(Boolean)
      .join(" ");
    if (term.test(text))
      evidence.push({
        source: `${item.degree} · ${item.institutionName}`,
        text,
      });
  });
  return evidence;
}
export function filterOpportunities(
  jobs: Opportunity[],
  mode: string,
  onlyMatched: boolean,
) {
  return jobs.filter(
    (job) =>
      (!mode || job.workMode === mode) &&
      (!onlyMatched || job.matchedSkills.length > 0),
  );
}
