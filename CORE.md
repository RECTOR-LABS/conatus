# CORE — Shared agentic-EVM core

> **Campaign note.** This document is intentionally **duplicated** (verbatim) across three isolated repos — **Conatus** (Mantle), **Conclave** (Base), **Wisp** (Arbitrum) — that share one reusable core. The repos are kept separate by design; this doc is the single source of truth for the shared layer each one builds on. If it changes, update all three copies.

The three projects are different products, but underneath they are the same shape: **an LLM agent that plans, calls tools, and executes transactions on an EVM chain.** Mantle, Base, and Arbitrum are all EVM, so the agent brain and the on-chain plumbing are shared; only the *integrations* (which chain, which SDKs, which wallet/AA provider) differ per repo. The core is those shared pieces, behind three small interfaces.

---

## What the core provides (and what it does NOT)

**Provides:**
1. **Agent runtime** — a provider-agnostic LLM tool-calling + planning loop.
2. **`ExecutionAdapter`** — an interface for reading chain state + building/sending transactions.
3. **`WalletAdapter`** — an interface for signing / account-abstraction (EOA, EIP-7702, AA, gasless).

**Does NOT provide (lives in each repo):** the product UX, the domain tools, the chain-/provider-specific adapter *implementations*, and the contracts. Each repo implements the two interfaces for its own stack and registers its own tools — it does **not** modify the core's interfaces. If a repo needs a method the interface lacks, that's a change to **this** doc (and all three copies), not a local fork.

---

## 1. Agent runtime

A small, deterministic loop — **not** a framework:

```
register tools  →  plan (LLM)  →  call tool(s)  →  observe  →  synthesize / re-plan  →  result
```

Principles (these are the quality bar for every repo):
- **Provider-agnostic.** The LLM provider is chosen by env var (`LLM_API_KEY`, `LLM_MODEL`); no provider hardcoded, no key in the repo.
- **Tools are typed contracts.** Each tool declares a name, a JSON-schema input, and a typed output. Deterministic work (static analysis, queries, on-chain reads) lives in tools; the LLM does planning + synthesis only.
- **No silent failures.** A tool error surfaces as an explicit, structured result the agent must reason about — the agent never fabricates a success when a tool failed.
- **Propose, then act.** Any value-moving tool returns a *proposed* transaction for confirmation (human or policy) rather than auto-sending. (Conatus gates on testnet; Wisp gates on explicit user confirm; Conclave gates payment release on a reviewer agent.)

```ts
interface Tool<I, O> {
  name: string;
  description: string;
  inputSchema: JSONSchema;       // validated before the tool runs
  run(input: I, ctx: AgentContext): Promise<O>;
}

interface AgentRuntime {
  registerTool<I, O>(tool: Tool<I, O>): void;
  run(goal: string, ctx: AgentContext): Promise<AgentResult>;
}
```

## 2. `ExecutionAdapter` — on-chain execution

Abstracts everything chain-specific behind one interface. Each repo ships one implementation:

| Repo | Implementation | Chain |
|------|----------------|-------|
| Conatus | `MantleExecutionAdapter` (viem) | Mantle (5000 / Sepolia 5003) |
| Conclave | `BaseExecutionAdapter` (x402 + viem) | Base (8453 / Sepolia 84532) |
| Wisp | `ParticleUAExecutionAdapter` (Universal Accounts) | Arbitrum (42161 / Sepolia 421614) |

```ts
interface ExecutionAdapter {
  readState(call: ReadCall): Promise<unknown>;        // view/eth_call
  buildTransaction(intent: TxIntent): Promise<UnsignedTx>;
  sendTransaction(tx: UnsignedTx, sig: Signature, authorizations?: Authorization[]): Promise<TxReceipt>;
  explorerUrl(txHashOrAddr: string): string;          // for UIs + proofs
}
```

> `authorizations?` exists so EIP-7702 flows (Wisp) attach their per-userOp authorizations without changing the interface for the others.

## 3. `WalletAdapter` — signing & account abstraction

Abstracts how a transaction gets authorized, so the agent never touches keys or provider SDKs directly:

| Repo | Implementation | Mechanism |
|------|----------------|-----------|
| Conatus | `KeyWalletAdapter` | testnet deployer/agent key (env) |
| Conclave | `X402WalletAdapter` | EIP-3009 off-chain signing for x402 (gasless) |
| Wisp | `MagicEip7702WalletAdapter` (+ ZeroDev/Openfort variants) | social login EOA upgraded via 7702 |

```ts
interface WalletAdapter {
  address(): Promise<string>;
  signMessage(message: string | Uint8Array): Promise<Signature>;     // e.g. UA rootHash
  signAuthorization?(auth: AuthorizationRequest): Promise<Authorization>; // EIP-7702
}
```

---

## Config & secrets (applies to all three repos)

- **All secrets via env vars; never committed.** Each repo ships only `.env.example` (names, no values). `.env*` is gitignored.
- Shared names: `LLM_API_KEY`, `LLM_MODEL`. Chain/provider vars are documented in each repo's `.env.example`.
- Repos are **public** — treat every file as world-readable.

## Build status

This is a **design doc**, not yet a published package. The concrete core is implemented for the first repo that ships, then extracted/duplicated for the others. Until then, each repo may inline a minimal version of the runtime + its own adapter implementations against these interfaces. **Do not let the interfaces drift between repos** without updating all three copies of this file.
