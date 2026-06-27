import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-2xl items-center justify-center">
        <Card className="border-white/10 bg-white/5 text-white shadow-2xl backdrop-blur-xl">
          <CardHeader className="items-center text-center">
            <ShieldAlert className="h-12 w-12 text-red-400" />
            <CardTitle className="text-2xl">Unauthorized Access</CardTitle>
            <CardDescription className="text-slate-300">
              You do not have permission to view this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center gap-3">
            <Button asChild className="bg-indigo-500 text-white hover:bg-indigo-400">
              <Link href="/">Go Home</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10">
              <Link href="/signin">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}