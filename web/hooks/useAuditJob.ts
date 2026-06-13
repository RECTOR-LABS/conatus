"use client";

import { useEffect, useRef, useState } from "react";
import { getAudit } from "@/lib/api";
import type { AuditJobResponse } from "@/lib/types";

const TERMINAL = new Set(["done", "error"]);

export function useAuditJob(id: string | null, opts: { intervalMs?: number } = {}) {
  const intervalMs = opts.intervalMs ?? 2000;
  const [job, setJob] = useState<AuditJobResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const failures = useRef(0);

  // Reset state when the polled id changes — done during render (not inside the
  // effect) per React's "adjusting state on a prop change" pattern.
  const [trackedId, setTrackedId] = useState(id);
  if (id !== trackedId) {
    setTrackedId(id);
    setJob(null);
    setError(null);
  }

  useEffect(() => {
    if (!id) return;
    failures.current = 0;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async (): Promise<void> => {
      try {
        const next = await getAudit(id);
        if (stopped) return;
        failures.current = 0;
        setJob(next);
        if (TERMINAL.has(next.status)) return;
      } catch (e) {
        if (stopped) return;
        failures.current += 1;
        if (failures.current >= 3) {
          setError(`Audit service unreachable: ${e instanceof Error ? e.message : String(e)}`);
          return;
        }
      }
      timer = setTimeout(tick, intervalMs);
    };
    void tick();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [id, intervalMs]);

  return { job, error };
}
