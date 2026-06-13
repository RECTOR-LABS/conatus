import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExampleChips } from "@/components/ExampleChips";
import { EXAMPLES } from "@/lib/examples";

afterEach(() => {
  vi.restoreAllMocks();
});

const chip = (name: string) => screen.getByRole("button", { name: new RegExp(`copy ${name}`, "i") });

// userEvent.setup() installs its own navigator.clipboard, so define our spy AFTER it.
function mockClipboard() {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
  return writeText;
}

describe("ExampleChips", () => {
  it("renders a chip per example", () => {
    render(<ExampleChips />);
    for (const ex of EXAMPLES) {
      expect(chip(ex.name)).toBeInTheDocument();
    }
  });

  it("copies the source and signals success + onPick on click", async () => {
    const user = userEvent.setup();
    const writeText = mockClipboard();
    const onPick = vi.fn();
    render(<ExampleChips onPick={onPick} />);
    const vault = EXAMPLES[0];
    await user.click(chip(vault.name));
    await waitFor(() => expect(chip(vault.name)).toHaveTextContent(/copied/i));
    expect(writeText).toHaveBeenCalledWith(vault.source);
    expect(onPick).toHaveBeenCalledWith(vault);
  });

  it("clears the copied state after the timeout", async () => {
    const user = userEvent.setup();
    mockClipboard();
    render(<ExampleChips />);
    const vault = EXAMPLES[0];
    await user.click(chip(vault.name));
    await waitFor(() => expect(chip(vault.name)).toHaveTextContent(/copied/i));
    await waitFor(() => expect(chip(vault.name)).toHaveTextContent(vault.descriptor), { timeout: 2500 });
  });
});
