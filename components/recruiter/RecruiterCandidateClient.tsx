"use client";

import * as React from "react";
import {
  Search,
  UserRound,
  FileText,
  Sparkles,
  MapPin,
  BriefcaseBusiness,
  GraduationCap,
  BadgeCheck,
  XCircle,
  ArrowUpRight,
} from "lucide-react";

import { useRecruiterCandidates, useUpdateApplicationStatus } from "@/hooks/useRecruiterCandidates";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

export default function RecruiterCandidateClient() {
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [selected, setSelected] = React.useState<any | null>(null);

  const { data, isLoading } = useRecruiterCandidates(search, status);
  const updateStatusMutation = useUpdateApplicationStatus();

  const applications = data?.applications ?? [];

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSearch(searchInput.trim());
  }

  if (isLoading) {
    return <CandidatesSkeleton />;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-gradient-to-r from-violet-500/20 to-indigo-500/10 p-6 shadow-xl backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-300">
              Recruiter Candidates
            </p>
            <h2 className="text-3xl font-bold">Review your applicants</h2>
            <p className="max-w-2xl text-sm text-slate-300">
              Search, shortlist, and review candidates for the jobs you posted.
            </p>
          </div>

          <div className="flex gap-2">
            {["", "APPLIED", "SHORTLISTED", "INTERVIEW_SCHEDULED", "REJECTED"].map(
              (item) => (
                <Button
                  key={item || "ALL"}
                  variant={status === item ? "default" : "outline"}
                  onClick={() => setStatus(item)}
                  className={
                    status === item
                      ? "bg-indigo-500 text-white hover:bg-indigo-400"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }
                >
                  {item === "" ? "All" : item.replaceAll("_", " ")}
                </Button>
              )
            )}
          </div>
        </div>
      </section>

      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search candidate name, headline, or job title..."
            className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-slate-400 focus-visible:ring-indigo-400"
          />
        </div>
        <Button type="submit" className="bg-indigo-500 text-white hover:bg-indigo-400">
          Search
        </Button>
      </form>

      <div className="grid gap-4 md:grid-cols-3">
        <Metric title="Applications" value={String(applications.length)} />
        <Metric
          title="Shortlisted"
          value={String(applications.filter((a: any) => a.status === "SHORTLISTED").length)}
        />
        <Metric
          title="Interview Ready"
          value={String(applications.filter((a: any) => a.status === "INTERVIEW_SCHEDULED").length)}
        />
      </div>

      {applications.length === 0 ? (
        <Card className="border-white/10 bg-white/5 text-white backdrop-blur">
          <CardContent className="p-10 text-center">
            <p className="text-lg font-semibold">No candidates found</p>
            <p className="mt-2 text-sm text-slate-400">
              Once candidates apply, their profiles will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {applications.map((app: any) => (
            <Card
              key={app.id}
              className="border-white/10 bg-white/5 text-white shadow-lg backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/10"
            >
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{app.candidate.name}</CardTitle>
                    <CardDescription className="text-slate-300">
                      {app.job.title} • {app.job.companyName}
                    </CardDescription>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-indigo-500/20 text-indigo-200 hover:bg-indigo-500/20">
                      Match {app.matchScore}%
                    </Badge>
                    <Badge className="bg-white/10 text-white hover:bg-white/10">
                      {app.status.replaceAll("_", " ")}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {app.candidate.city || app.candidate.country || "Location not set"}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <BriefcaseBusiness className="h-4 w-4" />
                    {app.job.jobType}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Sparkles className="h-4 w-4" />
                    {app.candidate.headline || "No headline"}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <MiniStat label="Skills" value={String(app.candidate.skills.length)} />
                  <MiniStat label="Education" value={String(app.candidate.educationCount)} />
                  <MiniStat label="Experience" value={String(app.candidate.experienceCount)} />
                  <MiniStat label="Projects" value={String(app.candidate.projectCount)} />
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium text-slate-200">Matched Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {app.matchedSkills?.length ? (
                      app.matchedSkills.map((skill: string) => (
                        <Badge
                          key={skill}
                          className="bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/20"
                        >
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-slate-400">No matched skills yet</span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium text-slate-200">Missing Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {app.missingSkills?.length ? (
                      app.missingSkills.map((skill: string) => (
                        <Badge
                          key={skill}
                          variant="outline"
                          className="border-white/10 bg-white/5 text-slate-200"
                        >
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-slate-400">No missing skills</span>
                    )}
                  </div>
                </div>

                <Separator className="bg-white/10" />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/10 bg-white/5 hover:bg-white/10"
                      onClick={() => setSelected(app)}
                    >
                      <UserRound className="mr-2 h-4 w-4" />
                      View Candidate
                    </Button>

                    <Button
                      size="sm"
                      className="bg-emerald-500 text-white hover:bg-emerald-400"
                      onClick={() =>
                        updateStatusMutation.mutate({
                          id: app.id,
                          status: "SHORTLISTED",
                        })
                      }
                    >
                      <BadgeCheck className="mr-2 h-4 w-4" />
                      Shortlist
                    </Button>

                    <Button
                      size="sm"
                      className="bg-rose-500 text-white hover:bg-rose-400"
                      onClick={() =>
                        updateStatusMutation.mutate({
                          id: app.id,
                          status: "REJECTED",
                        })
                      }
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>

                  <Badge className="bg-indigo-500/20 text-indigo-200 hover:bg-indigo-500/20">
                    {app.resume?.fileName ? "Resume attached" : "No resume"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="border-white/10 bg-slate-950 text-white sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selected?.candidate?.name}</DialogTitle>
            <DialogDescription className="text-slate-300">
              Full candidate profile and application summary.
            </DialogDescription>
          </DialogHeader>

          {selected ? (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Info label="Email" value={selected.candidate.email} />
                <Info label="Phone" value={selected.candidate.phone || "N/A"} />
                <Info label="Location" value={`${selected.candidate.city || ""} ${selected.candidate.state || ""} ${selected.candidate.country || ""}`.trim() || "N/A"} />
                <Info label="Match Score" value={`${selected.matchScore}%`} />
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="mb-2 text-sm font-medium text-slate-200">Headline</p>
                <p className="text-sm text-slate-300">{selected.candidate.headline || "No headline available"}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <ListCard
                  title="Skills"
                  items={selected.candidate.skills || []}
                />
                <ListCard
                  title="Matched Skills"
                  items={selected.matchedSkills || []}
                  highlight
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <ListCard
                  title="Missing Skills"
                  items={selected.missingSkills || []}
                />
                <ListCard
                  title="Education Highlights"
                  items={
                    selected.candidate.educationCount > 0
                      ? [`${selected.candidate.educationCount} education records`]
                      : []
                  }
                />
              </div>

              {selected.candidate.resume?.fileUrl ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="mb-2 text-sm font-medium text-slate-200">Resume</p>
                  <a
                    href={selected.candidate.resume.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-indigo-300 hover:text-indigo-200"
                  >
                    <FileText className="h-4 w-4" />
                    Open resume file
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
              ) : null}

              {selected.candidate.intelligence ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="mb-3 text-sm font-medium text-slate-200">
                    Candidate Intelligence Profile
                  </p>
                  <div className="grid gap-3 md:grid-cols-3">
                    <Info label="Overall Score" value={String(selected.candidate.intelligence.overallScore ?? "--")} />
                    <Info label="ATS Score" value={String(selected.candidate.intelligence.atsScore ?? "--")} />
                    <Info label="Skill Score" value={String(selected.candidate.intelligence.skillScore ?? "--")} />
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelected(null)}
              className="border-white/10 bg-white/5 hover:bg-white/10"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function ListCard({
  title,
  items,
  highlight,
}: {
  title: string;
  items: string[];
  highlight?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="mb-3 text-sm font-medium text-slate-200">{title}</p>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <Badge
              key={item}
              className={
                highlight
                  ? "bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/20"
                  : "bg-white/10 text-white hover:bg-white/10"
              }
            >
              {item}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400">No data available</p>
      )}
    </div>
  );
}

function CandidatesSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-28 w-full rounded-3xl bg-white/10" />
      <Skeleton className="h-12 w-full rounded-2xl bg-white/10" />
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-80 rounded-3xl bg-white/10" />
        <Skeleton className="h-80 rounded-3xl bg-white/10" />
      </div>
    </div>
  );
}