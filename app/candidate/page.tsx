
import authOptions from '@/lib/auth'
import { getServerSession } from 'next-auth'
import React from 'react'

import { redirect } from "next/navigation";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, FileText, TrendingUp, BriefcaseBusiness, ArrowRight } from "lucide-react";


async function CandidatePage() {
    const session = await getServerSession(authOptions);

    if (!session) redirect("/signin");
  if (session.user.role !== "CANDIDATE") redirect("/unauthorized");
  return (
    
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-3xl border border-white/10 bg-linear-to-r from-indigo-500/20 to-cyan-500/10 p-6 shadow-xl backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <Badge className="bg-white/10 text-white hover:bg-white/10">Candidate Dashboard</Badge>
              <h1 className="text-3xl font-bold">Welcome back, {session.user.name ?? "Candidate"} 👋</h1>
              <p className="text-slate-300">
                Track your resume, AI profile, and personalized job recommendations.
              </p>
            </div>
            <div className="flex gap-3">
              <Button asChild className="bg-indigo-500 text-white hover:bg-indigo-400">
                <Link href="/candidate/resume">Build Resume</Link>
              </Button>
              <Button asChild variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10">
                <Link href="/candidate/jobs">Explore Jobs</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard icon={<FileText className="h-5 w-5 text-indigo-300" />} title="Resume Completion" value="92%" desc="Your profile is nearly ready." />
          <MetricCard icon={<Sparkles className="h-5 w-5 text-indigo-300" />} title="Candidate Intelligence" value="88/100" desc="Strong match potential." />
          <MetricCard icon={<TrendingUp className="h-5 w-5 text-indigo-300" />} title="Recommended Jobs" value="12" desc="New jobs matched today." />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="border-white/10 bg-white/5 text-white backdrop-blur">
            <CardHeader>
              <CardTitle>Candidate Intelligence Profile</CardTitle>
              <CardDescription className="text-slate-300">
                AI-generated analysis of your resume and career profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-300">
              <InfoLine label="Overall Score" value="91" />
              <InfoLine label="ATS Compatibility" value="89" />
              <InfoLine label="Strengths" value="React, Next.js, Node.js" />
              <InfoLine label="Skill Gaps" value="Redis, AWS, GraphQL" />
              <InfoLine label="Suggested Roles" value="Frontend Developer, Full Stack Developer" />
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 text-white backdrop-blur">
            <CardHeader>
              <CardTitle>Recommended Jobs</CardTitle>
              <CardDescription className="text-slate-300">
                Live recommendations based on your skills and experience.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <JobRow title="Frontend Developer" match="96%" />
              <JobRow title="Full Stack Engineer" match="93%" />
              <JobRow title="React Developer" match="91%" />
            </CardContent>
          </Card>
        </section>
      </div>
   
  );
}

function MetricCard({
  icon,
  title,
  value,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  desc: string;
}) {
  return (
    <Card className="border-white/10 bg-white/5 text-white backdrop-blur transition duration-300 hover:-translate-y-1">
      <CardContent className="flex items-start gap-3 p-5">
        <div className="rounded-2xl bg-white/10 p-3">{icon}</div>
        <div>
          <p className="text-sm text-slate-300">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-slate-400">{desc}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}

function JobRow({ title, match }: { title: string; match: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 transition duration-300 hover:bg-white/10">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-slate-400">High compatibility match</p>
      </div>
      <div className="flex items-center gap-3">
        <Badge className="bg-indigo-500/20 text-indigo-200 hover:bg-indigo-500/20">{match}</Badge>
        <Button size="sm" className="bg-indigo-500 text-white hover:bg-indigo-400">
          Apply <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}



export default CandidatePage