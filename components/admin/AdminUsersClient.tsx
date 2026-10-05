"use client";

import * as React from "react";
import { Search, Trash2, PencilLine, Users } from "lucide-react";

import { useAdminUsers, useDeleteAdminUser } from "@/hooks/useAdminDashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminUsersClient() {
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [role, setRole] = React.useState("");

  const { data, isLoading } = useAdminUsers(search, role);
  const deleteMutation = useDeleteAdminUser();

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSearch(searchInput.trim());
  }

  if (isLoading) {
    return <UsersSkeleton />;
  }

  const users = data?.users ?? [];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-linear-to-r from-violet-500/20 to-indigo-500/10 p-6 shadow-xl backdrop-blur">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-300">
            Admin Users
          </p>
          <h2 className="text-3xl font-bold">Manage platform users</h2>
          <p className="max-w-2xl text-sm text-slate-300">
            Search users, filter by role, and manage access.
          </p>
        </div>
      </section>

      <div className="flex flex-col gap-3 md:flex-row">
        <form onSubmit={handleSearch} className="flex flex-1 gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name or email..."
              className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-slate-400 focus-visible:ring-indigo-400"
            />
          </div>
          <Button type="submit" className="bg-violet-500 text-white hover:bg-violet-400">
            Search
          </Button>
        </form>

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"
        >
          <option value="" className="bg-slate-950">All Roles</option>
          <option value="ADMIN" className="bg-slate-950">ADMIN</option>
          <option value="CANDIDATE" className="bg-slate-950">CANDIDATE</option>
          <option value="RECRUITER" className="bg-slate-950">RECRUITER</option>
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Metric title="Total Users" value={String(users.length)} />
        <Metric title="Candidates" value={String(users.filter((u: any) => u.role === "CANDIDATE").length)} />
        <Metric title="Recruiters" value={String(users.filter((u: any) => u.role === "RECRUITER").length)} />
      </div>

      <div className="grid gap-4">
        {users.length === 0 ? (
          <Card className="border-white/10 bg-white/5 text-white backdrop-blur">
            <CardContent className="p-10 text-center">
              <p className="text-lg font-semibold">No users found</p>
            </CardContent>
          </Card>
        ) : (
          users.map((user: any) => (
            <Card
              key={user.id}
              className="border-white/10 bg-white/5 text-white shadow-lg backdrop-blur"
            >
              <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-lg font-semibold">{user.name}</p>
                  <p className="text-sm text-slate-400">{user.email}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge className="bg-white/10 text-white hover:bg-white/10">{user.role}</Badge>
                    {user.candidate ? (
                      <Badge className="bg-indigo-500/20 text-indigo-200 hover:bg-indigo-500/20">
                        Candidate Profile
                      </Badge>
                    ) : null}
                    {user.recruiter ? (
                      <Badge className="bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/20">
                        Recruiter Profile
                      </Badge>
                    ) : null}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10">
                    <PencilLine className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/10 bg-white/5 hover:bg-white/10"
                    onClick={() => deleteMutation.mutate(user.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
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

function UsersSkeleton() {
  return <Skeleton className="h-96 w-full rounded-3xl bg-white/10" />;
}