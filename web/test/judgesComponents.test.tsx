import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Footnote } from "@/app/judges/_components/Footnote";
import { References } from "@/app/judges/_components/References";
import { RubricCalculator } from "@/app/judges/_components/RubricCalculator";
import { FOOTNOTES } from "@/app/judges/_data";

describe("Footnote", () => {
  it("renders a superscript anchor to the matching reference id", () => {
    const id = FOOTNOTES[0].id;
    render(<p>claim<Footnote id={id} /></p>);
    const link = screen.getByRole("link", { name: /reference 1/i });
    expect(link).toHaveAttribute("href", `#ref-${id}`);
    expect(link.textContent).toContain("1");
  });
});

describe("References", () => {
  it("renders one anchored, external entry per footnote", () => {
    render(<References />);
    for (const f of FOOTNOTES) {
      const entry = document.getElementById(`ref-${f.id}`);
      expect(entry).not.toBeNull();
    }
    const links = screen.getAllByRole("link");
    const external = links.filter((l) => l.getAttribute("target") === "_blank");
    expect(external.length).toBeGreaterThanOrEqual(FOOTNOTES.length);
    external.forEach((l) => expect(l).toHaveAttribute("rel", expect.stringContaining("noopener")));
  });
});

describe("RubricCalculator", () => {
  it("starts at the demo score of 60 and recomputes when a finding is toggled off", async () => {
    const user = userEvent.setup();
    render(<RubricCalculator />);
    expect(screen.getByTestId("rubric-score").textContent).toContain("60");
    // Toggle the critical reentrancy off -> score drops to 0.
    await user.click(screen.getByRole("switch", { name: /reentrancy/i }));
    expect(screen.getByTestId("rubric-score").textContent).toBe("0/100");
  });
});
