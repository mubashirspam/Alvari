import { db } from "@/lib/db";
import { enquiries, type EnquiryRow, type NewEnquiryRow } from "@/lib/db/schema";

export async function insertEnquiry(input: NewEnquiryRow): Promise<EnquiryRow> {
  const [row] = await db.insert(enquiries).values(input).returning();
  return row;
}
