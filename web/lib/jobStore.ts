import { randomUUID } from "node:crypto";
import { Redis } from "@upstash/redis";
import type { AuditJobResponse, JobStatus } from "@/lib/types";

/** A tracked audit job — mirrors AuditJobResponse (exactly what the frontend polls). */
export type Job = AuditJobResponse;

const TTL_S = 60 * 60; // jobs expire ~1h (replaces the old in-memory lazy GC)
const key = (id: string): string => `job:${id}`;

/** Only the Redis methods the store uses — lets tests inject a fake. */
type RedisLike = Pick<Redis, "set" | "get" | "expire">;

export function makeJobStore(redis: RedisLike) {
  return {
    async createJob(input: { contractName: string; anchor: boolean }): Promise<{ id: string }> {
      const id = randomUUID();
      const job: Job = { id, status: "queued", contractName: input.contractName, anchor: input.anchor, createdAt: Date.now() };
      await redis.set(key(id), job, { ex: TTL_S });
      return { id };
    },
    async getJob(id: string): Promise<Job | null> {
      return (await redis.get<Job>(key(id))) ?? null;
    },
    /** Advance a job's stage and merge an optional partial (report/anchorResult/error). No-op if the job is gone. */
    async setStage(id: string, status: JobStatus, patch: Partial<Job> = {}): Promise<void> {
      const cur = await redis.get<Job>(key(id));
      if (!cur) return;
      await redis.set(key(id), { ...cur, ...patch, status }, { ex: TTL_S });
    },
  };
}

/** Production store bound to the Upstash env vars (UPSTASH_REDIS_REST_URL / _TOKEN). */
export const jobStore = () => makeJobStore(Redis.fromEnv());
