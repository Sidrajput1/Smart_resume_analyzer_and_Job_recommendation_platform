"use client";

import React, { useState } from "react";
import { Plus, Pencil, Trash2, GraduationCap } from "lucide-react";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCandidateEducations,
  useCreateEducation,
  useDeleteEducation,
  useUpdateEducation,
} from "@/hooks/useCandidateEducation";
import { useUpdateCandidateResume } from "@/hooks/useCandidateResume";

type EducationFormState = {
  institutionName: string;
  degree: string;
  fieldOfStudy: string;
  grade: string;
  description: string;
  startDate: string;
  endDate: string;
  isCurrentlyStudying: boolean;
};

const emptyForm: EducationFormState = {
  institutionName: "",
  degree: "",
  fieldOfStudy: "",
  grade: "",
  description: "",
  startDate: "",
  endDate: "",
  isCurrentlyStudying: false,
};

function EducationCandidate() {
  const { data, isLoading } = useCandidateEducations();
  const createMutation = useCreateEducation();
  const updateMutation = useUpdateEducation();
  const deleteMutation = useDeleteEducation();

  const educations = data?.educations ?? [];

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EducationFormState>(emptyForm);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(education: any) {
    setEditingId(education.id);
    setForm({
      institutionName: education.institutionName ?? "",
      degree: education.degree ?? "",
      fieldOfStudy: education.fieldOfStudy ?? "",
      grade: education.grade ?? "",
      description: education.description ?? "",
      startDate: education.startDate ? education.startDate.slice(0, 10) : "",
      endDate: education.endDate ? education.endDate.slice(0, 10) : "",
      isCurrentlyStudying: education.isCurrentlyStudying ?? false,
    });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const payload = {
      institutionName: form.institutionName,
      degree: form.degree,
      fieldOfStudy: form.fieldOfStudy || null,
      grade: form.grade || null,
      description: form.description || null,
      startDate: form.startDate || null,
      endDate: form.isCurrentlyStudying ? null : form.endDate || null,
      isCurrentlyStudying: form.isCurrentlyStudying,
    };

    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, payload });
    } else {
      await createMutation.mutateAsync(payload);
    }

    setOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleDelete(id: string) {
    await deleteMutation.mutateAsync(id);
  }

  if (isLoading) {
    return <EducationSkeleton />;
  }

  return (
    <Card className="border-white/10 bg-white/5 text-white backdrop-blur">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-indigo-300" />
            Education
          </CardTitle>
          <CardDescription className="text-slate-300">
            Add your academic background and qualifications.
          </CardDescription>
        </div>

        <Button
          onClick={openCreate}
          className="bg-indigo-500 text-white hover:bg-indigo-400"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Education
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {educations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-8 text-center">
            <p className="font-medium">No education added yet</p>
            <p className="mt-1 text-sm text-slate-400">
              Add your college, degree, and study details to start building your
              profile.
            </p>
          </div>
        ) : (
          educations.map((education: any) => (
            <div
              key={education.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 transition duration-300 hover:bg-white/10"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <p className="text-lg font-semibold">{education.degree}</p>
                  <p className="text-sm text-slate-300">
                    {education.institutionName}
                  </p>
                  <p className="text-sm text-slate-400">
                    {education.fieldOfStudy || "Field not specified"} •{" "}
                    {education.grade || "Grade not specified"}
                  </p>
                  <p className="text-sm text-slate-400">
                    {education.isCurrentlyStudying
                      ? "Currently studying"
                      : `${education.startDate ? new Date(education.startDate).toLocaleDateString() : "N/A"} - ${education.endDate ? new Date(education.endDate).toLocaleDateString() : "Present"}`}
                  </p>
                  {education.description ? (
                    <p className="mt-2 text-sm text-slate-300">
                      {education.description}
                    </p>
                  ) : null}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-white/10 bg-white/5 hover:bg-white/10"
                    onClick={() => openEdit(education)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-white/10 bg-white/5 hover:bg-white/10"
                    onClick={() => handleDelete(education.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-white/10 bg-slate-950 text-white sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Education" : "Add Education"}
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              Fill the details of your academic background.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Institution Name"
                value={form.institutionName}
                onChange={(v) => setForm((p) => ({ ...p, institutionName: v }))}
              />
              <Field
                label="Degree"
                value={form.degree}
                onChange={(v) => setForm((p) => ({ ...p, degree: v }))}
              />
              <Field
                label="Field of Study"
                value={form.fieldOfStudy}
                onChange={(v) => setForm((p) => ({ ...p, fieldOfStudy: v }))}
              />
              <Field
                label="Grade / CGPA"
                value={form.grade}
                onChange={(v) => setForm((p) => ({ ...p, grade: v }))}
              />
              <Field
                label="Start Date"
                type="date"
                value={form.startDate}
                onChange={(v) => setForm((p) => ({ ...p, startDate: v }))}
              />
              <Field
                label="End Date"
                type="date"
                value={form.endDate}
                onChange={(v) => setForm((p) => ({ ...p, endDate: v }))}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="current"
                checked={form.isCurrentlyStudying}
                onCheckedChange={(checked) =>
                  setForm((p) => ({
                    ...p,
                    isCurrentlyStudying: Boolean(checked),
                    endDate: Boolean(checked) ? "" : p.endDate,
                  }))
                }
              />
              <Label htmlFor="current">Currently studying here</Label>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Additional details about your education..."
                className="min-h-28 border-white/10 bg-white/10 text-white placeholder:text-slate-400 focus-visible:ring-indigo-400"
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
                {editingId ? "Update Education" : "Save Education"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
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

function EducationSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-20 w-full rounded-3xl bg-white/10" />
      <Skeleton className="h-40 w-full rounded-3xl bg-white/10" />
    </div>
  );
}

export default EducationCandidate;
