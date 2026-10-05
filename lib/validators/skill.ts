import { z } from "zod";

const optionalText = z.preprocess(
  (value) => (value === "" ? null : value),
  z.string().trim().max(5000).nullable().optional(),
);

export const candidateSkillSchema = z.object({
  name: z.string().trim().min(2, "Skill name is required"),
  proficiencyLevel: z
    .enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"])
    .default("INTERMEDIATE"),
  yearsOfExperience: z.preprocess(
    (value) => (value === "" || value === null ? null : value),
    z.coerce.number().min(0).max(80).nullable().optional(),
  ),
  isPrimary: z.boolean().optional().default(false),
  notes: optionalText,
});

export const candidateSkillUpdateSchema = z.object({
  proficiencyLevel: z
    .enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"])
    .optional(),
  yearsOfExperience: z.preprocess(
    (value) => (value === "" || value === null ? null : value),
    z.coerce.number().min(0).max(80).nullable().optional(),
  ),
  isPrimary: z.boolean().optional(),
  notes: optionalText,
});

export type CandidateSkillInput = z.infer<typeof candidateSkillSchema>;
export type CandidateSkillUpdateInput = z.infer<typeof candidateSkillUpdateSchema>;
