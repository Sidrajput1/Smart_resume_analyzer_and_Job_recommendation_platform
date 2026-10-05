"use client";

import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  GraduationCap,
  Lightbulb,
  Medal,
  Plus,
  Trash2,
  User,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type {
  ParsedCertification,
  ParsedEducation,
  ParsedExperience,
  ParsedProject,
  ParsedResumeData,
} from "@/types/resume-parser";

interface EditableExtractedResumeProps {
  data: ParsedResumeData;
  onSave: (data: ParsedResumeData) => Promise<void>;
  isSaving?: boolean;
}

export function EditableExtractedResume({
  data,
  onSave,
  isSaving = false,
}: EditableExtractedResumeProps) {
  const [form, setForm] = useState<ParsedResumeData>(data);

  useEffect(() => {
    setForm(data);
  }, [data]);

  function updatePersonal(
    field: keyof ParsedResumeData["personal"],
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      personal: {
        ...current.personal,
        [field]: value || null,
      },
    }));
  }

  function updateEducation(
    index: number,
    field: keyof ParsedEducation,
    value: string,
  ) {
    setForm((current) => {
      const education = [...current.education];

      education[index] = {
        ...education[index],
        [field]: value || null,
      };

      return {
        ...current,
        education,
      };
    });
  }

  function updateExperience(
    index: number,
    field: keyof ParsedExperience,
    value: string | string[],
  ) {
    setForm((current) => {
      const experience = [...current.experience];

      experience[index] = {
        ...experience[index],
        [field]: value,
      };

      return {
        ...current,
        experience,
      };
    });
  }

  function updateProject(
    index: number,
    field: keyof ParsedProject,
    value: string | string[],
  ) {
    setForm((current) => {
      const projects = [...current.projects];

      projects[index] = {
        ...projects[index],
        [field]: value,
      };

      return {
        ...current,
        projects,
      };
    });
  }

  function updateCertification(
    index: number,
    field: keyof ParsedCertification,
    value: string,
  ) {
    setForm((current) => {
      const certifications = [...current.certifications];

      certifications[index] = {
        ...certifications[index],
        [field]: value || null,
      };

      return {
        ...current,
        certifications,
      };
    });
  }

  function updateSkill(index: number, value: string) {
    setForm((current) => {
      const skills = [...current.skills];

      skills[index] = value;

      return {
        ...current,
        skills,
      };
    });
  }

  function removeEducation(index: number) {
    setForm((current) => ({
      ...current,
      education: current.education.filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    }));
  }

  function removeExperience(index: number) {
    setForm((current) => ({
      ...current,
      experience: current.experience.filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    }));
  }

  function removeProject(index: number) {
    setForm((current) => ({
      ...current,
      projects: current.projects.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function removeCertification(index: number) {
    setForm((current) => ({
      ...current,
      certifications: current.certifications.filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    }));
  }

  function removeSkill(index: number) {
    setForm((current) => ({
      ...current,
      skills: current.skills.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function addEducation() {
    setForm((current) => ({
      ...current,
      education: [
        ...current.education,
        {
          institution: "",
          degree: "",
          fieldOfStudy: "",
          startDate: null,
          endDate: null,
          location: null,
        },
      ],
    }));
  }

  function addExperience() {
    setForm((current) => ({
      ...current,
      experience: [
        ...current.experience,
        {
          company: "",
          role: "",
          startDate: null,
          endDate: null,
          location: "",
          responsibilities: [],
        },
      ],
    }));
  }

  function addProject() {
    setForm((current) => ({
      ...current,
      projects: [
        ...current.projects,
        {
          title: "",
          description: null,
          technologies: [],
        },
      ],
    }));
  }

  function addCertification() {
    setForm((current) => ({
      ...current,
      certifications: [
        ...current.certifications,
        {
          title: "",
          issuer: "",
          date: null,
        },
      ],
    }));
  }

  function addSkill() {
    setForm((current) => ({
      ...current,
      skills: [...current.skills, ""],
    }));
  }

  return (
    <div className="space-y-5">
      {/* Information notice */}
      <Card className="border-amber-400/20 bg-amber-400/5 text-white">
        <CardContent className="p-4">
          <p className="text-sm font-medium text-amber-200">
            Review before saving
          </p>

          <p className="mt-1 text-sm leading-6 text-slate-300">
            The information below was extracted from your resume. You can
            correct or remove anything before saving it to your profile.
          </p>

          <p className="mt-2 text-xs text-amber-300/80">
            Saving will replace the existing resume-derived education,
            experience, projects, certifications and skills.
          </p>
        </CardContent>
      </Card>

      {/* Personal */}
      <Card className="border-white/10 bg-white/5 text-white backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-indigo-300" />
            Personal Information
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 md:grid-cols-2">
          <EditableField
            label="Full Name"
            value={form.personal.fullName ?? ""}
            onChange={(value) => updatePersonal("fullName", value)}
          />

          <EditableField
            label="Email"
            value={form.personal.email ?? ""}
            onChange={(value) => updatePersonal("email", value)}
          />

          <EditableField
            label="Phone"
            value={form.personal.phone ?? ""}
            onChange={(value) => updatePersonal("phone", value)}
          />

          <EditableField
            label="Location"
            value={form.personal.location ?? ""}
            onChange={(value) => updatePersonal("location", value)}
          />

          <EditableField
            label="LinkedIn URL"
            value={form.personal.linkedinUrl ?? ""}
            onChange={(value) => updatePersonal("linkedinUrl", value)}
          />

          <EditableField
            label="GitHub URL"
            value={form.personal.githubUrl ?? ""}
            onChange={(value) => updatePersonal("githubUrl", value)}
          />

          <EditableField
            label="Portfolio URL"
            value={form.personal.portfolioUrl ?? ""}
            onChange={(value) => updatePersonal("portfolioUrl", value)}
          />
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="border-white/10 bg-white/5 text-white backdrop-blur">
        <CardHeader>
          <CardTitle className="text-base">Professional Summary</CardTitle>
        </CardHeader>

        <CardContent>
          <Textarea
            value={form.summary ?? ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                summary: event.target.value || null,
              }))
            }
            className="min-h-32 border-white/10 bg-white/10 text-white"
            placeholder="Professional summary..."
          />
        </CardContent>
      </Card>

      {/* Education */}
      <EditableSection
        title="Education"
        icon={<GraduationCap className="h-4 w-4 text-indigo-300" />}
        count={form.education.length}
        onAdd={addEducation}
      >
        {form.education.map((item, index) => (
          <div
            key={index}
            className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium text-white">Education #{index + 1}</p>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeEducation(index)}
                className="text-red-300 hover:bg-red-500/10 hover:text-red-200"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <EditableField
                label="Institution"
                value={item.institution ?? ""}
                onChange={(value) =>
                  updateEducation(index, "institution", value)
                }
              />

              <EditableField
                label="Degree"
                value={item.degree ?? ""}
                onChange={(value) => updateEducation(index, "degree", value)}
              />

              <EditableField
                label="Field of Study"
                value={item.fieldOfStudy ?? ""}
                onChange={(value) =>
                  updateEducation(index, "fieldOfStudy", value)
                }
              />

              <EditableField
                label="Location"
                value={item.location ?? ""}
                onChange={(value) => updateEducation(index, "location", value)}
              />

              <EditableField
                label="Start Year / Date"
                value={item.startDate ?? ""}
                onChange={(value) => updateEducation(index, "startDate", value)}
              />

              <EditableField
                label="End Year / Date"
                value={item.endDate ?? ""}
                onChange={(value) => updateEducation(index, "endDate", value)}
              />
            </div>
          </div>
        ))}

        {form.education.length === 0 && (
          <EmptyEditableSection text="No education information was detected." />
        )}
      </EditableSection>

      {/* Experience */}
      <EditableSection
        title="Experience"
        icon={<BriefcaseBusiness className="h-4 w-4 text-indigo-300" />}
        count={form.experience.length}
        onAdd={addExperience}
      >
        {form.experience.map((item, index) => (
          <div
            key={index}
            className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium text-white">Experience #{index + 1}</p>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeExperience(index)}
                className="text-red-300 hover:bg-red-500/10 hover:text-red-200"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <EditableField
                label="Job Title"
                value={item.role ?? ""}
                onChange={(value) => updateExperience(index, "role", value)}
              />

              <EditableField
                label="Company"
                value={item.company ?? ""}
                onChange={(value) => updateExperience(index, "company", value)}
              />

              <EditableField
                label="Location"
                value={item.location ?? ""}
                onChange={(value) => updateExperience(index, "location", value)}
              />

              <EditableField
                label="Start Year / Date"
                value={item.startDate ?? ""}
                onChange={(value) =>
                  updateExperience(index, "startDate", value)
                }
              />

              <EditableField
                label="End Year / Date"
                value={item.endDate ?? ""}
                onChange={(value) => updateExperience(index, "endDate", value)}
              />

              <div className="md:col-span-2">
                <Label>Responsibilities</Label>

                <Textarea
                  value={item.responsibilities.join("\n")}
                  onChange={(event) =>
                    updateExperience(
                      index,
                      "responsibilities",
                      event.target.value.split("\n"),
                    )
                  }
                  className="mt-2 min-h-32 border-white/10 bg-white/10 text-white"
                  placeholder="One responsibility per line"
                />

                <p className="mt-1 text-xs text-slate-500">
                  Keep one responsibility per line.
                </p>
              </div>
            </div>
          </div>
        ))}

        {form.experience.length === 0 && (
          <EmptyEditableSection text="No experience information was detected." />
        )}
      </EditableSection>

      {/* Projects */}
      <EditableSection
        title="Projects"
        icon={<Lightbulb className="h-4 w-4 text-indigo-300" />}
        count={form.projects.length}
        onAdd={addProject}
      >
        {form.projects.map((item, index) => (
          <div
            key={index}
            className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium text-white">Project #{index + 1}</p>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeProject(index)}
                className="text-red-300 hover:bg-red-500/10 hover:text-red-200"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <EditableField
              label="Project Title"
              value={item.title ?? ""}
              onChange={(value) => updateProject(index, "title", value)}
            />

            <div>
              <Label>Description</Label>

              <Textarea
                value={item.description ?? ""}
                onChange={(event) =>
                  updateProject(index, "description", event.target.value)
                }
                className="mt-2 min-h-24 border-white/10 bg-white/10 text-white"
              />
            </div>

            <EditableField
              label="Technologies"
              value={item.technologies.join(", ")}
              onChange={(value) =>
                updateProject(
                  index,
                  "technologies",
                  value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
                )
              }
              placeholder="React, Node.js, PostgreSQL"
            />
          </div>
        ))}

        {form.projects.length === 0 && (
          <EmptyEditableSection text="No projects information was detected." />
        )}
      </EditableSection>

      {/* Skills */}
      <EditableSection
        title="Skills"
        icon={<Wrench className="h-4 w-4 text-indigo-300" />}
        count={form.skills.length}
        onAdd={addSkill}
      >
        <div className="space-y-3">
          {form.skills.map((skill, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={skill}
                onChange={(event) => updateSkill(index, event.target.value)}
                className="border-white/10 bg-white/10 text-white"
                placeholder="Skill"
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeSkill(index)}
                className="shrink-0 text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {form.skills.length === 0 && (
            <EmptyEditableSection text="No skills information was detected." />
          )}
        </div>
      </EditableSection>

      {/* Certifications */}
      <EditableSection
        title="Certifications"
        icon={<Medal className="h-4 w-4 text-indigo-300" />}
        count={form.certifications.length}
        onAdd={addCertification}
      >
        {form.certifications.map((item, index) => (
          <div
            key={index}
            className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium text-white">
                Certification #{index + 1}
              </p>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeCertification(index)}
                className="text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <EditableField
                label="Certification"
                value={item.title}
                onChange={(value) => updateCertification(index, "title", value)}
              />

              <EditableField
                label="Issuer"
                value={item.issuer ?? ""}
                onChange={(value) =>
                  updateCertification(index, "issuer", value)
                }
              />

              <EditableField
                label="Issue Date / Year"
                value={item.date ?? ""}
                onChange={(value) => updateCertification(index, "date", value)}
              />
            </div>
          </div>
        ))}

        {form.certifications.length === 0 && (
          <EmptyEditableSection text="No certifications were detected." />
        )}
      </EditableSection>

      {/* Save */}
      <div className="sticky bottom-4 z-10 flex justify-end">
        <Button
          type="button"
          onClick={() => onSave(form)}
          disabled={isSaving}
          className="bg-indigo-500 px-6 text-white shadow-xl hover:bg-indigo-400"
        >
          {isSaving ? "Saving Profile..." : "Confirm & Save to Profile"}
        </Button>
      </div>
    </div>
  );
}

function EditableField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>

      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 border-white/10 bg-white/10 text-white placeholder:text-slate-500"
      />
    </div>
  );
}

function EditableSection({
  title,
  icon,
  count,
  onAdd,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-white/10 bg-white/5 text-white backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {icon}

            {title}

            <span className="rounded-full bg-white/5 px-2 py-1 text-xs text-slate-400">
              {count}
            </span>
          </CardTitle>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAdd}
            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
          >
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function EmptyEditableSection({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 p-5 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}
