import { z } from "zod";

export const createMeasurementRequestSchema = z.object({
  name: z.string().trim().min(2, "Please tell us your name").max(120),
  phone: z
    .string()
    .trim()
    .min(8, "Please enter a valid phone number")
    .max(20)
    .regex(/^[+\d][\d\s-]+$/, "Please enter a valid phone number"),
  pincode: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  area: z.string().trim().max(160).optional().nullable(),
  preferredSlot: z.string().trim().max(160).optional().nullable(),
  note: z.string().trim().max(2000).optional().nullable(),
  /** Honeypot — must stay empty. */
  website: z.string().max(0).optional(),
});

export type CreateMeasurementRequestInput = z.infer<
  typeof createMeasurementRequestSchema
>;

export const MEASUREMENT_STATUS_LABEL = {
  requested: "Requested",
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
} as const;
