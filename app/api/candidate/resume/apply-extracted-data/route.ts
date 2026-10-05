import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import authOptions from "@/lib/auth";
import { db } from "@/lib/db";

const MONTHS: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

function parseFlexibleDate(
  value: string | null | undefined,
  boundary: "start" | "end",
): Date | null {
  if (!value) return null;

  const normalized = value.trim();

  if (!normalized) return null;

  if (/^(present|current)$/i.test(normalized)) {
    return null;
  }

  // YYYY
  const yearOnly = normalized.match(/^(\d{4})$/);

  if (yearOnly) {
    const year = Number(yearOnly[1]);

    return boundary === "start"
      ? new Date(Date.UTC(year, 0, 1))
      : new Date(Date.UTC(year, 11, 31));
  }

  // YYYY-MM
  const yearMonth = normalized.match(/^(\d{4})-(\d{1,2})$/);

  if (yearMonth) {
    const year = Number(yearMonth[1]);
    const month = Number(yearMonth[2]) - 1;

    if (month < 0 || month > 11) {
      return null;
    }

    return boundary === "start"
      ? new Date(Date.UTC(year, month, 1))
      : new Date(Date.UTC(year, month + 1, 0));
  }

  // Mon YYYY
  const monthYear = normalized.match(
    /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})$/i,
  );

  if (monthYear) {
    const month = MONTHS[monthYear[1].slice(0, 3).toLowerCase()];
    const year = Number(monthYear[2]);

    return boundary === "start"
      ? new Date(Date.UTC(year, month, 1))
      : new Date(Date.UTC(year, month + 1, 0));
  }

  return null;
}

function isCurrentDate(value: string | null | undefined) {
  if (!value) return false;

  return /^(present|current)$/i.test(value.trim());
}

function splitLocation(location: string | null | undefined) {
  if (!location) {
    return {
      city: null,
      state: null,
      country: null,
    };
  }

  const parts = location
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    city: parts[0] ?? null,
    state: parts[1] ?? null,
    country: parts[2] ?? null,
  };
}

function normalizeSkillName(value: string): string {
  const skill = value.trim();

  if (!skill) return "";

  const aliases: Record<string, string> = {
    javascript: "JavaScript",
    js: "JavaScript",
    typescript: "TypeScript",
    ts: "TypeScript",
    node: "Node.js",
    nodejs: "Node.js",
    "node js": "Node.js",
    reactjs: "React",
    "react.js": "React",
    nextjs: "Next.js",
    "next js": "Next.js",
    express: "Express.js",
    expressjs: "Express.js",
    postgres: "PostgreSQL",
    postgresql: "PostgreSQL",
    mysql: "MySQL",
    mongodb: "MongoDB",
    mongo: "MongoDB",
    python: "Python",
    docker: "Docker",
    redis: "Redis",
    git: "Git",
    github: "GitHub",
    "tailwind css": "Tailwind CSS",
    "socket.io": "Socket.io",
  };

  const normalizedKey = skill.toLowerCase().replace(/\s+/g, " ").trim();

  return aliases[normalizedKey] ?? skill;
}

