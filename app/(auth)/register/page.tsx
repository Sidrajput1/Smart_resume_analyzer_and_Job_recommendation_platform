"use client";

import { useLogin } from "@/hooks/useLogin";
import { useRegister } from "@/hooks/useRegister";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RegisterPage() {
  const router = useRouter();
  const registerMutation = useRegister();

  const loginMutation = useLogin();

  const [role, setRole] = useState<"CANDIDATE" | "RECRUITER">("CANDIDATE");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [designation, setDesignation] = useState("");
  const [phone, setPhone] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (role === "CANDIDATE") {
        await registerMutation.mutateAsync({
          role,
          name,
          email,
          password,
        });
      } else {
        await registerMutation.mutateAsync({
          role,
          name,
          email,
          password,
          companyName,
          designation: designation || undefined,
          phone: phone || undefined,
        });
      }
       await loginMutation.mutateAsync({ email, password });
      //router.push(role === "CANDIDATE" ? "/candidate" : "/recruiter");
        router.push("/")
    } catch (error) {
      console.error(error);
    }
  }
  return (
    <div className="register-page     px-4 py-10 text-foreground">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <Card className="w-full max-w-xl border-border bg-card text-foreground shadow-none  transition-all duration-300 ">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Create your account</CardTitle>
            <CardDescription className="text-foreground">
              Join as a candidate or recruiter.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <Tabs
                value={role}
                onValueChange={(v) => setRole(v as "CANDIDATE" | "RECRUITER")}
              >
                <TabsList className="grid w-full grid-cols-2 bg-card">
                  <TabsTrigger value="CANDIDATE">Candidate</TabsTrigger>
                  <TabsTrigger value="RECRUITER">Recruiter</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    placeholder="Sidharth Shekhar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border-border bg-card text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-border bg-card text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-border bg-card text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                />
              </div>

              {role === "RECRUITER" && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company name</Label>
                    <Input
                      id="companyName"
                      placeholder="Your company"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="border-border bg-card text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="designation">Designation</Label>
                    <Input
                      id="designation"
                      placeholder="HR Manager"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="border-border bg-card text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      placeholder="Mobile number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="border-border bg-card text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={registerMutation.isPending || loginMutation.isPending}
                className="w-full bg-primary text-primary-foreground transition-all duration-300 hover:bg-primary"
              >
                {registerMutation.isPending
                  ? "Creating account..."
                  : "Create account"}
              </Button>

              <p className="text-center text-sm text-foreground">
                Already have an account?{" "}
                <Link
                  href="/signin"
                  className="text-primary transition hover:text-primary"
                >
                  Sign in
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
