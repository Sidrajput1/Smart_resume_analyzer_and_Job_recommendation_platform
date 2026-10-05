import { z } from "zod";

const optionalText = z.preprocess(
  (value) => (value === "" ? null : value),
  z.string().trim().max(5000).nullable().optional(),
);

const optionalDate = z.preprocess(
  (value) => (value === "" ? null : value),
  z
    .string()
    .trim()
    .refine((value) => value === "" || value === null || !Number.isNaN(Date.parse(value)), {
      message: "Invalid date",
    })
    .nullable()
    .optional(),
);

export const experienceSchema = z.object({
  companyName: z.string().trim().min(2, "Company name is required"),
  jobTitle: z.string().trim().min(2, "Job title is required"),
  employmentType: z
    .enum([
      "FULL_TIME",
      "PART_TIME",
      "CONTRACT",
      "INTERNSHIP",
      "FREELANCE",
      "TEMPORARY",
      "REMOTE",
    ])
    .default("FULL_TIME"),
  location: optionalText,
  description: optionalText,
  responsibilities: optionalText,
  startDate: optionalDate,
  endDate: optionalDate,
  isCurrent: z.boolean().optional().default(false),
});

export type ExperienceInput = z.infer<typeof experienceSchema>;
