"use client";

import { useRef, useState, type DragEvent } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ExampleChips } from "@/components/ExampleChips";
import { MAX_SOURCE_CHARS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Example } from "@/lib/examples";

function deriveName(filename: string): string {
  const base = filename.split(/[/\\]/).pop() ?? filename;
  const cleaned = base.replace(/\.sol$/i, "").replace(/[^A-Za-z0-9_]/g, "");
  return cleaned || "Target";
}

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
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tooLong = source.length > MAX_SOURCE_CHARS;

  async function loadFile(file: File): Promise<void> {
    setFileError(null);
    if (!/\.sol$/i.test(file.name)) {
      setFileError("Only single-file .sol contracts are supported.");
      return;
    }
    let text: string;
    try {
      text = await file.text();
    } catch {
      setFileError("Couldn’t read that file. Try pasting the source instead.");
      return;
    }
    if (!text.trim()) {
      setFileError("That file is empty.");
      return;
    }
    if (text.length > MAX_SOURCE_CHARS) {
      setFileError(`Source exceeds ${MAX_SOURCE_CHARS.toLocaleString()} characters.`);
      return;
    }
    setSource(text);
    setName(deriveName(file.name));
  }

  function handleDrop(e: DragEvent<HTMLTextAreaElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void loadFile(file);
  }

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

      <div className="relative">
        <Textarea
          value={source}
          onChange={(e) => setSource(e.target.value)}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          placeholder={"// Paste, or drag a .sol file here\npragma solidity ^0.8.20;\n\ncontract Target { … }"}
          className={cn(
            "min-h-64 rounded-sm border-border/70 bg-card/60 font-mono text-[13px] leading-relaxed transition-colors",
            dragging && "border-primary ring-3 ring-primary/30"
          )}
          aria-label="Solidity source"
          spellCheck={false}
        />
        {dragging && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-sm bg-card/80 font-mono text-sm text-primary">
            <Upload className="mr-2 size-4" /> Drop to load your .sol file
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ExampleChips onPick={(ex: Example) => setName(ex.name)} />
        <Button
          type="button"
          variant="outline"
          size="xs"
          className="rounded-full font-mono"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="size-3" /> pick a file
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".sol,text/plain"
          aria-label="Upload a .sol contract file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void loadFile(file);
            e.target.value = "";
          }}
        />
      </div>

      {fileError && <p className="text-sm text-red-400">{fileError}</p>}

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
      {tooLong && <p className="text-sm text-red-400">Source exceeds {MAX_SOURCE_CHARS.toLocaleString()} characters.</p>}
    </form>
  );
}
