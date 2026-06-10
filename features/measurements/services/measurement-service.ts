import type {
  MeasurementRequestRow,
  MeasurementStatus,
} from "@/lib/db/schema";
import { rateLimit } from "@/lib/cache/redis";
import { createMeasurementRequestSchema } from "../schema";
import * as repo from "../repositories/measurement-repository";

export class MeasurementRateLimitError extends Error {
  constructor() {
    super("Too many requests — please try again in a little while.");
  }
}

export async function submitMeasurementRequest(
  raw: unknown,
  clientIp: string,
): Promise<MeasurementRequestRow> {
  const input = createMeasurementRequestSchema.parse(raw);

  const allowed = await rateLimit(`measure:${clientIp}`, 3, 60 * 60);
  if (!allowed) throw new MeasurementRateLimitError();

  return repo.insert({
    name: input.name,
    phone: input.phone,
    pincode: input.pincode,
    area: input.area || null,
    preferredSlot: input.preferredSlot || null,
    note: input.note || null,
  });
}

export async function adminListMeasurementRequests(
  status?: MeasurementStatus,
): Promise<MeasurementRequestRow[]> {
  return repo.findAll(status);
}

export async function adminSetMeasurementStatus(
  id: string,
  status: MeasurementStatus,
): Promise<MeasurementRequestRow | null> {
  return repo.setStatus(id, status);
}
