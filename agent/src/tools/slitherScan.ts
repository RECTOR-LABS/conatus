import { execFile } from "node:child_process";
import { mkdtemp, writeFile, readFile, rm, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import type { Finding, Severity, Confidence, ToolRunStatus } from "../schema";

const execFileAsync = promisify(execFile);

const DEFAULT_SLITHER_BIN = process.env.SLITHER_BIN ?? "slither";
const DEFAULT_TIMEOUT_MS = 120_000;

/** Slither impact → our severity. Slither has no "critical"; the LLM synthesis layer may escalate. */
const IMPACT_TO_SEVERITY: Record<string, Severity> = {
  High: "high",
  Medium: "medium",
  Low: "low",
  Informational: "informational",
  Optimization: "optimization",
};

const CONFIDENCE_MAP: Record<string, Confidence> = {
  High: "high",
  Medium: "medium",
  Low: "low",
};

export interface SlitherResult {
  status: ToolRunStatus;
  findings: Finding[];
  error?: string;
}

export interface SlitherOptions {
  contractName?: string;
  slitherBin?: string;
  timeoutMs?: number;
}

/** Sanitize an arbitrary contract name into a safe Solidity filename. */
function safeName(name?: string): string {
  const cleaned = (name ?? "Target").replace(/[^A-Za-z0-9_]/g, "");
  return /^[A-Za-z_]/.test(cleaned) ? cleaned : `C${cleaned || "Target"}`;
}

interface SlitherElement {
  source_mapping?: {
    filename_relative?: string;
    filename_short?: string;
    lines?: number[];
  };
}
interface SlitherDetector {
  check: string;
  impact: string;
  confidence: string;
  description?: string;
  elements?: SlitherElement[];
}

function mapDetector(d: SlitherDetector, idx: number): Finding {
  const severity = IMPACT_TO_SEVERITY[d.impact] ?? "informational";
  const confidence = CONFIDENCE_MAP[d.confidence];
  const sm = d.elements?.[0]?.source_mapping;
  const lines = sm?.lines ?? [];
  const location =
    sm && (sm.filename_relative || lines.length)
      ? {
          file: sm.filename_relative ?? sm.filename_short,
          startLine: lines.length ? Math.min(...lines) : undefined,
          endLine: lines.length ? Math.max(...lines) : undefined,
        }
      : undefined;
  const description = (d.description ?? "").trim();
  const title = description.split("\n")[0]?.slice(0, 140) || d.check;
  return {
    id: `slither-${d.check}-${idx}`,
    title,
    severity,
    ...(confidence ? { confidence } : {}),
    source: "slither",
    check: d.check,
    ...(location ? { location } : {}),
    description: description || `Slither detector: ${d.check}`,
  };
}

/**
 * Run Slither on a single Solidity source string.
 * The source is dropped into a throwaway Foundry workspace so `forge` resolves the right solc
 * for the contract's pragma automatically. Multi-file imports are out of MVP scope — an unresolved
 * import surfaces as a structured `error`, never a fabricated clean pass.
 */
export async function runSlither(source: string, opts: SlitherOptions = {}): Promise<SlitherResult> {
  const bin = opts.slitherBin ?? DEFAULT_SLITHER_BIN;
  const timeout = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const name = safeName(opts.contractName);
  let dir: string | undefined;
  try {
    dir = await mkdtemp(join(tmpdir(), "conatus-slither-"));
    await mkdir(join(dir, "src"));
    await writeFile(
      join(dir, "foundry.toml"),
      '[profile.default]\nsrc = "src"\nout = "out"\nlibs = []\nevm_version = "paris"\n',
    );
    await writeFile(join(dir, "src", `${name}.sol`), source);
    const outPath = join(dir, "slither.json");

    // Slither exits non-zero when it FINDS issues, not just on error — so we ignore the exit code
    // here and judge success by whether it produced a parseable JSON report.
    let execErr: (Error & { code?: string; killed?: boolean; stderr?: string }) | undefined;
    try {
      await execFileAsync(bin, [".", "--json", outPath], {
        cwd: dir,
        timeout,
        maxBuffer: 64 * 1024 * 1024,
      });
    } catch (e) {
      execErr = e as typeof execErr;
    }

    let raw: { success?: boolean; error?: unknown; results?: { detectors?: SlitherDetector[] } };
    try {
      raw = JSON.parse(await readFile(outPath, "utf8"));
    } catch {
      const detail =
        execErr?.code === "ENOENT"
          ? `slither binary not found at "${bin}" (is the venv on PATH?)`
          : execErr?.killed
            ? `slither timed out after ${timeout}ms`
            : execErr?.stderr
              ? String(execErr.stderr).trim().slice(-400)
              : "compilation likely failed (unresolved import or unsupported pragma)";
      return { status: "error", findings: [], error: `Slither produced no report: ${detail}` };
    }

    if (!raw.success) {
      return {
        status: "error",
        findings: [],
        error: typeof raw.error === "string" ? raw.error : "Slither analysis reported failure.",
      };
    }

    const detectors = raw.results?.detectors ?? [];
    return { status: "ok", findings: detectors.map(mapDetector) };
  } catch (e) {
    return { status: "error", findings: [], error: e instanceof Error ? e.message : String(e) };
  } finally {
    if (dir) await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
