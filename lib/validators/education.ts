import {z} from "zod";

export const educationSchema = z.object({
    institutionName: z.string().min(2, "Institution name is required"),
  degree: z.string().min(2, "Degree is required"),
  fieldOfStudy: z.string().optional().nullable(),
  grade: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  isCurrentlyStudying: z.boolean().optional().default(false),
});

export type EducationInput = z.infer<typeof educationSchema>;