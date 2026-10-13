"use client";

import {
  BriefcaseBusiness,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Lightbulb,
  Medal,
  User,
  Wrench,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ParsedResumeData } from "@/types/resume-parser";

interface ResumeExtractedDataProps {
  data: ParsedResumeData;
}

export function ResumeExtractedData({ data }: ResumeExtractedDataProps) {
  return (
    <div className="space-y-5">
      {/* Header */}
      <Card className="border-border bg-card text-foreground ">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Information Extracted
          </CardTitle>

          <p className="text-sm text-muted-foreground">
            Review the information detected from your resume before adding it to
            your profile.
          </p>
        </CardHeader>
      </Card>

      {/* Personal information */}
      <Card className="border-border bg-card text-foreground ">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-primary" />
            Personal Information
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 md:grid-cols-2">
          <InfoItem label="Full Name" value={data.personal.fullName} />

          <InfoItem label="Email" value={data.personal.email} />

          <InfoItem label="Phone" value={data.personal.phone} />

          <InfoItem label="Location" value={data.personal.location} />

          <InfoItem label="LinkedIn" value={data.personal.linkedinUrl} isLink />

          <InfoItem label="GitHub" value={data.personal.githubUrl} isLink />

          <InfoItem
            label="Portfolio"
            value={data.personal.portfolioUrl}
            isLink
          />
        </CardContent>
      </Card>

      {/* Summary */}
      {data.summary && (
        <Card className="border-border bg-card text-foreground ">
          <CardHeader>
            <CardTitle className="text-base">Professional Summary</CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-sm leading-7 text-foreground">{data.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Education */}
      <SectionCard
        title="Education"
        icon={<GraduationCap className="h-4 w-4 text-primary" />}
        count={data.education.length}
      >
        {data.education.length === 0 ? (
          <EmptySection />
        ) : (
          <div className="space-y-4">
            {data.education.map((education, index) => (
              <div
                key={`${education.institution}-${index}`}
                className="rounded-md border border-border bg-card p-4"
              >
                <p className="font-semibold text-foreground">
                  {education.degree || "Degree not detected"}
                </p>

                <p className="mt-1 text-sm text-foreground">
                  {education.fieldOfStudy || "Field not detected"}
                </p>

                <p className="mt-2 text-sm text-primary">
                  {education.institution || "Institution not detected"}
                </p>

                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {(education.startDate || education.endDate) && (
                    <span>
                      {education.startDate ?? "?"} -{" "}
                      {education.endDate ?? "Present"}
                    </span>
                  )}

                  {education.location && <span>{education.location}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Experience */}
      <SectionCard
        title="Experience"
        icon={<BriefcaseBusiness className="h-4 w-4 text-primary" />}
        count={data.experience.length}
      >
        {data.experience.length === 0 ? (
          <EmptySection />
        ) : (
          <div className="space-y-4">
            {data.experience.map((experience, index) => (
              <div
                key={`${experience.company}-${index}`}
                className="rounded-md border border-border bg-card p-4"
              >
                <p className="font-semibold text-foreground">
                  {experience.role || "Role not detected"}
                </p>

                <p className="mt-1 text-sm text-primary">
                  {experience.company || "Company not detected"}
                </p>

                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {(experience.startDate || experience.endDate) && (
                    <span>
                      {experience.startDate ?? "?"} -{" "}
                      {experience.endDate ?? "Present"}
                    </span>
                  )}

                  {experience.location && <span>{experience.location}</span>}
                </div>

                {experience.responsibilities.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {experience.responsibilities.map(
                      (responsibility, responsibilityIndex) => (
                        <li
                          key={responsibilityIndex}
                          className="flex gap-2 text-sm leading-6 text-foreground"
                        >
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />

                          <span>{responsibility}</span>
                        </li>
                      ),
                    )}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Skills */}
      <SectionCard
        title="Skills"
        icon={<Wrench className="h-4 w-4 text-primary" />}
        count={data.skills.length}
      >
        {data.skills.length === 0 ? (
          <EmptySection />
        ) : (
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Certifications */}
      <SectionCard
        title="Certifications"
        icon={<Medal className="h-4 w-4 text-primary" />}
        count={data.certifications.length}
      >
        {data.certifications.length === 0 ? (
          <EmptySection />
        ) : (
          <div className="space-y-3">
            {data.certifications.map((certification, index) => (
              <div
                key={`${certification.title}-${index}`}
                className="rounded-xl border border-border bg-card p-4"
              >
                <p className="font-medium text-foreground">
                  {certification.title}
                </p>

                {certification.issuer && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {certification.issuer}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Projects */}
      <SectionCard
        title="Projects"
        icon={<Lightbulb className="h-4 w-4 text-primary" />}
        count={data.projects.length}
      >
        {data.projects.length === 0 ? (
          <EmptySection text="No projects detected." />
        ) : (
          <div className="space-y-4">
            {data.projects.map((project, index) => (
              <div
                key={`${project.title}-${index}`}
                className="rounded-md border border-border bg-card p-4"
              >
                <p className="font-semibold text-foreground">{project.title}</p>

                {project.description && (
                  <p className="mt-2 text-sm leading-6 text-foreground">
                    {project.description}
                  </p>
                )}

                {project.technologies.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {project.technologies.map((technology) => (
                      <span
                        key={technology}
                        className="rounded-full bg-accent px-2.5 py-1 text-xs text-primary"
                      >
                        {technology}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Achievements */}
      <SectionCard
        title="Achievements"
        icon={<Medal className="h-4 w-4 text-primary" />}
        count={data.achievements.length}
      >
        {data.achievements.length === 0 ? (
          <EmptySection text="No achievements detected." />
        ) : (
          <ul className="space-y-2">
            {data.achievements.map((achievement, index) => (
              <li key={index} className="text-sm text-foreground">
                • {achievement}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

function InfoItem({
  label,
  value,
  isLink = false,
}: {
  label: string;
  value: string | null;
  isLink?: boolean;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      {value ? (
        isLink ? (
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="mt-1 flex items-center gap-1 text-sm text-primary hover:underline"
          >
            {value}
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <p className="mt-1 text-sm text-foreground">{value}</p>
        )
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">Not detected</p>
      )}
    </div>
  );
}

function SectionCard({
  title,
  icon,
  count,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border bg-card text-foreground ">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            {icon}
            {title}
          </span>

          <span className="rounded-full bg-card px-2.5 py-1 text-xs text-muted-foreground">
            {count}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent>{children}</CardContent>
    </Card>
  );
}

function EmptySection({
  text = "No information detected.",
}: {
  text?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
