"use client";

import React, { useState } from "react";
import {
  Plus,
  Search,
  Users,
  Pencil,
  Trash2,
  CheckCircle2,
  PauseCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  useCreateRecruiterJobs,
  useDeleteRecruiterJob,
  useRecruiterJobs,
  useUpdaterecruiterJobs,
} from "@/hooks/useRecruiterJobs";

type FormState = {
  title: string;
  description: string;
  responsibilities: string;
  benefits: string;
  jobType:
    | "FULL_TIME"
    | "PART_TIME"
    | "CONTRACT"
    | "INTERNSHIP"
    | "FREELANCE"
    | "TEMPORARY";
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
type ManagedJob = {
  id: string;
  title: string;
  description: string;
  responsibilities?: string | null;
  benefits?: string | null;
  jobType: FormState["jobType"];
  workMode: FormState["workMode"];
  experienceLevel?: FormState["experienceLevel"] | null;
  status: FormState["status"];
  locationCity?: string | null;
  locationState?: string | null;
  locationCountry?: string | null;
  requiredExperienceYears?: number | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string | null;
  applicationDeadline?: string | null;
  skills: string[];
  company?: { name: string };
  applicantsCount: number;
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

function RecruiterJobsClient({
  initialCreate = false,
}: {
  initialCreate?: boolean;
}) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(initialCreate);
  const [pendingAction, setPendingAction] = useState<{
    id: string;
    title: string;
    status?: FormState["status"];
  } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const { data, isLoading, isError, refetch } = useRecruiterJobs(search);

  const createMutation = useCreateRecruiterJobs();
  const updateMutation = useUpdaterecruiterJobs();
  const deleteMutation = useDeleteRecruiterJob();

  const jobs: ManagedJob[] = data?.jobs ?? [];

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(job: ManagedJob) {
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

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }

      setOpen(false);
      setEditingId(null);
      setForm(emptyForm);
    } catch {
      /* Keep the editor open; the existing mutation shows the server error. */
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteMutation.mutateAsync(id);
      setPendingAction(null);
    } catch {
      /* Keep confirmation available for retry. */
    }
  }

  async function toggleStatus(
    job: { id: string },
    nextStatus: FormState["status"],
  ) {
    try {
      await updateMutation.mutateAsync({
        id: job.id,
        payload: { status: nextStatus },
      });
      setPendingAction(null);
    } catch {
      /* Existing mutation reports the error. */
    }
  }

  if (isLoading) {
    return <RecruiterJobsSkeleton />;
  }
  if (isError)
    return (
      <div role="alert" className="query-error">
        <p>We couldn’t load your job openings.</p>
        <button className="action action-secondary" onClick={() => refetch()}>
          Retry
        </button>
      </div>
    );
  return (
    <div className="legacy-workspace jobs-management space-y-6">
      <section className="rounded-lg border border-border    p-6 shadow-none ">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-foreground">
              Recruiter Jobs
            </p>
            <h1 className="text-3xl font-bold">Manage your job openings</h1>
            <p className="max-w-2xl text-sm text-foreground">
              Create, edit, publish, and archive jobs for candidates to apply.
            </p>
          </div>

          <Button
            onClick={openCreate}
            className="bg-primary text-primary-foreground hover:bg-primary"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Job
          </Button>
        </div>
      </section>

      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search your jobs..."
            className="border-border bg-card pl-10 text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
          />
        </div>
        <Button
          type="submit"
          className="bg-primary text-primary-foreground hover:bg-primary"
        >
          Search
        </Button>
      </form>

      <div className="grid gap-4 md:grid-cols-3">
        <Metric title="Total Jobs" value={String(jobs.length)} />
        <Metric
          title="Published"
          value={String(jobs.filter((j) => j.status === "PUBLISHED").length)}
        />
        <Metric
          title="Drafts"
          value={String(jobs.filter((j) => j.status === "DRAFT").length)}
        />
      </div>

      {jobs.length === 0 ? (
        <Card className="border-border bg-card text-foreground ">
          <CardContent className="p-10 text-center">
            <p className="text-lg font-semibold">No jobs yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your first job so candidates can start applying.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-0 recruiter-job-ledger">
          {jobs.map((job) => (
            <Card
              key={job.id}
              className="border-border bg-card text-foreground shadow-none  transition duration-300  hover:bg-card"
            >
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{job.title}</CardTitle>
                    <CardDescription className="text-foreground">
                      {job.company?.name}
                    </CardDescription>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-accent text-primary hover:bg-accent">
                      {job.status}
                    </Badge>
                    <Badge className="bg-accent text-primary hover:bg-accent">
                      {job.jobType}
                    </Badge>
                    <Badge className="bg-card text-foreground hover:bg-card">
                      {job.applicantsCount} applicants
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <span>{job.workMode}</span>
                  <span>•</span>
                  <span>
                    {job.locationCity ||
                      job.locationCountry ||
                      "Location not set"}
                  </span>
                  <span>•</span>
                  <span>
                    {job.salaryMin && job.salaryMax
                      ? `${job.currency || "INR"} ${job.salaryMin} - ${job.salaryMax}`
                      : "Salary not disclosed"}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="line-clamp-3 text-sm text-foreground">
                  {job.description}
                </p>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {job.skills?.length ? (
                      job.skills.map((skill: string) => (
                        <Badge
                          key={skill}
                          variant="outline"
                          className="border-border bg-card text-foreground"
                        >
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        No skills added
                      </span>
                    )}
                  </div>
                </div>

                <Separator className="bg-card" />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    {job.status !== "PUBLISHED" ? (
                      <Button
                        size="sm"
                        className="bg-accent text-foreground hover:bg-accent"
                        onClick={() =>
                          setPendingAction({
                            id: job.id,
                            title: job.title,
                            status: "PUBLISHED",
                          })
                        }
                        disabled={updateMutation.isPending}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Publish
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-accent text-foreground hover:bg-accent"
                        onClick={() =>
                          setPendingAction({
                            id: job.id,
                            title: job.title,
                            status: "PAUSED",
                          })
                        }
                        disabled={updateMutation.isPending}
                      >
                        <PauseCircle className="mr-2 h-4 w-4" />
                        Pause
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      className="border-border bg-card hover:bg-card"
                      onClick={() => openEdit(job)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="border-border bg-card hover:bg-card"
                      onClick={() =>
                        setPendingAction({ id: job.id, title: job.title })
                      }
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>

                  <Badge className="bg-card text-foreground hover:bg-card">
                    <Users className="mr-1 h-4 w-4" />
                    {job.applicantsCount}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={Boolean(pendingAction)}
        onOpenChange={(next) =>
          !next &&
          !deleteMutation.isPending &&
          !updateMutation.isPending &&
          setPendingAction(null)
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingAction?.status === "PUBLISHED"
                ? "Publish this opening?"
                : pendingAction?.status === "PAUSED"
                  ? "Pause this opening?"
                  : "Delete this opening?"}
            </DialogTitle>
            <DialogDescription>
              {pendingAction?.title}.{" "}
              {pendingAction?.status === "PUBLISHED"
                ? "The role will become available to candidates."
                : pendingAction?.status === "PAUSED"
                  ? "This role will leave the published job list. Existing applications stay in your workspace."
                  : "This role will be removed from your managed openings using the existing deletion workflow."}
            </DialogDescription>
          </DialogHeader>
          <div className="confirmation-actions">
            <button
              className="action action-secondary"
              disabled={deleteMutation.isPending || updateMutation.isPending}
              onClick={() => setPendingAction(null)}
            >
              Cancel
            </button>
            <button
              className="action"
              disabled={deleteMutation.isPending || updateMutation.isPending}
              onClick={() =>
                pendingAction &&
                (pendingAction.status
                  ? toggleStatus(pendingAction, pendingAction.status)
                  : handleDelete(pendingAction.id))
              }
            >
              {deleteMutation.isPending || updateMutation.isPending
                ? "Saving…"
                : "Confirm change"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-border bg-background text-foreground sm:max-w-3xl h-3/4 overflow-scroll">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Job" : "Create Job"}</DialogTitle>
            <DialogDescription className="text-foreground">
              Fill in the job details and required skills.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Job Title"
                value={form.title}
                onChange={(v) => setForm((p) => ({ ...p, title: v }))}
              />
              <Field
                label="Location City"
                value={form.locationCity}
                onChange={(v) => setForm((p) => ({ ...p, locationCity: v }))}
              />
              <Field
                label="Location State"
                value={form.locationState}
                onChange={(v) => setForm((p) => ({ ...p, locationState: v }))}
              />
              <Field
                label="Location Country"
                value={form.locationCountry}
                onChange={(v) => setForm((p) => ({ ...p, locationCountry: v }))}
              />
              <Field
                label="Salary Min"
                value={form.salaryMin}
                onChange={(v) => setForm((p) => ({ ...p, salaryMin: v }))}
                type="number"
              />
              <Field
                label="Salary Max"
                value={form.salaryMax}
                onChange={(v) => setForm((p) => ({ ...p, salaryMax: v }))}
                type="number"
              />
              <Field
                label="Required Experience Years"
                value={form.requiredExperienceYears}
                onChange={(v) =>
                  setForm((p) => ({ ...p, requiredExperienceYears: v }))
                }
                type="number"
              />
              <Field
                label="Currency"
                value={form.currency}
                onChange={(v) => setForm((p) => ({ ...p, currency: v }))}
              />
              <Field
                label="Application Deadline"
                value={form.applicationDeadline}
                onChange={(v) =>
                  setForm((p) => ({ ...p, applicationDeadline: v }))
                }
                type="date"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SelectField
                label="Job Type"
                value={form.jobType}
                onChange={(v) =>
                  setForm((p) => ({ ...p, jobType: v as FormState["jobType"] }))
                }
                options={[
                  "FULL_TIME",
                  "PART_TIME",
                  "CONTRACT",
                  "INTERNSHIP",
                  "FREELANCE",
                  "TEMPORARY",
                ]}
              />
              <SelectField
                label="Work Mode"
                value={form.workMode}
                onChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    workMode: v as FormState["workMode"],
                  }))
                }
                options={["ONSITE", "REMOTE", "HYBRID"]}
              />
              <SelectField
                label="Experience Level"
                value={form.experienceLevel}
                onChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    experienceLevel: v as FormState["experienceLevel"],
                  }))
                }
                options={["FRESHER", "JUNIOR", "MID_LEVEL", "SENIOR", "LEAD"]}
              />
              <SelectField
                label="Status"
                value={form.status}
                onChange={(v) =>
                  setForm((p) => ({ ...p, status: v as FormState["status"] }))
                }
                options={["DRAFT", "PUBLISHED", "PAUSED", "CLOSED", "ARCHIVED"]}
              />
            </div>

            <div className="space-y-2">
              <Label>Job Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                className="min-h-28 border-border bg-card text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                placeholder="Describe the role, responsibilities, and expectations..."
              />
            </div>

            <div className="space-y-2">
              <Label>Responsibilities</Label>
              <Textarea
                value={form.responsibilities}
                onChange={(e) =>
                  setForm((p) => ({ ...p, responsibilities: e.target.value }))
                }
                className="min-h-24 border-border bg-card text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                placeholder="List responsibilities..."
              />
            </div>

            <div className="space-y-2">
              <Label>Benefits</Label>
              <Textarea
                value={form.benefits}
                onChange={(e) =>
                  setForm((p) => ({ ...p, benefits: e.target.value }))
                }
                className="min-h-24 border-border bg-card text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                placeholder="List benefits..."
              />
            </div>

            <div className="space-y-2">
              <Label>Required Skills (comma separated)</Label>
              <Input
                value={form.skills}
                onChange={(e) =>
                  setForm((p) => ({ ...p, skills: e.target.value }))
                }
                className="border-border bg-card text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                placeholder="React, Next.js, TypeScript"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="border-border bg-card hover:bg-card"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingId ? "Update Job" : "Save Job"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <Card className="border-border bg-card text-foreground ">
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{title}</p>
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
  const id = React.useId();
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-border bg-card text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
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
  const id = React.useId();
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-indigo-400"
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-background">
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
      <Skeleton className="h-28 w-full rounded-lg bg-card" />
      <Skeleton className="h-12 w-full rounded-md bg-card" />
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-72 rounded-lg bg-card" />
        <Skeleton className="h-72 rounded-lg bg-card" />
      </div>
    </div>
  );
}

export default RecruiterJobsClient;
