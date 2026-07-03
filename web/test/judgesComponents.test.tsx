import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footnote } from "@/app/judges/_components/Footnote";
import { References } from "@/app/judges/_components/References";
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
