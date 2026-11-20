// VIS-05, VIS-105 (his 20 Nov, §131): buttons and chips drawn smaller, touched over 44 (PRD-12).
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const css = fs.readFileSync(
  path.resolve(import.meta.dirname, "../styles/kit.css"),
  "utf8",
);

describe("controls drawn small, touched at 44 (VIS-05, VIS-105)", () => {
  it("drawn 40 and 32 with 14 px words", () => {
    expect(css).toMatch(/--ctl-h:\s*40px/);
    expect(css).toMatch(/--ctl-dense:\s*32px/);
    expect(css).toMatch(/--ctl-fs:\s*var\(--fs-b2\)/);
  });

  it("every button and chip keeps a strip up to --touch", () => {
    expect(css).toMatch(
      /:is\(\.k-btn, \.k-chip\)::before\s*\{[^}]*position:\s*absolute;[^}]*var\(--touch\)/,
    );
  });
});
