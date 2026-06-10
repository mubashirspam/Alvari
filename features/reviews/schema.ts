import { z } from "zod";

/**
 * Quick-phrase chips a reviewer can tap instead of (or alongside) typing.
 * Rendered as selectable chips on the form and as badges on the review card.
 */
export const REVIEW_HIGHLIGHTS = [
  "Excellent build quality",
  "Value for money",
  "Solid wood, very sturdy",
  "Premium finish",
  "Looks great in my home",
  "Matches the description",
  "Smooth delivery",
  "Great customer support",
] as const;

export type ReviewHighlight = (typeof REVIEW_HIGHLIGHTS)[number];

export const createReviewSchema = z.object({
  productSlug: z.string().trim().min(1),
  authorName: z
    .string()
    .trim()
    .min(2, "Please tell us your name")
    .max(60, "Name is too long"),
  rating: z
    .number()
    .int()
    .min(1, "Please select a star rating")
    .max(5),
  highlights: z
    .array(z.enum(REVIEW_HIGHLIGHTS))
    .max(REVIEW_HIGHLIGHTS.length)
    .default([]),
  comment: z
    .string()
    .trim()
    .min(10, "Please write at least a short sentence")
    .max(2000, "Review is too long (max 2000 characters)"),
  /** Honeypot — real users never fill this; bots do. Must stay empty. */
  website: z.string().max(0, "Invalid submission").optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const adminReviewActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("reply"),
    reply: z.string().trim().min(1, "Reply cannot be empty").max(2000),
  }),
  z.object({ action: z.literal("hide") }),
  z.object({ action: z.literal("show") }),
]);

export type AdminReviewAction = z.infer<typeof adminReviewActionSchema>;
