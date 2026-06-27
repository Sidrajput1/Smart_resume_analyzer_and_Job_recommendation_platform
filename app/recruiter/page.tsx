import authOptions from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BriefcaseBusiness,
  Users,
  Sparkles,
  ListChecks,
  ArrowRight,
} from "lucide-react";

async function RecruiterPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/signin");
  if (session.user.role !== "RECRUITER") redirect("/unauthorized");
  
  return (
    
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-3xl border border-white/10 bg-linear-to-r from-cyan-500/20 to-indigo-500/10 p-6 shadow-xl backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <Badge className="bg-white/10 text-white hover:bg-white/10">
                Recruiter Dashboard
              </Badge>
              <h1 className="text-3xl font-bold">
                Welcome, {session.user.name ?? "Recruiter"} 👋
              </h1>
              <p className="text-slate-300">
                Post jobs, review ranked candidates, and manage applications.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                asChild
                className="bg-cyan-500 text-white hover:bg-cyan-400"
              >
                <Link href="/recruiter/jobs/new">Post Job</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white/15 bg-white/5 text-white hover:bg-white/10"
              >
                <Link href="/recruiter/jobs">Manage Jobs</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <MetricCard
            icon={<BriefcaseBusiness className="h-5 w-5 text-cyan-300" />}
            title="Posted Jobs"
            value="8"
            desc="Active openings"
          />
          <MetricCard
            icon={<Users className="h-5 w-5 text-cyan-300" />}
            title="Applicants"
            value="124"
            desc="Across all jobs"
          />
          <MetricCard
            icon={<Sparkles className="h-5 w-5 text-cyan-300" />}
            title="AI Matches"
            value="32"
            desc="High-scoring candidates"
          />
          <MetricCard
            icon={<ListChecks className="h-5 w-5 text-cyan-300" />}
            title="Shortlisted"
            value="18"
            desc="Ready for interview"
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="border-white/10 bg-white/5 text-white backdrop-blur">
            <CardHeader>
              <CardTitle>Top Candidates</CardTitle>
              <CardDescription className="text-slate-300">
                Ranked by AI match score for your current openings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <CandidateRow
                name="Sidharth"
                score="96%"
                role="Frontend Developer"
              />
              <CandidateRow
                name="Rahul"
                score="92%"
                role="Full Stack Developer"
              />
              <CandidateRow name="Aman" score="89%" role="React Developer" />
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 text-white backdrop-blur">
            <CardHeader>
              <CardTitle>Active Jobs</CardTitle>
              <CardDescription className="text-slate-300">
                Manage your live openings and applications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <JobRow title="Frontend Developer" applicants="42" />
              <JobRow title="Next.js Engineer" applicants="28" />
              <JobRow title="UI Developer" applicants="19" />
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

function CandidateRow({
  name,
  score,
  role,
}: {
  name: string;
  score: string;
  role: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 transition duration-300 hover:bg-white/10">
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-sm text-slate-400">{role}</p>
      </div>
      <Badge className="bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/20">
        {score}
      </Badge>
    </div>
  );
}

function JobRow({ title, applicants }: { title: string; applicants: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 transition duration-300 hover:bg-white/10">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-slate-400">{applicants} applicants</p>
      </div>
      <Button size="sm" className="bg-cyan-500 text-white hover:bg-cyan-400">
        View <ArrowRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  );
}

export default RecruiterPage;
