import { describe, expect, it } from "vitest";
import { quality } from "@/core/engines/quality";
import { qualityBox } from "./quality";

describe("«Qualità dei dati» in words", () => {
  it("days with it, the missing ones, a unit slip with its entry", () => {
    const report = quality({
      entries: [
        { id: "a", day: "2026-10-20", value: 75.6 },
        { id: "b", day: "2026-10-21", value: 756 },
        { id: "c", day: "2026-10-23", value: 75.4 },
      ],
      window: { from: "2026-10-20", to: "2026-10-23" },
      expected: () => true,
      range: { min: 30, max: 250 },
    });
    const b = qualityBox({
      fam: "body",
      title: "Pesate",
      days: 4,
      report,
      show: (v) => v + " kg",
      dayOf: (id) => ({ a: "2026-10-20", b: "2026-10-21", c: "2026-10-23" })[id] ?? null,
    });
    expect(b.entry.value).toBe("3/4");
    expect(b.lines.map((l) => l.text)).toEqual([
      "Mancano 1 giorno: 22 ott",
      "Valore fuori misura il 21 ott: 756 kg",
      "Salto strano il 21 ott: da 75.6 kg a 756 kg (forse l’unità sbagliata)",
      "Salto strano il 23 ott: da 756 kg a 75.4 kg (forse l’unità sbagliata)",
    ]);
    expect(b.lines[1]!.href).toBe("/voce/b");
  });
});
