import authOptions from "@/lib/auth";
import { redirect } from "next/navigation";

import { getServerSession } from "next-auth";
import DashboardShell from "@/components/Dashboard-Shell";

export default async function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/signin");
  if (session.user.role !== "CANDIDATE") redirect("/unauthorized");

  return (
    <DashboardShell
      role="CANDIDATE"
      userName={session.user.name}
      userEmail={session.user.email}
    >
      {children}
    </DashboardShell>
  );
}