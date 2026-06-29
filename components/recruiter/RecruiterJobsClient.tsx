"use client";

import React, { useState } from "react";
import {
  Plus,
  Search,
  BriefcaseBusiness,
  Users,
  Pencil,
  Trash2,
  CheckCircle2,
  PauseCircle,
  Archive,
  BadgeCheck,
} from "lucide-react";


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateRecruiterJobs, useDeleteRecruiterJob, useRecruiterJobs, useUpdaterecruiterJobs } from "@/hooks/useRecruiterJobs";

type FormState = {
  title: string;
  description: string;
  responsibilities: string;
  benefits: string;
  jobType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "FREELANCE" | "TEMPORARY";
  workMode: "ONSITE" | "REMOTE" | "HYBRID";
  experienceLevel: "FRESHER" | "JUNIOR" | "MID_LEVEL" | "SENIOR" | "LEAD";
  locationCity: string;
  locationState: string;
  locationCountry: string;
  requiredExperienceYears: string;
  salaryMin: string;
  salaryMax: string;
  currency: string;
  applicationDeadline: string;
  status: "DRAFT" | "PUBLISHED" | "PAUSED" | "CLOSED" | "ARCHIVED";
  skills: string;
};

const emptyForm: FormState = {
  title: "",
  description: "",
  responsibilities: "",
  benefits: "",
  jobType: "FULL_TIME",
  workMode: "REMOTE",
  experienceLevel: "JUNIOR",
  locationCity: "",
  locationState: "",
  locationCountry: "",
  requiredExperienceYears: "",
  salaryMin: "",
  salaryMax: "",
  currency: "INR",
  applicationDeadline: "",
  status: "DRAFT",
  skills: "",
};


