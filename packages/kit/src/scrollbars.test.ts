// VIS-06 (his 20 Nov, proposal §128): no scrollbars on a phone; with a mouse only the sideways rows.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const css = fs.readFileSync(
  path.resolve(import.meta.dirname, "../styles/kit.css"),
  "utf8",
);
const fine = css.slice(css.lastIndexOf("@media (pointer: fine)"));

describe("scrollbars (VIS-06)", () => {
  it("every scrollbar is hidden by default", () => {
    expect(css).toMatch(/\*\s*\{\s*scrollbar-width:\s*none;\s*\}/);
  });

  it("a thin one only for the sideways rows, only with a mouse", () => {
    expect(fine).toMatch(/\.k-doors,[\s\S]*scrollbar-width:\s*thin/);
    const before = css.slice(0, css.lastIndexOf("@media (pointer: fine)"));
    expect(before).not.toMatch(/scrollbar-width:\s*(thin|auto)/);
  });
});
