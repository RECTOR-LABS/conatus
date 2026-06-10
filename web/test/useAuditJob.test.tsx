import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useAuditJob } from "@/hooks/useAuditJob";
import * as api from "@/lib/api";

vi.mock("@/lib/api");

describe("useAuditJob", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("polls until done and exposes the job", async () => {
    const seq = [
      { id: "j1", status: "slither" },
      { id: "j1", status: "synthesis" },
      { id: "j1", status: "done", report: { riskScore: 87 } },
    ];
    let i = 0;
    vi.mocked(api.getAudit).mockImplementation(async () => seq[Math.min(i++, seq.length - 1)] as never);
    const { result } = renderHook(() => useAuditJob("j1", { intervalMs: 10 }));
    await waitFor(() => expect(result.current.job?.status).toBe("done"));
    expect(result.current.error).toBeNull();
  });

  it("flags an error after 3 consecutive fetch failures", async () => {
    vi.mocked(api.getAudit).mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useAuditJob("j1", { intervalMs: 5 }));
    await waitFor(() => expect(result.current.error).toMatch(/unreachable/i));
  });

  it("does nothing for a null id", () => {
    const { result } = renderHook(() => useAuditJob(null));
    expect(result.current.job).toBeNull();
    expect(vi.mocked(api.getAudit)).not.toHaveBeenCalled();
  });
});
