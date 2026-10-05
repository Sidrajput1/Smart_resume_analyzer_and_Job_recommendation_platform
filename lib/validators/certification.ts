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

export const certificationSchema = z.object({
  title: z.string().trim().min(2, "Certification title is required"),
  issuer: z.string().trim().min(2, "Issuing organization is required"),
  credentialId: optionalText,
  credentialUrl: optionalUrl,
  issueDate: optionalDate,
  expiryDate: optionalDate,
});

export type CertificationInput = z.infer<typeof certificationSchema>;
