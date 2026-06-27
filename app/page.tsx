
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, BriefcaseBusiness, BrainCircuit, ShieldCheck } from "lucide-react";
//import NextAuth from "next-auth";


export default async function Home() {
  //const session = await auth()
  const session = await getServerSession(authOptions);

  if(session?.user?.role === "CANDIDATE") redirect("/candidate")
  if(session?.user?.role === "RECRUITER") redirect("/recruiter");
  if(session?.user?.role === "ADMIN") redirect("/admin")
  return (

    <main className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-7xl items-center px-4 py-12">
        <div className="grid w-full gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <Badge className="bg-indigo-500/20 text-indigo-200 hover:bg-indigo-500/20">
              AI-Powered Recruitment Platform
            </Badge>

            <h1 className="max-w-xl text-4xl font-bold tracking-tight sm:text-5xl">
              Smart Resume Analysis and Job Recommendation Portal
            </h1>

            <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Upload resumes, analyze candidate profiles, match jobs intelligently,
              and help recruiters discover the right talent faster.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button asChild className="bg-indigo-500 text-white transition hover:bg-indigo-400">
                <Link href="/signin">Sign in</Link>
              </Button>
              <Button asChild variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10">
                <Link href="/register">Create account</Link>
              </Button>
            </div>

            <div className="grid gap-4 pt-6 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur transition duration-300 hover:-translate-y-1">
                <BrainCircuit className="mb-3 h-5 w-5 text-indigo-300" />
                <p className="font-medium">AI Matching</p>
                <p className="text-sm text-slate-300">Smart job and candidate recommendations.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur transition duration-300 hover:-translate-y-1">
                <BriefcaseBusiness className="mb-3 h-5 w-5 text-indigo-300" />
                <p className="font-medium">Recruiter Tools</p>
                <p className="text-sm text-slate-300">Post jobs, review applicants, rank candidates.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur transition duration-300 hover:-translate-y-1">
                <ShieldCheck className="mb-3 h-5 w-5 text-indigo-300" />
                <p className="font-medium">Secure Access</p>
                <p className="text-sm text-slate-300">Role-based authentication with protected routes.</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-[2rem] bg-indigo-500/20 blur-3xl" />
            <Card className="border-white/10 bg-white/8 text-white shadow-2xl backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-2xl">What the platform does</CardTitle>
                <CardDescription className="text-slate-300">
                  A clean workflow from resume upload to intelligent job matching.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FeatureRow title="Candidate Intelligence Profile" desc="AI-generated resume score, strengths, skill gaps, and suggested roles." />
                <FeatureRow title="Job Recommendation Engine" desc="Live match scoring between candidate profile and job requirements." />
                <FeatureRow title="Recruiter Dashboard" desc="Manage jobs, track applications, and view ranked candidates." />
                <FeatureRow title="Admin Oversight" desc="Monitor users, jobs, and platform activity in one place." />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
    
  );
};


// feature row

function FeatureRow({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 transition duration-300 hover:bg-white/10">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-slate-300">{desc}</p>
    </div>
  );
}
