"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLogin } from "@/hooks/useLogin";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  const router = useRouter();
  const loginMutation = useLogin();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      await loginMutation.mutateAsync({ email, password });
      router.push("/");
    } catch {
      // toast handled in hook
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <Card className="w-full max-w-md border-white/10 bg-white/5 text-white shadow-2xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription className="text-slate-300">
              Sign in to continue to your dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-white/10 bg-white/10 text-white placeholder:text-slate-400 focus-visible:ring-indigo-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-white/10 bg-white/10 text-white placeholder:text-slate-400 focus-visible:ring-indigo-400"
                />
              </div>

              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full bg-indigo-500 text-white transition-all duration-300 hover:bg-indigo-400"
              >
                {loginMutation.isPending ? "Signing in..." : "Sign in"}
              </Button>

              <p className="text-center text-sm text-slate-300">
                New here?{" "}
                <Link href="/register" className="text-indigo-300 transition hover:text-indigo-200">
                  Create an account
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}