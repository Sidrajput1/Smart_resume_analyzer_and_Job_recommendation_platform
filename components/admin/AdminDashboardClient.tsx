"use client";

import Link from "next/link";
import { Users, BriefcaseBusiness, Sparkles, ShieldCheck, ArrowRight } from "lucide-react";

import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboardClient() {
  const { data, isLoading } = useAdminDashboard();

  if (isLoading) {
    return <AdminDashboardSkeleton />;
  }

  const stats = data?.stats ?? {};

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-linear-to-r from-violet-500/20 to-indigo-500/10 p-6 shadow-xl backdrop-blur">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-300">
            Admin Dashboard
          </p>
          <h2 className="text-3xl font-bold">Platform overview</h2>
          <p className="max-w-2xl text-sm text-slate-300">
            Monitor users, jobs, applications, and system activity from one place.
          </p>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric icon={<Users className="h-5 w-5 text-violet-300" />} title="Users" value={String(stats.totalUsers ?? 0)} />
        <Metric icon={<BriefcaseBusiness className="h-5 w-5 text-violet-300" />} title="Jobs" value={String(stats.totalJobs ?? 0)} />
        <Metric icon={<Sparkles className="h-5 w-5 text-violet-300" />} title="Applications" value={String(stats.totalApplications ?? 0)} />
        <Metric icon={<ShieldCheck className="h-5 w-5 text-violet-300" />} title="Skills" value={String(stats.totalSkills ?? 0)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-white/10 bg-white/5 text-white backdrop-blur">
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription className="text-slate-300">
              Key information about the platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <InfoLine label="Candidates" value={String(stats.totalCandidates ?? 0)} />
            <InfoLine label="Recruiters" value={String(stats.totalRecruiters ?? 0)} />
            <InfoLine label="Published Jobs" value={String(stats.publishedJobs ?? 0)} />
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white backdrop-blur">
          <CardHeader>
            <CardTitle>Admin Actions</CardTitle>
            <CardDescription className="text-slate-300">
              Go to the main admin modules.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ActionRow title="Manage Users" href="/admin/users" />
            <ActionRow title="Manage Jobs" href="/admin/jobs" />
            <ActionRow title="Manage Skills" href="/admin/skills" />
            <ActionRow title="Audit Logs" href="/admin/audit-logs" />
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/10 bg-white/5 text-white backdrop-blur">
        <CardHeader>
          <CardTitle>Recent Users</CardTitle>
          <CardDescription className="text-slate-300">
            Newly registered platform users.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(data?.recentUsers ?? []).map((user: any) => (
            <div
              key={user.id}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-slate-400">{user.email}</p>
              </div>
              <Badge className="bg-white/10 text-white hover:bg-white/10">
                {user.role}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <Card className="border-white/10 bg-white/5 text-white backdrop-blur transition duration-300 hover:-translate-y-1">
      <CardContent className="flex items-start gap-3 p-5">
        <div className="rounded-2xl bg-white/10 p-3">{icon}</div>
        <div>
          <p className="text-sm text-slate-300">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}

function ActionRow({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="font-medium">{title}</p>
      <Button asChild size="sm" className="bg-violet-500 text-white hover:bg-violet-400">
        <Link href={href}>
          Open <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

function AdminDashboardSkeleton() {
  return <Skeleton className="h-96 w-full rounded-3xl bg-white/10" />;
}