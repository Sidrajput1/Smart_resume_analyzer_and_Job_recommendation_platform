"use client";

import * as React from "react";
import Link from "next/link";
import { Search, MapPin, BriefcaseBusiness, Sparkles, BadgeCheck } from "lucide-react";

import { useApplyJob, useCandidateJobs } from "@/hooks/useCandidateJobs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function CandidateJobsClient() {
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");

  const { data, isLoading } = useCandidateJobs(search);
  const applyMutation = useApplyJob();

  const jobs = data?.jobs ?? [];

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSearch(searchInput.trim());
  }

  async function handleApply(jobId: string) {
    await applyMutation.mutateAsync(jobId);
  }

  if (isLoading) {
    return <JobsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-linear-to-r from-cyan-500/20 to-indigo-500/10 p-6 shadow-xl backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-300">
              Candidate Jobs
            </p>
            <h2 className="text-3xl font-bold">Find your next opportunity</h2>
            <p className="max-w-2xl text-sm text-slate-300">
              Browse published jobs, compare required skills, and apply with your resume.
            </p>
          </div>

          <Button asChild className="bg-indigo-500 text-white hover:bg-indigo-400">
            <Link href="/candidate/resume">Update Resume</Link>
          </Button>
        </div>
      </section>

      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search jobs, company name, keywords..."
            className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-slate-400 focus-visible:ring-indigo-400"
          />
        </div>
        <Button type="submit" className="bg-indigo-500 text-white hover:bg-indigo-400">
          Search
        </Button>
      </form>

      <div className="grid gap-4 md:grid-cols-3">
        <Metric title="Available Jobs" value={String(jobs.length)} />
        <Metric title="Applied Jobs" value={String(jobs.filter((j: any) => j.isApplied).length)} />
        <Metric title="Search Filter" value={search ? search : "All jobs"} />
      </div>

      {jobs.length === 0 ? (
        <Card className="border-white/10 bg-white/5 text-white backdrop-blur">
          <CardContent className="p-10 text-center">
            <p className="text-lg font-semibold">No jobs found</p>
            <p className="mt-2 text-sm text-slate-400">
              Try another keyword or wait for recruiters to post jobs.
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
                      {job.jobType}
                    </Badge>
                    <Badge className="bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/20">
                      {job.workMode}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {job.locationCity || job.locationCountry || "Remote"}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <BriefcaseBusiness className="h-4 w-4" />
                    {job.salaryMin && job.salaryMax
                      ? `${job.currency || "INR"} ${job.salaryMin} - ${job.salaryMax}`
                      : "Salary not disclosed"}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Sparkles className="h-4 w-4" />
                    Match {job.matchScore}%
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="line-clamp-3 text-sm text-slate-300">
                  {job.description}
                </p>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-200">Required Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {job.requiredSkills.length > 0 ? (
                      job.requiredSkills.map((skill: string) => (
                        <Badge
                          key={skill}
                          variant="outline"
                          className="border-white/10 bg-white/5 text-slate-200"
                        >
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-slate-400">No skills listed</span>
                    )}
                  </div>
                </div>

                <Separator className="bg-white/10" />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {job.isApplied ? (
                      <Badge className="bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/20">
                        <BadgeCheck className="mr-1 h-4 w-4" />
                        Applied
                      </Badge>
                    ) : (
                      <Badge className="bg-white/10 text-white hover:bg-white/10">
                        Not applied
                      </Badge>
                    )}

                    <span className="text-xs text-slate-400">
                      {job.applicationStatus || "Ready to apply"}
                    </span>
                  </div>

                  <Button
                    onClick={() => handleApply(job.id)}
                    disabled={job.isApplied || applyMutation.isPending}
                    className="bg-indigo-500 text-white hover:bg-indigo-400"
                  >
                    {job.isApplied ? "Applied" : "Apply Now"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
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

function JobsSkeleton() {
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