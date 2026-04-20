import { insertEnquiry } from "@/features/enquiries/repositories/enquiry-repository";
import { enquirySchema, type EnquiryInput } from "@/features/enquiries/schema";
import type { EnquiryRow } from "@/lib/db/schema";

export async function createEnquiry(raw: unknown): Promise<EnquiryRow> {
  const input: EnquiryInput = enquirySchema.parse(raw);

  return insertEnquiry({
    name: input.name,
    phone: input.phone,
    location: input.location ?? null,
    productCategory: input.productCategory,
    productSlug: input.productSlug ?? null,
    notes: input.notes ?? null,
  });
}
