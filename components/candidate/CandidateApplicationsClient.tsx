"use client";
import React from 'react'
import { useCandidateApplications, useWithdrawApplications } from '@/hooks/useCandidateApplications';

import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  MapPin,
  Search,
  Undo2,
  Clock3,
  CircleCheckBig,
  CircleDot,
  CircleX,
  UserRound,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

const STATUS_STEPS = [
    "APPLIED",
    "SHORTLISTED",
    "INTERVIEW_SCHEDULED",
  "OFFERED",
  "HIRED",
];

function getStatusColor(status:string){
    switch(status){
        case "APPLIED":
      return "bg-blue-500/20 text-blue-200";
    case "SHORTLISTED":
      return "bg-amber-500/20 text-amber-200";
    case "INTERVIEW_SCHEDULED":
      return "bg-cyan-500/20 text-cyan-200";
    case "OFFERED":
      return "bg-violet-500/20 text-violet-200";
    case "HIRED":
      return "bg-emerald-500/20 text-emerald-200";
    case "REJECTED":
      return "bg-rose-500/20 text-rose-200";
    case "WITHDRAWN":
      return "bg-slate-500/20 text-slate-200";
    default:
      return "bg-white/10 text-white";
    }
}
function CandidateApplicationsClient() {
    const {data,isLoading} = useCandidateApplications();
    const withdrawApplications = useWithdrawApplications();

    const applications = data?.applications ?? [];

    async function handleWithdraw(id:string){
        await withdrawApplications.mutateAsync(id)
    };
    
    if(isLoading){
        return <Skeleton/>
    }
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-linear-to-r from-indigo-500/20 to-cyan-500/10 p-6 shadow-xl backdrop-blur">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-300">
            Candidate Applications
          </p>
          <h2 className="text-3xl font-bold">Track your job applications</h2>
          <p className="max-w-2xl text-sm text-slate-300">
            Review the jobs you applied for, see the current status, and withdraw an application if needed.
          </p>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Metric title="Total Applications" value={String(applications.length)} />
        <Metric
          title="In Progress"
          value={String(
            applications.filter((a: any) => !["REJECTED", "HIRED", "WITHDRAWN"].includes(a.status)).length
          )}
        />
        <Metric
          title="Completed"
          value={String(
            applications.filter((a: any) => ["REJECTED", "HIRED", "WITHDRAWN"].includes(a.status)).length
          )}
        />
      </div>

      {applications.length === 0 ? (
        <Card className="border-white/10 bg-white/5 text-white backdrop-blur">
          <CardContent className="p-10 text-center">
            <p className="text-lg font-semibold">No applications yet</p>
            <p className="mt-2 text-sm text-slate-400">
              Once you apply for jobs, they will appear here for tracking.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {applications.map((app: any, index: number) => {
            const currentStepIndex = STATUS_STEPS.indexOf(app.status);

            return (
              <Card
                key={app.id}
                className="border-white/10 bg-white/5 text-white shadow-lg backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/10"
              >
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{app.job.title}</CardTitle>
                      <CardDescription className="text-slate-300">
                        {app.job.companyName}
                      </CardDescription>
                    </div>

                    <Badge className={getStatusColor(app.status)}>
                      {app.status.replaceAll("_", " ")}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {app.job.locationCity || app.job.locationCountry || "Location not set"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <BriefcaseBusiness className="h-4 w-4" />
                      {app.job.jobType}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-4 w-4" />
                      Applied {new Date(app.appliedAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="mb-3 text-sm font-medium text-slate-200">Application Timeline</p>
                    <div className="space-y-2">
                      {STATUS_STEPS.map((step, stepIndex) => {
                        const active =
                          currentStepIndex >= 0 && stepIndex <= currentStepIndex;

                        return (
                          <div key={step} className="flex items-center gap-3">
                            {active ? (
                              <CircleCheckBig className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <CircleDot className="h-4 w-4 text-slate-500" />
                            )}
                            <span className={active ? "text-white" : "text-slate-400"}>
                              {step.replaceAll("_", " ")}
                            </span>
                          </div>
                        );
                      })}
                      {["REJECTED", "WITHDRAWN"].includes(app.status) ? (
                        <div className="flex items-center gap-3 pt-1">
                          <CircleX className="h-4 w-4 text-rose-400" />
                          <span className="text-rose-200">{app.status.replaceAll("_", " ")}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <MiniStat
                      label="Resume"
                      value={app.resume?.title || "No resume linked"}
                    />
                    <MiniStat
                      label="Work Mode"
                      value={app.job.workMode}
                    />
                    <MiniStat
                      label="Job Type"
                      value={app.job.jobType}
                    />
                    <MiniStat
                      label="Skills"
                      value={String(app.job.requiredSkills.length)}
                    />
                  </div>

                  <Separator className="bg-white/10" />

                  <div className="flex flex-wrap gap-2">
                    {app.job.requiredSkills?.map((skill: string) => (
                      <Badge
                        key={skill}
                        className="bg-white/10 text-white hover:bg-white/10"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm text-slate-400">
                      {app.respondedAt
                        ? `Last updated: ${new Date(app.respondedAt).toLocaleString()}`
                        : "No recruiter response yet"}
                    </div>

                    <Button
                      onClick={() => handleWithdraw(app.id)}
                      disabled={
                        withdrawApplications.isPending ||
                        ["REJECTED", "HIRED", "WITHDRAWN"].includes(app.status)
                      }
                      variant="outline"
                      className="border-white/10 bg-white/5 hover:bg-white/10"
                    >
                      <Undo2 className="mr-2 h-4 w-4" />
                      {app.status === "WITHDRAWN" ? "Withdrawn" : "Withdraw"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  )
};



export default CandidateApplicationsClient;

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
      <p className="mt-1 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function ApplicationsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-28 w-full rounded-3xl bg-white/10" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-24 rounded-3xl bg-white/10" />
        <Skeleton className="h-24 rounded-3xl bg-white/10" />
        <Skeleton className="h-24 rounded-3xl bg-white/10" />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-80 rounded-3xl bg-white/10" />
        <Skeleton className="h-80 rounded-3xl bg-white/10" />
      </div>
    </div>
  );
}