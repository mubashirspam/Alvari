import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";

let client: Redis | null = null;

function getClient(): Redis | null {
  if (client) return client;
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  client = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
  return client;
}

export async function cached<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  const redis = getClient();
  if (!redis) return loader();

  try {
    const hit = await redis.get<T>(key);
    if (hit !== null && hit !== undefined) return hit;
  } catch {
    return loader();
  }

  const fresh = await loader();

  try {
    await redis.set(key, fresh, { ex: ttlSeconds });
  } catch {
    // Cache write failure shouldn't break the request.
  }

  return fresh;
}

export async function invalidate(...keys: string[]): Promise<void> {
  const redis = getClient();
  if (!redis || keys.length === 0) return;
  try {
    await redis.del(...keys);
  } catch {
    // No-op on failure.
  }
}
