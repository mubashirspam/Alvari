import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  measurementRequests,
  type MeasurementRequestRow,
  type MeasurementStatus,
  type NewMeasurementRequestRow,
} from "@/lib/db/schema";

export async function insert(
  data: NewMeasurementRequestRow,
): Promise<MeasurementRequestRow> {
  const [row] = await db.insert(measurementRequests).values(data).returning();
  return row;
}

export async function findAll(
  status?: MeasurementStatus,
): Promise<MeasurementRequestRow[]> {
  return db
    .select()
    .from(measurementRequests)
    .where(status ? eq(measurementRequests.status, status) : undefined)
    .orderBy(desc(measurementRequests.createdAt));
}

export async function setStatus(
  id: string,
  status: MeasurementStatus,
): Promise<MeasurementRequestRow | null> {
  const [row] = await db
    .update(measurementRequests)
    .set({ status, updatedAt: new Date() })
    .where(eq(measurementRequests.id, id))
    .returning();
  return row ?? null;
}
