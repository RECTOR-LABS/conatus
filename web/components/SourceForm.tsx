"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

const MAX_CHARS = 100_000;

export function SourceForm({
  onSubmit,
  disabled,
}: {
  onSubmit(input: { source: string; contractName: string; anchor: boolean }): void;
  disabled: boolean;
}) {
  const [source, setSource] = useState("");
  const [name, setName] = useState("Target");
  const [anchor, setAnchor] = useState(true);
  const tooLong = source.length > MAX_CHARS;

  return (
    <form
      className="space-y-3 reveal reveal-1"
      onSubmit={(e) => {
        e.preventDefault();
        if (!source.trim() || tooLong) return;
        onSubmit({ source, contractName: name.trim() || "Target", anchor });
      }}
    >
      <p className="section-tag">01 / submit</p>
      <Textarea
        value={source}
        onChange={(e) => setSource(e.target.value)}
        placeholder={"// Paste a single-file Solidity contract\npragma solidity ^0.8.20;\n\ncontract Target { … }"}
        className="min-h-64 rounded-sm border-border/70 bg-card/60 font-mono text-[13px] leading-relaxed"
        aria-label="Solidity source"
        spellCheck={false}
      />
      <div className="flex flex-wrap items-center gap-4">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-44 rounded-sm border-border/70 bg-card/60 font-mono text-sm"
          aria-label="Contract name"
        />
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={anchor}
            onChange={(e) => setAnchor(e.target.checked)}
            className="h-4 w-4 accent-[oklch(0.88_0.13_172)]"
          />
          Anchor verdict on-chain
        </label>
        <Button type="submit" disabled={disabled || !source.trim() || tooLong} className="rounded-sm font-semibold">
          {disabled ? "Auditing…" : "Run audit"}
        </Button>
      </div>
      {tooLong && <p className="text-sm text-red-400">Source exceeds {MAX_CHARS.toLocaleString()} characters.</p>}
    </form>
  );
}
