import { handleCallback } from "@vercel/queue";
import { jobStore } from "@/lib/jobStore";
import { runConsumer, type AuditMessage, type WorkerResult } from "@/lib/auditConsumer";

/**
 * Vercel Queues consumer for the `audits` topic. Marks the job running, calls the
 * container worker's POST /run-audit, records done/error in Redis.
 *
 * TRIGGER WIRING (Task 10 / Task 1 spike): register
 *   { type: "queue/v2beta", topic: "audits" }
 * as an experimentalTrigger for this route — inside the `web` service's `functions`
 * block in vercel.json (top-level `functions` is invalid when `services` is present).
 * If push-mode can't target a service route, switch to poll mode (PollingQueueClient).
 */
export const POST = handleCallback<AuditMessage>(async (message) => {
  const store = jobStore();
  await runConsumer(message, {
    setStage: (id, status, patch) => store.setStage(id, status, patch),
    runAudit: async (payload) => {
      const res = await fetch(`${process.env.WORKER_URL}/run-audit`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-token": process.env.CONATUS_API_TOKEN ?? "" },
        body: JSON.stringify(payload),
        cache: "no-store",
      }).catch(() => null);
      if (!res) return { ok: false, status: 502 };
      if (!res.ok) return { ok: false, status: res.status };
      return { ok: true, status: res.status, result: (await res.json()) as WorkerResult };
    },
  });
});
