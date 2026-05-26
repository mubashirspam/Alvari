import { z } from "zod";

export const checkoutItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().nullable().optional(),
  quantity: z.number().int().min(1).max(99),
});

export const checkoutSchema = z.object({
  customerName: z.string().trim().min(2, "Please tell us your name").max(120),
  customerPhone: z
    .string()
    .trim()
    .min(8, "Please enter a valid phone number")
    .max(20),
  customerEmail: z
    .string()
    .trim()
    .email("Invalid email")
    .max(160)
    .optional()
    .or(z.literal(""))
    .nullable(),
  shippingAddress: z
    .string()
    .trim()
    .min(8, "Please tell us where to deliver")
    .max(1000),
  notes: z.string().trim().max(2000).optional().nullable(),
  items: z.array(checkoutItemSchema).min(1, "Cart is empty"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CheckoutItemInput = z.infer<typeof checkoutItemSchema>;
