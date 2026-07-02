import { Redis } from "@upstash/redis";

const WINDOW_S = 10 * 60; // 10-minute window
const MAX = 5; // ...max 5 audits per IP (mirrors the old in-memory limiter)

/** Only the Redis methods the limiter uses — lets tests inject a fake. */
type RedisLike = Pick<Redis, "incr" | "expire">;

/**
 * Fixed-window per-IP limiter backed by Redis (works across autoscaled instances,
 * unlike the old in-memory token buckets). First hit in a window sets the TTL.
 */
export function makeRateLimit(redis: RedisLike) {
  return async function allow(ip: string): Promise<boolean> {
    const k = `rl:${ip}`;
    const n = await redis.incr(k);
    if (n === 1) await redis.expire(k, WINDOW_S);
    return n <= MAX;
  };
}

export const rateLimit = () => makeRateLimit(Redis.fromEnv());
