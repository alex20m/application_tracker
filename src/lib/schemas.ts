import { z } from "zod";
import { STATUS, type ApplicationStatus } from "./statuses";

const trimmedString = (max: number) => z.string().trim().min(1).max(max);
const statusValues = Object.values(STATUS) as [ApplicationStatus, ...ApplicationStatus[]];

export const ApplicationCreateSchema = z.object({
  company: trimmedString(200),
  role: trimmedString(200),
  location: trimmedString(200),
  source: z.string().trim().max(200).optional().default(""),
  notes: z.string().max(5000).optional().default(""),
  applied_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
});

export const ApplicationUpdateSchema = ApplicationCreateSchema.extend({
  status: z.enum(statusValues),
});

export const ApplicationNoteSchema = z.object({
  notes: z.string().max(5000),
});

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

export const PASSWORD_RULES = [
  { id: "length", label: "At least 8 characters", test: (v: string) => v.length >= PASSWORD_MIN },
  { id: "letter", label: "Contains a letter", test: (v: string) => /[A-Za-z]/.test(v) },
  { id: "number", label: "Contains a number", test: (v: string) => /\d/.test(v) },
] as const;

export const PasswordSchema = z
  .string()
  .max(PASSWORD_MAX)
  .refine((v) => v.length >= PASSWORD_MIN, "Password must be at least 8 characters")
  .refine((v) => /[A-Za-z]/.test(v), "Password must contain a letter")
  .refine((v) => /\d/.test(v), "Password must contain a number");

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const ResetPasswordSchema = z
  .object({ password: PasswordSchema, confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const DeleteAccountSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: PasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    path: ["newPassword"],
    message: "New password must differ from the current password",
  });