function normalizeString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed || null;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          message: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    const body = await request.json();

    const data = body?.data;

    if (!data || typeof data !== "object") {
      return NextResponse.json(
        {
          message: "Extracted resume data is required",
        },
        {
          status: 400,
        },
      );
    }

    const personal = data.personal ?? {};

    const education = Array.isArray(data.education) ? data.education : [];

    const experience = Array.isArray(data.experience) ? data.experience : [];

    const projects = Array.isArray(data.projects) ? data.projects : [];

    const skills = Array.isArray(data.skills) ? data.skills : [];

    const certifications = Array.isArray(data.certifications)
      ? data.certifications
      : [];

    const candidate = await db.candidateProfile.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        resume: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!candidate) {
      return NextResponse.json(
        {
          message: "Candidate profile not found",
        },
        {
          status: 404,
        },
      );
    }

    if (!candidate.resume) {
      return NextResponse.json(
        {
          message: "Please upload your resume first",
        },
        {
          status: 400,
        },
      );
    }

    const locationParts = splitLocation(normalizeString(personal.location));

    const personalName = normalizeString(personal.fullName);

    const summary = normalizeString(data.summary);

    const firstExperienceRole = normalizeString(experience[0]?.role);

    const nextHeadline = candidate.headline ?? firstExperienceRole ?? null;

    const nextBio = summary ?? candidate.bio ?? null;

    const uniqueSkills: string[] = Array.from(
      new Set<string>(
        skills
          .map((skill: unknown) =>
            typeof skill === "string" ? normalizeSkillName(skill) : "",
          )
          .filter(Boolean),
      ),
    );

    const result = await db.$transaction(async (tx) => {
      /*
       * ---------------------------------------------------
       * 1. Update User name
       * ---------------------------------------------------
       */

      if (personalName) {
        await tx.user.update({
          where: {
            id: session.user.id,
          },
          data: {
            name: personalName,
          },
        });
      }

      /*
       * ---------------------------------------------------
       * 2. Update CandidateProfile
       * ---------------------------------------------------
       */

      const updatedCandidate = await tx.candidateProfile.update({
        where: {
          id: candidate.id,
        },
        data: {
          headline: nextHeadline,
          bio: nextBio,

          phone: normalizeString(personal.phone) ?? candidate.phone,

          linkedinUrl:
            normalizeString(personal.linkedinUrl) ?? candidate.linkedinUrl,

          githubUrl: normalizeString(personal.githubUrl) ?? candidate.githubUrl,

          portfolioUrl:
            normalizeString(personal.portfolioUrl) ?? candidate.portfolioUrl,

          city: locationParts.city ?? candidate.city,

          state: locationParts.state ?? candidate.state,

          country: locationParts.country ?? candidate.country,
        },
      });

      /*
       * ---------------------------------------------------
       * 3. Remove existing resume-derived profile data
       *
       * This prevents duplicates when the candidate
       * imports another resume later.
       * ---------------------------------------------------
       */

      await tx.candidateSkill.deleteMany({
        where: {
          candidateProfileId: candidate.id,
        },
      });

      await tx.education.deleteMany({
        where: {
          candidateProfileId: candidate.id,
        },
      });

      await tx.experience.deleteMany({
        where: {
          candidateProfileId: candidate.id,
        },
      });

      await tx.candidateProject.deleteMany({
        where: {
          candidateProfileId: candidate.id,
        },
      });

      await tx.certification.deleteMany({
        where: {
          candidateProfileId: candidate.id,
        },
      });

      /*
       * ---------------------------------------------------
       * 4. Education
       * ---------------------------------------------------
       */

      for (const item of education) {
        const degree = normalizeString(item.degree);

        const institution = normalizeString(item.institution);

        if (!degree && !institution) {
          continue;
        }

        await tx.education.create({
          data: {
            candidateProfileId: candidate.id,

            institutionName: institution ?? "Not specified",

            degree: degree ?? "Not specified",

            fieldOfStudy: normalizeString(item.fieldOfStudy),

            startDate: parseFlexibleDate(item.startDate, "start"),

            endDate: parseFlexibleDate(item.endDate, "end"),

            isCurrentlyStudying: isCurrentDate(item.endDate),
          },
        });
      }

      /*
       * ---------------------------------------------------
       * 5. Experience
       * ---------------------------------------------------
       */

      for (const item of experience) {
        const company = normalizeString(item.company);

        const role = normalizeString(item.role);

        if (!company && !role) {
          continue;
        }

        const current = isCurrentDate(item.endDate);

        const responsibilities = Array.isArray(item.responsibilities)
          ? item.responsibilities
              .filter((value: unknown) => typeof value === "string")
              .map((value: string) => value.trim())
              .filter(Boolean)
              .join("\n")
          : "";

        await tx.experience.create({
          data: {
            candidateProfileId: candidate.id,

            companyName: company ?? "Not specified",

            jobTitle: role ?? "Not specified",

            employmentType: "FULL_TIME",

            location: normalizeString(item.location),

            description: null,

            responsibilities: responsibilities || null,

            startDate: parseFlexibleDate(item.startDate, "start"),

            endDate: current ? null : parseFlexibleDate(item.endDate, "end"),

            isCurrent: current,
          },
        });
      }

      /*
       * ---------------------------------------------------
       * 6. Projects
       * ---------------------------------------------------
       */

      for (const item of projects) {
        const title = normalizeString(item.title);

        if (!title) {
          continue;
        }

        const technologies = Array.isArray(item.technologies)
          ? item.technologies
              .filter((value: unknown) => typeof value === "string")
              .map((value: string) => value.trim())
              .filter(Boolean)
              .join(", ")
          : "";

        await tx.candidateProject.create({
          data: {
            candidateProfileId: candidate.id,

            title,

            description: normalizeString(item.description),

            technologies: technologies || null,
          },
        });
      }

      /*
       * ---------------------------------------------------
       * 7. Certifications
       * ---------------------------------------------------
       */

      for (const item of certifications) {
        const title = normalizeString(item.title);

        if (!title) {
          continue;
        }

        await tx.certification.create({
          data: {
            candidateProfileId: candidate.id,

            title,

            issuer: normalizeString(item.issuer) ?? "Not specified",

            issueDate: parseFlexibleDate(item.date, "start"),
          },
        });
      }

      /*
       * ---------------------------------------------------
       * 8. Skills
       * ---------------------------------------------------
       */

      for (const skillName of uniqueSkills) {
        const skill = await tx.skillMaster.upsert({
          where: {
            name: skillName,
          },

          create: {
            name: skillName,
          },

          update: {},
        });

        await tx.candidateSkill.create({
          data: {
            candidateProfileId: candidate.id,

            skillId: skill.id,

            notes: "Imported from resume",
          },
        });
      }

      /*
       * ---------------------------------------------------
       * 9. Update resume metadata
       * ---------------------------------------------------
       */

      await tx.resume.update({
        where: {
          id: candidate.resume!.id,
        },

        data: {
          summary: summary ?? candidate.resume!.summary,

          parsedAt: new Date(),
        },
      });

      /*
       * ---------------------------------------------------
       * 10. Existing intelligence is now stale.
       * Delete it so Phase B can generate a fresh one.
       * ---------------------------------------------------
       */

      await tx.candidateIntelligence.deleteMany({
        where: {
          candidateProfileId: candidate.id,
        },
      });

      return updatedCandidate;
    });

    return NextResponse.json({
      message: "Resume information saved to your profile successfully",

      candidate: result,
    });
  } catch (error) {
    console.error("APPLY_PARSED_RESUME_ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to save extracted resume information",
      },
      {
        status: 500,
      },
    );
  }
}
