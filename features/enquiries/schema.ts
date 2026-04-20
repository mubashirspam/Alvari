import { z } from "zod";

export const enquirySchema = z.object({
  name: z.string().trim().min(2, "Please tell us your name").max(120),
  phone: z
    .string()
    .trim()
    .min(6, "A reachable phone number helps us call back")
    .max(20),
  location: z.string().trim().max(120).optional().nullable(),
  productCategory: z.enum([
    "almirah",
    "bed",
    "sofa",
    "dining",
    "dressing",
    "coffee_table",
    "mattress",
    "room_set",
    "custom",
  ]),
  productSlug: z.string().trim().max(200).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;
