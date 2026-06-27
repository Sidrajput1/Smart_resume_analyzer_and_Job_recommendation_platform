"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BarChart3,
  BriefcaseBusiness,
  CircleUserRound,
  FileText,
  Home,
  LogOut,
  Menu,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type Role = "CANDIDATE" | "RECRUITER" | "ADMIN";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const NAV_ITEMS: Record<Role, NavItem[]> = {
  CANDIDATE: [
    { label: "Dashboard", href: "/candidate", icon: <Home className="h-4 w-4" /> },
    { label: "Resume", href: "/candidate/resume", icon: <FileText className="h-4 w-4" /> },
    { label: "Jobs", href: "/candidate/jobs", icon: <BriefcaseBusiness className="h-4 w-4" /> },
    { label: "Profile", href: "/candidate/profile", icon: <CircleUserRound className="h-4 w-4" /> },
  ],
  RECRUITER: [
    { label: "Dashboard", href: "/recruiter", icon: <Home className="h-4 w-4" /> },
    { label: "Jobs", href: "/recruiter/jobs", icon: <BriefcaseBusiness className="h-4 w-4" /> },
    { label: "Candidates", href: "/recruiter/candidates", icon: <Users className="h-4 w-4" /> },
    { label: "Analytics", href: "/recruiter/analytics", icon: <BarChart3 className="h-4 w-4" /> },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/admin", icon: <Home className="h-4 w-4" /> },
    { label: "Users", href: "/admin/users", icon: <Users className="h-4 w-4" /> },
    { label: "Jobs", href: "/admin/jobs", icon: <BriefcaseBusiness className="h-4 w-4" /> },
    { label: "Skills", href: "/admin/skills", icon: <Sparkles className="h-4 w-4" /> },
    { label: "Audit Logs", href: "/admin/audit-logs", icon: <ShieldCheck className="h-4 w-4" /> },
  ],
};

function getTitle(role: Role) {
  if (role === "CANDIDATE") return "Candidate Portal";
  if (role === "RECRUITER") return "Recruiter Portal";
  return "Admin Portal";
}

function SidebarContent({
  role,
  onNavigate,
}: {
  role: Role;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const navItems = NAV_ITEMS[role];

  return (
    <div className="flex h-full flex-col bg-slate-950 text-white">
      <div className="px-5 py-5">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-500/20 to-cyan-500/10 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
            Smart Resume Portal
          </p>
          <h2 className="mt-2 text-lg font-semibold">{getTitle(role)}</h2>
          <p className="mt-1 text-sm text-slate-400">
            AI-powered recruitment workspace
          </p>
        </div>
      </div>

      <Separator className="bg-white/10" />

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-all duration-300",
                  active
                    ? "bg-white/10 text-white shadow-lg"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator className="bg-white/10" />

      <div className="p-4">
        <Button
          variant="outline"
          className="w-full justify-start border-white/10 bg-white/5 text-white hover:bg-white/10"
          onClick={() => signOut({ callbackUrl: "/signin" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}

export default function DashboardShell({
  role,
  children,
  userName,
  userEmail,
}: {
  role: Role;
  children: React.ReactNode;
  userName?: string | null;
  userEmail?: string | null;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 border-r border-white/10 lg:block">
          <SidebarContent role={role} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
            <div className="flex items-center justify-between px-4 py-4 lg:px-6">
              <div className="flex items-center gap-3">
                <div className="lg:hidden">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                      >
                        <Menu className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent
                      side="left"
                      className="w-72 border-white/10 bg-slate-950 p-0 text-white"
                    >
                      <SidebarContent role={role} />
                    </SheetContent>
                  </Sheet>
                </div>

                <div>
                  <p className="text-sm text-slate-400">Hello</p>
                  <h1 className="text-lg font-semibold">
                    {userName ?? "User"}
                  </h1>
                </div>
              </div>

              <div className="hidden text-right sm:block">
                <p className="text-sm text-slate-300">{userEmail ?? ""}</p>
                <p className="text-xs text-slate-500">{getTitle(role)}</p>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 lg:px-6">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}