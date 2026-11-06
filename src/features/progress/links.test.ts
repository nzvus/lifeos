import { describe, expect, it } from "vitest";
import { links, type Measure } from "./links";

const days = (n: number, f: (i: number) => number) =>
  new Map(
    Array.from({ length: n }, (_, i) => [
      `2026-09-${String(i + 1).padStart(2, "0")}`,
      f(i),
    ]),
  );

describe("«Legami» (E8)", () => {
  it("says how many paired days a pair has until 21", () => {
    const m: Measure[] = [
      { key: "sleepH", words: "ore di sonno", byDay: days(14, (i) => 7 + (i % 3)) },
      { key: "energy", words: "energia", byDay: days(14, (i) => 2 + (i % 3)) },
    ];
    const r = links(m);
    expect(r[0]).toMatchObject({ ready: false, have: 14, need: 21 });
  });

  it("a strong pair in words, with its interval", () => {
    const m: Measure[] = [
      { key: "sleepH", words: "ore di sonno", byDay: days(28, (i) => 6 + (i % 7) * 0.5) },
      { key: "energy", words: "energia", byDay: days(28, (i) => 1 + (i % 7) * 0.6) },
    ];
    const r = links(m)[0]!;
    expect(r.ready).toBe(true);
    if (r.ready) {
      expect(r.c.rho).toBeGreaterThan(0.9);
      expect(r.says).toBe("Ore di sonno e energia vanno insieme, molto.");
    }
  });
});
