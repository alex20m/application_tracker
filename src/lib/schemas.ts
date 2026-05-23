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
});

export const ApplicationUpdateSchema = ApplicationCreateSchema.extend({
  status: z.enum(statusValues),
});

export const ApplicationNoteSchema = z.object({
  notes: z.string().max(5000),
});
