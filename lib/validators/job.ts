import {z} from "zod";

export const jobCreateSchema = z.object({
  title: z.string().min(3, "Job title is required"),
  description: z.string().min(20, "Job description is required"),
  responsibilities: z.string().optional().nullable(),
  benefits: z.string().optional().nullable(),

  jobType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "FREELANCE", "TEMPROARY"]),
  workMode: z.enum(["ONSITE", "REMOTE", "HYBRID"]),
  experienceLevel: z
    .enum(["FRESHER", "JUNIOR", "MID_LEVEL", "SENIOR", "LEAD"])
    .optional()
    .nullable(),

  locationCity: z.string().optional().nullable(),
  locationState: z.string().optional().nullable(),
  locationCountry: z.string().optional().nullable(),

  requiredExperienceYears: z.coerce.number().optional().nullable(),
  salaryMin: z.coerce.number().optional().nullable(),
  salaryMax: z.coerce.number().optional().nullable(),
  currency: z.string().optional().nullable(),

  applicationDeadline: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "PAUSED", "CLOSED", "ARCHIVED"]).optional(),

  skills: z.array(z.string().min(1)).default([]),
});

export type JobCreateInput = z.infer<typeof jobCreateSchema>;