function RecruiterJobsClient() {

    const [searchInput,setSearchInput] = useState("");
    const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

    const {data,isLoading} = useRecruiterJobs(search);

    const createMutation =  useCreateRecruiterJobs();
    const updateMutation = useUpdaterecruiterJobs();
    const deleteMutation = useDeleteRecruiterJob();

    const jobs = data?.jobs ?? [];

    function openCreate(){
         setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
    };

    function openEdit(job: any) {
    setEditingId(job.id);
    setForm({
      title: job.title ?? "",
      description: job.description ?? "",
      responsibilities: job.responsibilities ?? "",
      benefits: job.benefits ?? "",
      jobType: job.jobType ?? "FULL_TIME",
      workMode: job.workMode ?? "REMOTE",
      experienceLevel: job.experienceLevel ?? "JUNIOR",
      locationCity: job.locationCity ?? "",
      locationState: job.locationState ?? "",
      locationCountry: job.locationCountry ?? "",
      requiredExperienceYears: job.requiredExperienceYears?.toString() ?? "",
      salaryMin: job.salaryMin?.toString() ?? "",
      salaryMax: job.salaryMax?.toString() ?? "",
      currency: job.currency ?? "INR",
      applicationDeadline: job.applicationDeadline
        ? new Date(job.applicationDeadline).toISOString().slice(0, 10)
        : "",
      status: job.status ?? "DRAFT",
      skills: Array.isArray(job.skills) ? job.skills.join(", ") : "",
    });
    setOpen(true);
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSearch(searchInput.trim());
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const payload = {
      title: form.title,
      description: form.description,
      responsibilities: form.responsibilities || null,
      benefits: form.benefits || null,
      jobType: form.jobType,
      workMode: form.workMode,
      experienceLevel: form.experienceLevel,
      locationCity: form.locationCity || null,
      locationState: form.locationState || null,
      locationCountry: form.locationCountry || null,
      requiredExperienceYears: form.requiredExperienceYears
        ? Number(form.requiredExperienceYears)
        : null,
      salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
      salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
      currency: form.currency || "INR",
      applicationDeadline: form.applicationDeadline || null,
      status: form.status,
      skills: form.skills
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    };

    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, payload });
    } else {
      await createMutation.mutateAsync(payload as any);
    }

    setOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleDelete(id: string) {
    await deleteMutation.mutateAsync(id);
  }

  async function toggleStatus(job: any, nextStatus: FormState["status"]) {
    await updateMutation.mutateAsync({
      id: job.id,
      payload: { status: nextStatus },
    });
  }

  if (isLoading) {
    return <RecruiterJobsSkeleton />;
  }
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-linear-to-r from-cyan-500/20 to-indigo-500/10 p-6 shadow-xl backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-300">
              Recruiter Jobs
            </p>
            <h2 className="text-3xl font-bold">Manage your job openings</h2>
            <p className="max-w-2xl text-sm text-slate-300">
              Create, edit, publish, and archive jobs for candidates to apply.
            </p>
          </div>

          <Button onClick={openCreate} className="bg-indigo-500 text-white hover:bg-indigo-400">
            <Plus className="mr-2 h-4 w-4" />
            Create Job
          </Button>
        </div>
      </section>

      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search your jobs..."
            className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-slate-400 focus-visible:ring-indigo-400"
          />
        </div>
        <Button type="submit" className="bg-indigo-500 text-white hover:bg-indigo-400">
          Search
        </Button>
      </form>

      <div className="grid gap-4 md:grid-cols-3">
        <Metric title="Total Jobs" value={String(jobs.length)} />
        <Metric title="Published" value={String(jobs.filter((j: any) => j.status === "PUBLISHED").length)} />
        <Metric title="Drafts" value={String(jobs.filter((j: any) => j.status === "DRAFT").length)} />
      </div>

      {jobs.length === 0 ? (
        <Card className="border-white/10 bg-white/5 text-white backdrop-blur">
          <CardContent className="p-10 text-center">
            <p className="text-lg font-semibold">No jobs yet</p>
            <p className="mt-2 text-sm text-slate-400">
              Create your first job so candidates can start applying.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {jobs.map((job: any) => (
            <Card
              key={job.id}
              className="border-white/10 bg-white/5 text-white shadow-lg backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/10"
            >
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{job.title}</CardTitle>
                    <CardDescription className="text-slate-300">
                      {job.company?.name}
                    </CardDescription>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-indigo-500/20 text-indigo-200 hover:bg-indigo-500/20">
                      {job.status}
                    </Badge>
                    <Badge className="bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/20">
                      {job.jobType}
                    </Badge>
                    <Badge className="bg-white/10 text-white hover:bg-white/10">
                      {job.applicantsCount} applicants
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-sm text-slate-400">
                  <span>{job.workMode}</span>
                  <span>•</span>
                  <span>{job.locationCity || job.locationCountry || "Location not set"}</span>
                  <span>•</span>
                  <span>
                    {job.salaryMin && job.salaryMax
                      ? `${job.currency || "INR"} ${job.salaryMin} - ${job.salaryMax}`
                      : "Salary not disclosed"}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="line-clamp-3 text-sm text-slate-300">
                  {job.description}
                </p>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-200">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {job.skills?.length ? (
                      job.skills.map((skill: string) => (
                        <Badge
                          key={skill}
                          variant="outline"
                          className="border-white/10 bg-white/5 text-slate-200"
                        >
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-slate-400">No skills added</span>
                    )}
                  </div>
                </div>

                <Separator className="bg-white/10" />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    {job.status !== "PUBLISHED" ? (
                      <Button
                        size="sm"
                        className="bg-emerald-500 text-white hover:bg-emerald-400"
                        onClick={() => toggleStatus(job, "PUBLISHED")}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Publish
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-amber-500 text-white hover:bg-amber-400"
                        onClick={() => toggleStatus(job, "PAUSED")}
                      >
                        <PauseCircle className="mr-2 h-4 w-4" />
                        Pause
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/10 bg-white/5 hover:bg-white/10"
                      onClick={() => openEdit(job)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/10 bg-white/5 hover:bg-white/10"
                      onClick={() => handleDelete(job.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>

                  <Badge className="bg-white/10 text-white hover:bg-white/10">
                    <Users className="mr-1 h-4 w-4" />
                    {job.applicantsCount}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-white/10 bg-slate-950 text-white sm:max-w-3xl h-3/4 overflow-scroll">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Job" : "Create Job"}</DialogTitle>
            <DialogDescription className="text-slate-300">
              Fill in the job details and required skills.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Job Title" value={form.title} onChange={(v) => setForm((p) => ({ ...p, title: v }))} />
              <Field label="Location City" value={form.locationCity} onChange={(v) => setForm((p) => ({ ...p, locationCity: v }))} />
              <Field label="Location State" value={form.locationState} onChange={(v) => setForm((p) => ({ ...p, locationState: v }))} />
              <Field label="Location Country" value={form.locationCountry} onChange={(v) => setForm((p) => ({ ...p, locationCountry: v }))} />
              <Field label="Salary Min" value={form.salaryMin} onChange={(v) => setForm((p) => ({ ...p, salaryMin: v }))} type="number" />
              <Field label="Salary Max" value={form.salaryMax} onChange={(v) => setForm((p) => ({ ...p, salaryMax: v }))} type="number" />
              <Field label="Required Experience Years" value={form.requiredExperienceYears} onChange={(v) => setForm((p) => ({ ...p, requiredExperienceYears: v }))} type="number" />
              <Field label="Currency" value={form.currency} onChange={(v) => setForm((p) => ({ ...p, currency: v }))} />
              <Field label="Application Deadline" value={form.applicationDeadline} onChange={(v) => setForm((p) => ({ ...p, applicationDeadline: v }))} type="date" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SelectField
                label="Job Type"
                value={form.jobType}
                onChange={(v) => setForm((p) => ({ ...p, jobType: v as any }))}
                options={["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "FREELANCE", "TEMPORARY"]}
              />
              <SelectField
                label="Work Mode"
                value={form.workMode}
                onChange={(v) => setForm((p) => ({ ...p, workMode: v as any }))}
                options={["ONSITE", "REMOTE", "HYBRID"]}
              />
              <SelectField
                label="Experience Level"
                value={form.experienceLevel}
                onChange={(v) => setForm((p) => ({ ...p, experienceLevel: v as any }))}
                options={["FRESHER", "JUNIOR", "MID_LEVEL", "SENIOR", "LEAD"]}
              />
              <SelectField
                label="Status"
                value={form.status}
                onChange={(v) => setForm((p) => ({ ...p, status: v as any }))}
                options={["DRAFT", "PUBLISHED", "PAUSED", "CLOSED", "ARCHIVED"]}
              />
            </div>

            <div className="space-y-2">
              <Label>Job Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="min-h-28 border-white/10 bg-white/10 text-white placeholder:text-slate-400 focus-visible:ring-indigo-400"
                placeholder="Describe the role, responsibilities, and expectations..."
              />
            </div>

            <div className="space-y-2">
              <Label>Responsibilities</Label>
              <Textarea
                value={form.responsibilities}
                onChange={(e) => setForm((p) => ({ ...p, responsibilities: e.target.value }))}
                className="min-h-24 border-white/10 bg-white/10 text-white placeholder:text-slate-400 focus-visible:ring-indigo-400"
                placeholder="List responsibilities..."
              />
            </div>

            <div className="space-y-2">
              <Label>Benefits</Label>
              <Textarea
                value={form.benefits}
                onChange={(e) => setForm((p) => ({ ...p, benefits: e.target.value }))}
                className="min-h-24 border-white/10 bg-white/10 text-white placeholder:text-slate-400 focus-visible:ring-indigo-400"
                placeholder="List benefits..."
              />
            </div>

            <div className="space-y-2">
              <Label>Required Skills (comma separated)</Label>
              <Input
                value={form.skills}
                onChange={(e) => setForm((p) => ({ ...p, skills: e.target.value }))}
                className="border-white/10 bg-white/10 text-white placeholder:text-slate-400 focus-visible:ring-indigo-400"
                placeholder="React, Next.js, TypeScript"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="border-white/10 bg-white/5 hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-indigo-500 text-white hover:bg-indigo-400"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingId ? "Update Job" : "Save Job"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
};

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <Card className="border-white/10 bg-white/5 text-white backdrop-blur">
      <CardContent className="p-5">
        <p className="text-sm text-slate-400">{title}</p>
        <p className="mt-1 text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-white/10 bg-white/10 text-white placeholder:text-slate-400 focus-visible:ring-indigo-400"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-md border border-white/10 bg-white/10 px-3 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-400"
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-slate-950">
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function RecruiterJobsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-28 w-full rounded-3xl bg-white/10" />
      <Skeleton className="h-12 w-full rounded-2xl bg-white/10" />
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-72 rounded-3xl bg-white/10" />
        <Skeleton className="h-72 rounded-3xl bg-white/10" />
      </div>
    </div>
  );
}

export default RecruiterJobsClient