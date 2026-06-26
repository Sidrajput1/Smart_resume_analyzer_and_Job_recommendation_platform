import {z} from "zod";

export const registerSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal("CANDIDATE"),
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
  }),
  z.object({
    role: z.literal("RECRUITER"),
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    companyName: z.string().min(2, "Company name is required"),
    designation: z.string().optional(),
    phone: z.string().optional(),
  }),
]);

export type RegisterInput = z.infer<typeof registerSchema>;