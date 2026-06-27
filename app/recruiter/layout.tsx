
import DashboardShell from "@/components/Dashboard-Shell";
import authOptions from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";


export default async function RecruiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/signin");
  if (session.user.role !== "RECRUITER") redirect("/unauthorized");

  return (
    <DashboardShell
      role="RECRUITER"
      userName={session.user.name}
      userEmail={session.user.email}
    >
      {children}
    </DashboardShell>
  );
}