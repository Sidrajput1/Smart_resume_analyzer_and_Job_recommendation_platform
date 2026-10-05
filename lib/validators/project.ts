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
    .refine((value) => value === null || !Number.isNaN(Date.parse(value)), {
      message: "Invalid date",
    })
    .nullable()
    .optional(),
);

const optionalUrl = z.preprocess(
  (value) => (value === "" ? null : value),
  z.string().trim().url("Please provide a valid URL").nullable().optional(),
);

export const projectSchema = z.object({
  title: z.string().trim().min(2, "Project title is required"),
  description: optionalText,
  technologies: optionalText,
  githubUrl: optionalUrl,
  liveUrl: optionalUrl,
  startDate: optionalDate,
  endDate: optionalDate,
});

export type ProjectInput = z.infer<typeof projectSchema>;
