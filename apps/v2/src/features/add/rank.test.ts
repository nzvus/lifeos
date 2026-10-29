import { describe, expect, it } from "vitest";
import { groupKinds, nearNow, rankAdd, type AddCandidate } from "./rank";

const c = (
  key: string,
  reason: AddCandidate["reason"],
  weight = 0,
  fam = "food",
): AddCandidate => ({
  key,
  reason,
  weight,
  entry: { fam, title: key },
  act: { type: "open", href: "/" + key },
});

describe("rankAdd (capture.md §5, §8)", () => {
  it("planned first (closest to now), then usual, routines, kinds, recent; at most 8", () => {
    const now = 13 * 60;
    const rows = rankAdd([
      c("acqua", "kind", 5),
      c("pranzo", "usual", 20),
      c("cena", "planned", nearNow(20 * 60, now)),
      c("spuntino", "planned", nearNow(13 * 60 + 30, now)),
      c("push", "routine", 12),
      ...Array.from({ length: 6 }, (_, i) => c("r" + i, "recent", i)),
    ]);
    expect(rows.map((r) => r.key)).toEqual([
      "spuntino",
      "cena",
      "pranzo",
      "push",
      "acqua",
      "r5",
      "r4",
      "r3",
    ]);
  });
  it("one thing once: the strongest reason wins", () => {
    const rows = rankAdd([c("pranzo", "recent", 9), c("pranzo", "usual", 3)]);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.reason).toBe("usual");
  });
});

describe("groupKinds", () => {
  it("by family, the person's own kinds last", () => {
    const g = groupKinds([
      { entry: { fam: "body", title: "Peso" } },
      { entry: { fam: "food", title: "Pasto" } },
      { entry: { fam: "custom", title: "Mal di testa" } },
    ]);
    expect(g.map((x) => x.name)).toEqual(["Cibo", "Corpo", "I tuoi"]);
  });
});
