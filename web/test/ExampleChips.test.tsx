import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExampleChips } from "@/components/ExampleChips";
import { EXAMPLES } from "@/lib/examples";

describe("ExampleChips", () => {
  it("renders a chip per example", () => {
    render(<ExampleChips onLoad={vi.fn()} />);
    for (const ex of EXAMPLES) {
      expect(screen.getByRole("button", { name: new RegExp(`load ${ex.name}`, "i") })).toBeInTheDocument();
    }
  });

  it("calls onLoad with the clicked example", async () => {
    const user = userEvent.setup();
    const onLoad = vi.fn();
    render(<ExampleChips onLoad={onLoad} />);
    await user.click(screen.getByRole("button", { name: /load vault/i }));
    expect(onLoad).toHaveBeenCalledWith(EXAMPLES[0]);
  });
});
