
import DashboardShell from "@/components/Dashboard-Shell";
import authOptions from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";


export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/signin");
  if (session.user.role !== "ADMIN") redirect("/unauthorized");

  return (
    <DashboardShell
      role="ADMIN"
      userName={session.user.name}
      userEmail={session.user.email}
    >
      {children}
    </DashboardShell>
  );
}