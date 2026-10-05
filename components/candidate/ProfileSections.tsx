"use client";

import React, { useState } from "react";
import {
  BriefcaseBusiness,
  Code2,
  FileBadge2,
  Pencil,
  Plus,
  Rocket,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  useCandidateCertifications,
  useCreateCertification,
  useDeleteCertification,
  useUpdateCertification,
} from "@/hooks/useCandidateCertification";
import {
  useCandidateExperiences,
  useCreateExperience,
  useDeleteExperience,
  useUpdateExperience,
} from "@/hooks/useCandidateExperience";
import {
  useCandidateProjects,
  useCreateProject,
  useDeleteProject,
  useUpdateProject,
} from "@/hooks/useCandidateProject";
import {
  useAddCandidateSkill,
  useCandidateSkills,
  useDeleteCandidateSkill,
  useUpdateCandidateSkill,
} from "@/hooks/useCandidateSkill";

type DeleteTarget =
  | { key: "experience"; id: string }
  | { key: "project"; id: string }
  | { key: "certification"; id: string }
  | { key: "skill"; id: string }
  | null;

type ExperienceRecord = {
  id: string;
  companyName?: string | null;
  jobTitle?: string | null;
  employmentType?: string | null;
  location?: string | null;
  description?: string | null;
  responsibilities?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isCurrent?: boolean | null;
};

type ProjectRecord = {
  id: string;
  title?: string | null;
  description?: string | null;
  technologies?: string | null;
  githubUrl?: string | null;
  liveUrl?: string | null;
  startDate?: string | null;
  endDate?: string | null;
};

type CertificationRecord = {
  id: string;
  title?: string | null;
  issuer?: string | null;
  credentialId?: string | null;
  credentialUrl?: string | null;
  issueDate?: string | null;
  expiryDate?: string | null;
};

type SkillRecord = {
  id: string;
  skill?: { name?: string | null } | null;
  proficiencyLevel?: string | null;
  yearsOfExperience?: number | string | null;
  isPrimary?: boolean | null;
  notes?: string | null;
};

const formatDate = (value?: string | null) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatRange = (
  startDate?: string | null,
  endDate?: string | null,
  isCurrent?: boolean,
) => {
  if (!startDate && !endDate && !isCurrent) return "Dates not specified";
  if (isCurrent) return `${formatDate(startDate)} - Present`;
  if (startDate && endDate)
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  if (startDate) return `${formatDate(startDate)} - Present`;
  return `Until ${formatDate(endDate)}`;
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "date" | "number" | "url";
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm text-slate-200">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="border-white/10 bg-white/5 text-white placeholder:text-slate-400 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}

function TextAreaField({
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
    <div className="space-y-2">
      <Label className="text-sm text-slate-200">{label}</Label>
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-28 border-white/10 bg-white/5 text-white placeholder:text-slate-400 focus-visible:ring-indigo-400"
      />
    </div>
  );
}

