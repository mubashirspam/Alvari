import { z } from "zod";
import { productCategoryEnum } from "@/lib/db/schema";

const emptyToNull = (v: unknown) => (v === "" || v == null ? null : v);

type ProductCategoryValue = (typeof productCategoryEnum.enumValues)[number];
const categoryValues = productCategoryEnum.enumValues as unknown as [
  ProductCategoryValue,
  ...ProductCategoryValue[],
];

export const categoryNodeCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  slug: z.string().trim().min(1, "Slug is required"),
  parentId: z.preprocess(emptyToNull, z.string().uuid().nullable()),
  imageKey: z.preprocess(emptyToNull, z.string().nullable()),
  accentColor: z.preprocess(emptyToNull, z.string().nullable()),
  linkCategory: z.preprocess(emptyToNull, z.enum(categoryValues).nullable()),
  material: z.preprocess(emptyToNull, z.string().nullable()),
  linkHref: z.preprocess(emptyToNull, z.string().nullable()),
  sortOrder: z.coerce.number().int().default(0),
  isVisible: z.boolean().default(true),
});

export const categoryNodeUpdateSchema = categoryNodeCreateSchema.partial();

export type CategoryNodeCreateInput = z.infer<typeof categoryNodeCreateSchema>;
