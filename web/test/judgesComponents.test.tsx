import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Footnote } from "@/app/judges/_components/Footnote";
import { RatingAnatomy } from "@/app/judges/_components/RatingAnatomy";
import { References } from "@/app/judges/_components/References";
import { RubricCalculator } from "@/app/judges/_components/RubricCalculator";
import { RunItAgain } from "@/app/judges/_components/RunItAgain";
import { SelfRatingSim } from "@/app/judges/_components/SelfRatingSim";
import { FOOTNOTES, MAINNET, RATED_TARGET } from "@/app/judges/_data";
import { shortAddr } from "@/lib/constants";

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

describe("RunItAgain", () => {
  it("keeps the score locked at 60 across many re-runs while the run count climbs", async () => {
    const user = userEvent.setup();
    render(<RunItAgain />);
    const btn = screen.getByRole("button", { name: /re-run audit/i });
    for (let i = 0; i < 6; i++) {
      await user.click(btn);
      expect(screen.getByTestId("run-score").textContent).toContain("60");
    }
    expect(screen.getByTestId("run-count").textContent).toContain("7"); // 1 initial + 6 clicks
  });
});

describe("SelfRatingSim", () => {
  it("reverts when the agent tries to rate itself, succeeds from a third-party wallet", async () => {
    const user = userEvent.setup();
    render(<SelfRatingSim />);
    await user.click(screen.getByRole("button", { name: /rate as the agent/i }));
    expect(screen.getByTestId("sim-result").textContent).toMatch(/MUST NOT be the agent owner/i);
    await user.click(screen.getByRole("button", { name: /rate as a third-party/i }));
    expect(screen.getByTestId("sim-result").textContent).toContain(shortAddr(MAINNET.rater));
  });
});

describe("RatingAnatomy", () => {
  it("shows the three real dimension values and binds tag2 to the rated targetHash", async () => {
    const user = userEvent.setup();
    render(<RatingAnatomy />);
    expect(screen.getByText("90")).toBeInTheDocument();
    expect(screen.getByText("85")).toBeInTheDocument();
    expect(screen.getByText("88")).toBeInTheDocument();
    // select a different field first so the click is a real state transition
    await user.click(screen.getByRole("button", { name: /agentId/i }));
    expect(screen.getByTestId("field-explainer").textContent).toContain(`#${MAINNET.agentId}`);
    // then tag2 — assert the rendered value is the actual RATED_TARGET, not just prose
    await user.click(screen.getByRole("button", { name: /tag2/i }));
    expect(screen.getByTestId("field-explainer").textContent).toContain(RATED_TARGET.slice(0, 12));
  });
});
