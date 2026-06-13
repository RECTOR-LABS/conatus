import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SourceForm } from "@/components/SourceForm";

beforeEach(() => {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
  });
});
afterEach(() => {
  vi.restoreAllMocks();
});

function solFile(name: string, contents: string) {
  return new File([contents], name, { type: "text/plain" });
}

describe("SourceForm", () => {
  it("submits the typed source, name, and anchor flag (regression)", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SourceForm onSubmit={onSubmit} disabled={false} />);
    // NB: userEvent treats { and [ as special key descriptors — keep typed source brace-free.
    await user.type(screen.getByLabelText("Solidity source"), "contract X");
    await user.click(screen.getByRole("button", { name: /run audit/i }));
    expect(onSubmit).toHaveBeenCalledWith({ source: "contract X", contractName: "Target", anchor: true });
  });

  it("fills the box and contract name from a picked .sol file", async () => {
    const user = userEvent.setup();
    render(<SourceForm onSubmit={vi.fn()} disabled={false} />);
    await user.upload(screen.getByLabelText(/upload a .sol contract file/i), solFile("MyToken.sol", "contract MyToken {}"));
    expect(await screen.findByDisplayValue("contract MyToken {}")).toBeInTheDocument();
    expect(screen.getByLabelText("Contract name")).toHaveValue("MyToken");
  });

  it("rejects a non-.sol file", async () => {
    const user = userEvent.setup();
    render(<SourceForm onSubmit={vi.fn()} disabled={false} />);
    await user.upload(screen.getByLabelText(/upload a .sol contract file/i), solFile("notes.txt", "hello"));
    expect(await screen.findByText(/only single-file \.sol contracts/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Solidity source")).toHaveValue("");
  });

  it("rejects an oversize file", async () => {
    const user = userEvent.setup();
    render(<SourceForm onSubmit={vi.fn()} disabled={false} />);
    await user.upload(screen.getByLabelText(/upload a .sol contract file/i), solFile("Big.sol", "a".repeat(100_001)));
    expect(await screen.findByText(/exceeds/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Solidity source")).toHaveValue("");
  });

  it("highlights on drag-over and clears on drag-leave", () => {
    render(<SourceForm onSubmit={vi.fn()} disabled={false} />);
    const box = screen.getByLabelText("Solidity source");
    fireEvent.dragOver(box);
    expect(screen.getByText(/drop to load/i)).toBeInTheDocument();
    fireEvent.dragLeave(box);
    expect(screen.queryByText(/drop to load/i)).not.toBeInTheDocument();
  });

  it("loads a dropped .sol file", async () => {
    render(<SourceForm onSubmit={vi.fn()} disabled={false} />);
    const box = screen.getByLabelText("Solidity source");
    fireEvent.drop(box, {
      dataTransfer: { files: [solFile("Dropped.sol", "contract Dropped {}")] } as unknown as DataTransfer,
    });
    expect(await screen.findByDisplayValue("contract Dropped {}")).toBeInTheDocument();
  });

  it("renders the example chips", () => {
    render(<SourceForm onSubmit={vi.fn()} disabled={false} />);
    expect(screen.getByRole("button", { name: /copy vault/i })).toBeInTheDocument();
  });
});