function ExperienceSection() {
  const { data, isLoading } = useCandidateExperiences();
  const createMutation = useCreateExperience();
  const updateMutation = useUpdateExperience();
  const deleteMutation = useDeleteExperience();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [form, setForm] = useState({
    companyName: "",
    jobTitle: "",
    employmentType: "FULL_TIME",
    location: "",
    description: "",
    responsibilities: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
  });

  const experiences = data?.experiences ?? [];

  function resetForm() {
    setForm({
      companyName: "",
      jobTitle: "",
      employmentType: "FULL_TIME",
      location: "",
      description: "",
      responsibilities: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
    });
  }

  function openCreate() {
    setEditingId(null);
    resetForm();
    setOpen(true);
  }

  function openEdit(item: ExperienceRecord) {
    setEditingId(item.id);
    setForm({
      companyName: item.companyName ?? "",
      jobTitle: item.jobTitle ?? "",
      employmentType: item.employmentType ?? "FULL_TIME",
      location: item.location ?? "",
      description: item.description ?? "",
      responsibilities: item.responsibilities ?? "",
      startDate: item.startDate ? item.startDate.slice(0, 10) : "",
      endDate: item.endDate ? item.endDate.slice(0, 10) : "",
      isCurrent: Boolean(item.isCurrent),
    });
    setOpen(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const payload = {
      companyName: form.companyName,
      jobTitle: form.jobTitle,
      employmentType: form.employmentType,
      location: form.location || null,
      description: form.description || null,
      responsibilities: form.responsibilities || null,
      startDate: form.startDate || null,
      endDate: form.isCurrent ? null : form.endDate || null,
      isCurrent: form.isCurrent,
    };

    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, payload });
    } else {
      await createMutation.mutateAsync(payload);
    }

    setOpen(false);
    setEditingId(null);
    resetForm();
  }

  const submitLabel = editingId ? "Save changes" : "Add experience";

  return (
    <>
      <Card className="border-white/10 bg-white/5 text-white backdrop-blur">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <BriefcaseBusiness className="h-5 w-5 text-indigo-300" />
              Experience
            </CardTitle>
            <CardDescription className="text-slate-300">
              Jobs, internships, and professional contributions.
            </CardDescription>
          </div>
          <Button
            onClick={openCreate}
            className="bg-indigo-500 text-white hover:bg-indigo-400"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Experience
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-24 w-full rounded-2xl" />
            </div>
          ) : experiences.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-8 text-center text-sm text-slate-300">
              No experience added yet.
            </div>
          ) : (
            experiences.map((experience: ExperienceRecord) => (
              <div
                key={experience.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <p className="text-lg font-semibold text-white">
                        {experience.jobTitle}
                      </p>
                      <p className="text-sm text-indigo-200">
                        {experience.companyName}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                      <Badge className="bg-white/10 text-slate-100 hover:bg-white/10">
                        {experience.employmentType?.replace("_", " ") ??
                          "FULL TIME"}
                      </Badge>
                      {experience.location ? (
                        <Badge className="bg-white/10 text-slate-100 hover:bg-white/10">
                          {experience.location}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-sm text-slate-300">
                      {formatRange(
                        experience.startDate,
                        experience.endDate,
                        experience.isCurrent,
                      )}
                    </p>
                    {experience.description ? (
                      <p className="text-sm text-slate-300">
                        {experience.description}
                      </p>
                    ) : null}
                    {experience.responsibilities ? (
                      <p className="text-sm text-slate-400">
                        {experience.responsibilities}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-white/10 bg-white/5 hover:bg-white/10"
                      onClick={() => openEdit(experience)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-white/10 bg-white/5 hover:bg-white/10"
                      onClick={() =>
                        setDeleteTarget({
                          key: "experience",
                          id: experience.id,
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-white/10 bg-slate-950 text-white sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Experience" : "Add Experience"}
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              Add your role, dates, responsibilities, and employment details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Job title"
                value={form.jobTitle}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, jobTitle: value }))
                }
                placeholder="Senior Frontend Engineer"
              />
              <Field
                label="Company"
                value={form.companyName}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, companyName: value }))
                }
                placeholder="Acme Inc."
              />
              <div className="space-y-2">
                <Label className="text-sm text-slate-200">
                  Employment type
                </Label>
                <select
                  value={form.employmentType}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      employmentType: event.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="FULL_TIME">Full time</option>
                  <option value="PART_TIME">Part time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="INTERNSHIP">Internship</option>
                  <option value="FREELANCE">Freelance</option>
                  <option value="TEMPORARY">Temporary</option>
                  <option value="REMOTE">Remote</option>
                </select>
              </div>
              <Field
                label="Location"
                value={form.location}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, location: value }))
                }
                placeholder="Bengaluru, India"
              />
              <Field
                label="Start date"
                type="date"
                value={form.startDate}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, startDate: value }))
                }
              />
              <Field
                label="End date"
                type="date"
                value={form.endDate}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, endDate: value }))
                }
                disabled={form.isCurrent}
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={form.isCurrent}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setForm((prev) => ({
                    ...prev,
                    isCurrent: checked,
                    endDate: checked ? "" : prev.endDate,
                  }));
                }}
              />
              I am currently working here
            </div>
            <TextAreaField
              label="Description"
              value={form.description}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, description: value }))
              }
              placeholder="Describe your role and impact."
            />
            <TextAreaField
              label="Responsibilities"
              value={form.responsibilities}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, responsibilities: value }))
              }
              placeholder="Key responsibilities and achievements"
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-indigo-500 text-white hover:bg-indigo-400"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingId
                  ? updateMutation.isPending
                    ? "Saving..."
                    : submitLabel
                  : createMutation.isPending
                    ? "Saving..."
                    : submitLabel}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteTarget?.key === "experience")}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="border-white/10 bg-slate-950 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this experience?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-white/5 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 text-white hover:bg-red-400"
              onClick={async () => {
                if (deleteTarget?.key === "experience") {
                  await deleteMutation.mutateAsync(deleteTarget.id);
                }
                setDeleteTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ProjectSection() {
  const { data, isLoading } = useCandidateProjects();
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    technologies: "",
    githubUrl: "",
    liveUrl: "",
    startDate: "",
    endDate: "",
  });
  const projects = data?.projects ?? [];

  function resetForm() {
    setForm({
      title: "",
      description: "",
      technologies: "",
      githubUrl: "",
      liveUrl: "",
      startDate: "",
      endDate: "",
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const payload = {
      title: form.title,
      description: form.description || null,
      technologies: form.technologies || null,
      githubUrl: form.githubUrl || null,
      liveUrl: form.liveUrl || null,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
    };

    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, payload });
    } else {
      await createMutation.mutateAsync(payload);
    }

    setOpen(false);
    setEditingId(null);
    resetForm();
  }

  function openCreate() {
    setEditingId(null);
    resetForm();
    setOpen(true);
  }

  function openEdit(item: ProjectRecord) {
    setEditingId(item.id);
    setForm({
      title: item.title ?? "",
      description: item.description ?? "",
      technologies: item.technologies ?? "",
      githubUrl: item.githubUrl ?? "",
      liveUrl: item.liveUrl ?? "",
      startDate: item.startDate ? item.startDate.slice(0, 10) : "",
      endDate: item.endDate ? item.endDate.slice(0, 10) : "",
    });
    setOpen(true);
  }

  return (
    <>
      <Card className="border-white/10 bg-white/5 text-white backdrop-blur">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Rocket className="h-5 w-5 text-indigo-300" />
              Projects
            </CardTitle>
            <CardDescription className="text-slate-300">
              Side projects, case studies, and prototypes.
            </CardDescription>
          </div>
          <Button
            onClick={openCreate}
            className="bg-indigo-500 text-white hover:bg-indigo-400"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Project
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-24 w-full rounded-2xl" />
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-8 text-center text-sm text-slate-300">
              No projects added yet.
            </div>
          ) : (
            projects.map((project: ProjectRecord) => (
              <div
                key={project.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-white">
                      {project.title}
                    </p>
                    <p className="text-sm text-slate-300">
                      {project.description || "Project summary not added."}
                    </p>
                    {project.technologies ? (
                      <p className="text-sm text-indigo-200">
                        {project.technologies}
                      </p>
                    ) : null}
                    <p className="text-sm text-slate-300">
                      {formatRange(project.startDate, project.endDate, false)}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {project.githubUrl ? (
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-300 underline"
                        >
                          GitHub
                        </a>
                      ) : null}
                      {project.liveUrl ? (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-300 underline"
                        >
                          Live demo
                        </a>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-white/10 bg-white/5 hover:bg-white/10"
                      onClick={() => openEdit(project)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-white/10 bg-white/5 hover:bg-white/10"
                      onClick={() =>
                        setDeleteTarget({ key: "project", id: project.id })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-white/10 bg-slate-950 text-white sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Project" : "Add Project"}
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              Document your work, stack, and project link(s).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Project title"
                value={form.title}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, title: value }))
                }
                placeholder="Smart Resume Analyzer"
              />
              <Field
                label="Start date"
                type="date"
                value={form.startDate}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, startDate: value }))
                }
              />
              <Field
                label="End date"
                type="date"
                value={form.endDate}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, endDate: value }))
                }
              />
              <Field
                label="GitHub URL"
                type="url"
                value={form.githubUrl}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, githubUrl: value }))
                }
                placeholder="https://github.com/..."
              />
              <Field
                label="Live URL"
                type="url"
                value={form.liveUrl}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, liveUrl: value }))
                }
                placeholder="https://example.com"
              />
            </div>
            <TextAreaField
              label="Technologies"
              value={form.technologies}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, technologies: value }))
              }
              placeholder="Next.js, TypeScript, Prisma, PostgreSQL"
            />
            <TextAreaField
              label="Description"
              value={form.description}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, description: value }))
              }
              placeholder="What problem did this project solve?"
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-indigo-500 text-white hover:bg-indigo-400"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingId
                  ? updateMutation.isPending
                    ? "Saving..."
                    : "Save project"
                  : createMutation.isPending
                    ? "Saving..."
                    : "Add project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteTarget?.key === "project")}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="border-white/10 bg-slate-950 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              This project will be removed from your profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-white/5 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 text-white hover:bg-red-400"
              onClick={async () => {
                if (deleteTarget?.key === "project") {
                  await deleteMutation.mutateAsync(deleteTarget.id);
                }
                setDeleteTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function CertificationSection() {
  const { data, isLoading } = useCandidateCertifications();
  const createMutation = useCreateCertification();
  const updateMutation = useUpdateCertification();
  const deleteMutation = useDeleteCertification();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [form, setForm] = useState({
    title: "",
    issuer: "",
    credentialId: "",
    credentialUrl: "",
    issueDate: "",
    expiryDate: "",
  });
  const certifications = data?.certifications ?? [];

  function resetForm() {
    setForm({
      title: "",
      issuer: "",
      credentialId: "",
      credentialUrl: "",
      issueDate: "",
      expiryDate: "",
    });
  }

  function openCreate() {
    setEditingId(null);
    resetForm();
    setOpen(true);
  }

  function openEdit(item: CertificationRecord) {
    setEditingId(item.id);
    setForm({
      title: item.title ?? "",
      issuer: item.issuer ?? "",
      credentialId: item.credentialId ?? "",
      credentialUrl: item.credentialUrl ?? "",
      issueDate: item.issueDate ? item.issueDate.slice(0, 10) : "",
      expiryDate: item.expiryDate ? item.expiryDate.slice(0, 10) : "",
    });
    setOpen(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const payload = {
      title: form.title,
      issuer: form.issuer,
      credentialId: form.credentialId || null,
      credentialUrl: form.credentialUrl || null,
      issueDate: form.issueDate || null,
      expiryDate: form.expiryDate || null,
    };

    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, payload });
    } else {
      await createMutation.mutateAsync(payload);
    }

    setOpen(false);
    setEditingId(null);
    resetForm();
  }

  return (
    <>
      <Card className="border-white/10 bg-white/5 text-white backdrop-blur">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <FileBadge2 className="h-5 w-5 text-indigo-300" />
              Certifications
            </CardTitle>
            <CardDescription className="text-slate-300">
              Professional credentials and certifications.
            </CardDescription>
          </div>
          <Button
            onClick={openCreate}
            className="bg-indigo-500 text-white hover:bg-indigo-400"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Certification
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
            </div>
          ) : certifications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-8 text-center text-sm text-slate-300">
              No certifications added yet.
            </div>
          ) : (
            certifications.map((certification: CertificationRecord) => (
              <div
                key={certification.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <p className="text-lg font-semibold text-white">
                        {certification.title}
                      </p>
                      <p className="text-sm text-indigo-200">
                        {certification.issuer}
                      </p>
                    </div>
                    <p className="text-sm text-slate-300">
                      {formatDate(certification.issueDate)}
                      {certification.expiryDate
                        ? ` - ${formatDate(certification.expiryDate)}`
                        : ""}
                    </p>
                    {certification.credentialId ? (
                      <p className="text-sm text-slate-400">
                        Credential ID: {certification.credentialId}
                      </p>
                    ) : null}
                    {certification.credentialUrl ? (
                      <a
                        href={certification.credentialUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-cyan-300 underline"
                      >
                        View credential
                      </a>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-white/10 bg-white/5 hover:bg-white/10"
                      onClick={() => openEdit(certification)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-white/10 bg-white/5 hover:bg-white/10"
                      onClick={() =>
                        setDeleteTarget({
                          key: "certification",
                          id: certification.id,
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-white/10 bg-slate-950 text-white sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Certification" : "Add Certification"}
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              Add professional credentials and supporting details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Certification title"
                value={form.title}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, title: value }))
                }
                placeholder="AWS Certified Developer"
              />
              <Field
                label="Issuer"
                value={form.issuer}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, issuer: value }))
                }
                placeholder="Amazon Web Services"
              />
              <Field
                label="Credential ID"
                value={form.credentialId}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, credentialId: value }))
                }
                placeholder="AWS-1234"
              />
              <Field
                label="Credential URL"
                type="url"
                value={form.credentialUrl}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, credentialUrl: value }))
                }
                placeholder="https://..."
              />
              <Field
                label="Issue date"
                type="date"
                value={form.issueDate}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, issueDate: value }))
                }
              />
              <Field
                label="Expiry date"
                type="date"
                value={form.expiryDate}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, expiryDate: value }))
                }
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-indigo-500 text-white hover:bg-indigo-400"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingId
                  ? updateMutation.isPending
                    ? "Saving..."
                    : "Save certification"
                  : createMutation.isPending
                    ? "Saving..."
                    : "Add certification"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteTarget?.key === "certification")}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="border-white/10 bg-slate-950 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this certification?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              This certification will be removed from your profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-white/5 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 text-white hover:bg-red-400"
              onClick={async () => {
                if (deleteTarget?.key === "certification") {
                  await deleteMutation.mutateAsync(deleteTarget.id);
                }
                setDeleteTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function SkillsSection() {
  const { data, isLoading } = useCandidateSkills();
  const createMutation = useAddCandidateSkill();
  const updateMutation = useUpdateCandidateSkill();
  const deleteMutation = useDeleteCandidateSkill();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [form, setForm] = useState({
    name: "",
    proficiencyLevel: "INTERMEDIATE",
    yearsOfExperience: "",
    isPrimary: false,
    notes: "",
  });
  const skills = data?.candidateSkills ?? [];

  function resetForm() {
    setForm({
      name: "",
      proficiencyLevel: "INTERMEDIATE",
      yearsOfExperience: "",
      isPrimary: false,
      notes: "",
    });
  }

  function openCreate() {
    setEditingId(null);
    resetForm();
    setOpen(true);
  }

  function openEdit(item: SkillRecord) {
    setEditingId(item.id);
    setForm({
      name: item.skill?.name ?? "",
      proficiencyLevel: item.proficiencyLevel ?? "INTERMEDIATE",
      yearsOfExperience: item.yearsOfExperience
        ? String(item.yearsOfExperience)
        : "",
      isPrimary: Boolean(item.isPrimary),
      notes: item.notes ?? "",
    });
    setOpen(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const payload = {
      name: form.name,
      proficiencyLevel: form.proficiencyLevel,
      yearsOfExperience: form.yearsOfExperience
        ? Number(form.yearsOfExperience)
        : null,
      isPrimary: form.isPrimary,
      notes: form.notes || null,
    };

    if (editingId) {
      const updatePayload = {
        proficiencyLevel: payload.proficiencyLevel,
        yearsOfExperience: payload.yearsOfExperience,
        isPrimary: payload.isPrimary,
        notes: payload.notes,
      };
      await updateMutation.mutateAsync({
        id: editingId,
        payload: updatePayload,
      });
    } else {
      await createMutation.mutateAsync(payload);
    }

    setOpen(false);
    setEditingId(null);
    resetForm();
  }

  return (
    <>
      <Card className="border-white/10 bg-white/5 text-white backdrop-blur">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Code2 className="h-5 w-5 text-indigo-300" />
              Skills
            </CardTitle>
            <CardDescription className="text-slate-300">
              Keep your technical strengths current and searchable.
            </CardDescription>
          </div>
          <Button
            onClick={openCreate}
            className="bg-indigo-500 text-white hover:bg-indigo-400"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Skill
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
            </div>
          ) : skills.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-8 text-center text-sm text-slate-300">
              No skills added yet.
            </div>
          ) : (
            skills.map((skill: SkillRecord) => (
              <div
                key={skill.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-semibold text-white">
                        {skill.skill?.name || "Skill"}
                      </p>
                      {skill.isPrimary ? (
                        <Badge className="bg-indigo-500/20 text-indigo-100 hover:bg-indigo-500/20">
                          Primary
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-sm text-slate-300">
                      {skill.proficiencyLevel} • {skill.yearsOfExperience ?? 0}{" "}
                      years
                    </p>
                    {skill.notes ? (
                      <p className="text-sm text-slate-400">{skill.notes}</p>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-white/10 bg-white/5 hover:bg-white/10"
                      onClick={() => openEdit(skill)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-white/10 bg-white/5 hover:bg-white/10"
                      onClick={() =>
                        setDeleteTarget({ key: "skill", id: skill.id })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-white/10 bg-slate-950 text-white sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Skill" : "Add Skill"}</DialogTitle>
            <DialogDescription className="text-slate-300">
              Track skills, proficiency, and relevant experience.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Skill name"
                value={form.name}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, name: value }))
                }
                placeholder="Next.js"
              />
              <div className="space-y-2">
                <Label className="text-sm text-slate-200">Proficiency</Label>
                <select
                  value={form.proficiencyLevel}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      proficiencyLevel: event.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                  <option value="EXPERT">Expert</option>
                </select>
              </div>
              <Field
                label="Years of experience"
                type="number"
                value={form.yearsOfExperience}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, yearsOfExperience: value }))
                }
                placeholder="3"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={form.isPrimary}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    isPrimary: event.target.checked,
                  }))
                }
              />
              Mark as primary skill
            </div>
            <TextAreaField
              label="Notes"
              value={form.notes}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, notes: value }))
              }
              placeholder="Project examples or notes"
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-indigo-500 text-white hover:bg-indigo-400"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingId
                  ? updateMutation.isPending
                    ? "Saving..."
                    : "Save skill"
                  : createMutation.isPending
                    ? "Saving..."
                    : "Add skill"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteTarget?.key === "skill")}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="border-white/10 bg-slate-950 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this skill?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              This will remove the skill from your profile without deleting the
              shared skill master entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-white/5 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 text-white hover:bg-red-400"
              onClick={async () => {
                if (deleteTarget?.key === "skill") {
                  await deleteMutation.mutateAsync(deleteTarget.id);
                }
                setDeleteTarget(null);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function ProfileSections() {
  return (
    <div className="space-y-6">
      <ExperienceSection />
      <ProjectSection />
      <CertificationSection />
      <SkillsSection />
    </div>
  );
}
