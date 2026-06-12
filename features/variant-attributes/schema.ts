import { z } from "zod";
import { productCategoryEnum, variantAttributeInputEnum } from "@/lib/db/schema";

const keySchema = z
  .string()
  .min(1, "Key is required")
  .max(40)
  .regex(/^[a-z][a-z0-9_]*$/, "Key must be lowercase letters/numbers/underscores (e.g. doors, seat_height)");

export const variantAttributeCreateSchema = z.object({
  category: z.enum(productCategoryEnum.enumValues),
  key: keySchema,
  label: z.string().min(1, "Label is required").max(60),
  inputType: z.enum(variantAttributeInputEnum.enumValues).default("select"),
  options: z.array(z.string().min(1).max(80)).max(50).default([]),
  isRequired: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const variantAttributeUpdateSchema = variantAttributeCreateSchema
  .omit({ category: true, key: true })
  .partial();

export type VariantAttributeCreateInput = z.infer<typeof variantAttributeCreateSchema>;
export type VariantAttributeUpdateInput = z.infer<typeof variantAttributeUpdateSchema>;
