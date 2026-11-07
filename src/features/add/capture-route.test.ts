// PAT-60 (Q-12 «a», 7 Nov): ⊕ opens its sheet over the page he is on — `/aggiungi` intercepted
// in the `(app)/@capture` slot — and any other address closes it.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const APP = path.resolve(import.meta.dirname, "../../app/(app)");
const read = (p: string) => fs.readFileSync(path.join(APP, p), "utf8");

describe("⊕ over the page (PAT-60)", () => {
  it("the slot intercepts /aggiungi with the same page, and is empty elsewhere", () => {
    expect(read("@capture/(.)aggiungi/page.tsx")).toContain(
      'export { default } from "../../aggiungi/page"',
    );
    expect(read("@capture/default.tsx")).toContain("return null");
    expect(read("@capture/[...rest]/page.tsx")).toContain("return null");
  });
  it("the layout draws the slot and ⊕ is the app's link", () => {
    expect(read("layout.tsx")).toContain("{capture}");
    expect(
      fs.readFileSync(path.resolve(import.meta.dirname, "../shell/AppNav.tsx"), "utf8"),
    ).toMatch(/link=\{Link\}/);
  });
});
