import authOptions from "@/lib/auth";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs"

export async function GET(){
    try{
        const session = await getServerSession(authOptions);

        if(!session?.user?.id){
             return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        };

        if (session.user.role !== "CANDIDATE") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    };

    const interviews = await db.interview.findMany({
        where:{
            application: {
          deletedAt: null,
          candidateProfile: { userId: session.user.id },
        },
        },
         select: {
        id: true,
        scheduledAt: true,
        durationMinutes: true,
        mode: true,
        meetingUrl: true,
        location: true,
        notes: true,
        status: true,
        createdAt: true,
        application: {
          select: {
            id: true,
            job: {
              select: {
                id: true,
                title: true,
                company: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

    return NextResponse.json({
        interviews: interviews.map((interview) => ({
        id: interview.id,
        applicationId: interview.application.id,
        scheduledAt: interview.scheduledAt,
        durationMinutes: interview.durationMinutes,
        mode: interview.mode,
        meetingUrl: interview.meetingUrl,
        location: interview.location,
        notes: interview.notes,
        status: interview.status,
        createdAt: interview.createdAt,
        job: {
          id: interview.application.job.id,
          title: interview.application.job.title,
          companyName: interview.application.job.company.name,
        },
      })),
    })
    }catch(err){
        console.log("get candidate interviews error",err);
        return NextResponse.json({message:"get candidate interviews error",error:err},{status:500})
    }
}