import authOptions from "@/lib/auth";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const [
      totalUsers,
      totalCandidates,
      totalRecruiters,
      totalJobs,
      publishedJobs,
      totalApplications,
      totalSkills,
    ] = await Promise.all([
      db.user.count({ where: { deletedAt: null } }),
      db.user.count({ where: { role: "CANDIDATE", deletedAt: null } }),
      db.user.count({ where: { role: "RECRUITER", deletedAt: null } }),
      db.user.count({ where: { deletedAt: null } }),
      db.job.count({ where: { status: "PUBLISHED", deletedAt: null } }),
      db.jobApplication.count(),
      db.skillMaster.count(),
    ]);

    const recentUsers = await db.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    const recentJobs = await db.job.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        company: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      stats: {
        totalUsers,
        totalCandidates,
        totalRecruiters,
        totalJobs,
        publishedJobs,
        totalApplications,
        totalSkills,
      },
      recentUsers,
      recentJobs,
    });
  } catch (error) {
    console.error("ADMIN_DASHBOARD_ERROR:", error);
    return NextResponse.json(
      { message: "Failed to load admin dashboard" },
      { status: 500 },
    );
  }
}
