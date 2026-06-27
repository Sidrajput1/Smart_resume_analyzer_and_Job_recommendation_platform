import authOptions from "@/lib/auth";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {

    try {
        const session = await getServerSession(authOptions);

        if(!session?.user?.id){
            return NextResponse.json({message:"Unauthorized"},{status:401})
        };

        const candidate = await db?.candidateProfile?.findUnique({
            where:{
                userId:session.user.id,
            },

            include:{
                resume:true,
                educations:{
                    orderBy:{createdAt:"desc"}
                },
                experiences:{
                    orderBy:{createdAt:"desc"}
                },
                projects:{
                     orderBy:{createdAt:"desc"}
                },
                 certifications:{
                     orderBy:{createdAt:"desc"}
                },
                candidateSkill:{
                    include:{
                        skill:true
                    },
                    orderBy:{createdAt:"desc"}
                },
            },
        });

        if(!candidate){
            return NextResponse.json(
        { message: "Candidate profile not found" },
        { status: 404 }
      );
        }

        return NextResponse.json({ candidate });
    } catch (error) {
        console.error("GET_CANDIDATE_RESUME_ERROR:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
    }
    
};


export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const candidate = await db.candidateProfile.update({
      where: {
        userId: session.user.id,
      },
      data: {
        headline: body.headline ?? null,
        bio: body.bio ?? null,
        phone: body.phone ?? null,
        city: body.city ?? null,
        state: body.state ?? null,
        country: body.country ?? null,
        linkedinUrl: body.linkedinUrl ?? null,
        githubUrl: body.githubUrl ?? null,
        portfolioUrl: body.portfolioUrl ?? null,
        experienceLevel: body.experienceLevel ?? undefined,
        resume: body.resumeTitle
          ? {
              upsert: {
                create: {
                  title: body.resumeTitle,
                  summary: body.resumeSummary ?? null,
                  status: "DRAFT",
                  visibility: "PRIVATE",
                },
                update: {
                  title: body.resumeTitle,
                  summary: body.resumeSummary ?? null,
                },
              },
            }
          : undefined,
      },
      include: {
        resume: true,
        educations: true,
        experiences: true,
        projects: true,
        certifications: true,
        candidateSkills: {
          include: {
            skill: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Candidate resume updated successfully",
      candidate,
    });
  } catch (error) {
    console.error("PATCH_CANDIDATE_RESUME_ERROR:", error);
    return NextResponse.json(
      { message: "Failed to update candidate resume" },
      { status: 500 }
    );
  }
}