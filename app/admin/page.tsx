
import { redirect } from "next/navigation";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Users, BriefcaseBusiness, Activity, ArrowRight } from "lucide-react";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/signin");
  if (session.user.role !== "ADMIN") redirect("/unauthorized");

  return (
    
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-3xl border border-white/10 bg-linear-to-r from-violet-500/20 to-indigo-500/10 p-6 shadow-xl backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <Badge className="bg-white/10 text-white hover:bg-white/10">Admin Dashboard</Badge>
              <h1 className="text-3xl font-bold">Platform Overview</h1>
              <p className="text-slate-300">
                Monitor users, jobs, applications, and system activity.
              </p>
            </div>
            <Button asChild className="bg-violet-500 text-white hover:bg-violet-400">
              <Link href="/admin/users">Manage Users</Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <MetricCard icon={<Users className="h-5 w-5 text-violet-300" />} title="Users" value="1,284" desc="Candidates and recruiters" />
          <MetricCard icon={<BriefcaseBusiness className="h-5 w-5 text-violet-300" />} title="Jobs" value="312" desc="Posted openings" />
          <MetricCard icon={<ShieldCheck className="h-5 w-5 text-violet-300" />} title="Verified Companies" value="84" desc="Trusted recruiters" />
          <MetricCard icon={<Activity className="h-5 w-5 text-violet-300" />} title="Platform Health" value="98%" desc="Stable and responsive" />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="border-white/10 bg-white/5 text-white backdrop-blur">
            <CardHeader>
              <CardTitle>System Activity</CardTitle>
              <CardDescription className="text-slate-300">
                Recent platform actions and monitoring signals.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ActivityRow title="New recruiter account created" detail="2 minutes ago" />
              <ActivityRow title="Job recommendation generated" detail="8 minutes ago" />
              <ActivityRow title="Candidate profile updated" detail="12 minutes ago" />
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 text-white backdrop-blur">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription className="text-slate-300">
                Use these shortcuts during platform administration.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ActionRow title="Manage Skills" href="/admin/skills" />
              <ActionRow title="Review Companies" href="/admin/companies" />
              <ActionRow title="Audit Logs" href="/admin/audit-logs" />
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

function ActivityRow({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 transition duration-300 hover:bg-white/10">
      <p className="font-medium">{title}</p>
      <p className="text-sm text-slate-400">{detail}</p>
    </div>
  );
}

function ActionRow({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 transition duration-300 hover:bg-white/10">
      <p className="font-medium">{title}</p>
      <Button asChild size="sm" className="bg-violet-500 text-white hover:bg-violet-400">
        <Link href={href}>
          Open <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}