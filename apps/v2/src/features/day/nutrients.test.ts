import { F } from "@lifeos/kit";
import { describe, expect, it } from "vitest";
import type { Day, DayItem, FoodTargets } from "@/core/day";
import { kindRegistry } from "@/core/kinds";
import { microTargets } from "@/core/engines/targets";
import { mealL0, microsOf, presentDay } from "./nutrients";

const reg = kindRegistry();
const item = (kind: string, over: Partial<DayItem> = {}): DayItem => ({
  id: "x",
  kind: reg.get(kind),
  family: reg.get(kind).family,
  subcategory: null,
  status: "done",
  start: null,
  end: null,
  minute: null,
  item: null,
  values: {},
  lines: [],
  children: [],
  sets: [],
  money: null,
  fulfils: null,
  tags: [],
  source: "import",
  confidence: "1",
  note: "",
  ...over,
});
const line = (name: string, quantity: string, values: Record<string, string>) => ({
  id: name,
  name,
  itemId: null,
  productId: null,
  quantity,
  unit: "g",
  values,
});
const day = (timed: DayItem[], untimed: DayItem[] = []): Day => ({
  day: "2026-10-15",
  clock: { timeZone: "Europe/Rome", boundaryMin: 240 },
  timed,
  untimed,
  invalidKinds: [],
});
const week: FoodTargets = {
  from: "week",
  since: "2026-10-10",
  kcal: 2778,
  protein: 154,
  carbs: 367,
  fat: 77,
  fibre: 39,
  sugars: 125,
  saturatedFat: 31,
  salt: 5,
};

describe("the day as a Box with Nutrients L1", () => {
  it("adds the meals, eaten and planned, against the week's targets", () => {
    const d = presentDay(
      day(
        [
          item("meal", {
            values: { servings: "2" },
            lines: [line("Avena", "50", { kcal: "372", protein: "13.5", fibre: "10" })],
          }),
          item("meal", {
            status: "planned",
            lines: [line("Latte", "200", { kcal: "46", protein: "3.4", sugars: "4.8" })],
          }),
          item("water", { values: { ml: "500" } }),
        ],
        [
          item("meal", {
            lines: [
              line("Mela", "150", { kcal: "52", sugars: "10.4", saturatedFat: "0" }),
            ],
          }),
        ],
      ),
      week,
    )!;
    expect(d.entry).toEqual({
      fam: "day",
      title: "Il giorno",
      meta: "obiettivi della settimana dal 10 ott",
    });
    expect(d.nutrients.kcal).toEqual({ v: 450, planned: 92, t: 2778 });
    expect(d.nutrients.macros.map((m) => [m.key, m.v, m.planned, m.t])).toEqual([
      ["protein", 13.5, 6.8, 154],
      ["carbs", 0, 0, 367],
      ["fat", 0, 0, 77],
      ["fiber", 10, 0, 39],
    ]);
    expect(d.nutrients.macros[0]!.sources).toEqual([["Avena", 13.5]]);
    expect(d.nutrients.limits!.map(({ key, v, t }) => ({ key, v, t }))).toEqual([
      { key: "sugars", v: 15.6, t: 125 },
      { key: "sat", v: 0, t: 31 },
      { key: "salt", v: 0, t: 5 },
    ]);
    // Total sugars, not free ones: no zones; the others have theirs.
    expect(d.nutrients.limits![0]!.zones).toBeUndefined();
    expect(d.nutrients.limits![2]!.zones!.map((z) => z.from)).toEqual([0, 5, 7.5, 12.5]);
  });

  it("zones every bar (dossiers/ranges.md): protein per kg of the reference weight", () => {
    const meal = item("meal", {
      lines: [line("Pollo", "500", { kcal: "110", protein: "28.1" })],
    });
    const d = presentDay(day([meal]), week, new Map(), null, 75.6)!;
    const protein = d.nutrients.macros[0]!;
    expect(protein.v).toBeCloseTo(140.5);
    expect(protein.zones!.map((z) => [z.level, Math.round(z.from)])).toEqual([
      ["bad", 0],
      ["fair", 63],
      ["good", 121],
      ["fair", 166],
      ["bad", 227],
    ]);
  });

  it("without targets, the zones scale with what the day holds", () => {
    const meal = item("meal", {
      lines: [line("Pane", "100", { kcal: "270", salt: "1.2" })],
    });
    const d = presentDay(day([meal]), null)!;
    expect(d.nutrients.limits!.map((l) => l.key)).toEqual(["sugars", "sat", "salt"]);
    // Fat 20–35 % of 270 kcal.
    expect(d.nutrients.macros[2]!.zones![2]).toEqual({ from: 6, level: "good" });
  });

  it("leaves out what was left out of the plan, and says when there are no targets", () => {
    const d = presentDay(
      day([
        item("meal", {
          status: "planned",
          values: { leftOut: true },
          lines: [line("Latte", "200", { kcal: "46" })],
        }),
      ]),
      null,
    )!;
    expect(d.entry.meta).toBe("obiettivi non ancora calcolati in v2");
    expect(d.nutrients.kcal).toEqual({ v: 0, planned: 0, t: null });
    // Nothing to scale the limits with.
    expect(d.nutrients.limits).toEqual([]);
  });

  it("splits the eaten macros into kinds when the foods' estimates are given", () => {
    const meal = item("meal", {
      lines: [
        { ...line("Avena", "100", { protein: "13.5", fibre: "10" }), itemId: "oats" },
        line("Mela", "100", { fibre: "2" }),
      ],
    });
    const d = presentDay(
      day([meal]),
      null,
      new Map([
        ["oats", { protein_high: "1", fibre_betaglucan: "4", fibre_insoluble: "6" }],
      ]),
    )!;
    const parts = Object.fromEntries(d.nutrients.macros.map((m) => [m.key, m.parts]));
    expect(parts).toEqual({
      protein: { high: 13.5 },
      carbs: {},
      fat: {},
      fiber: { betaglucan: 4, insoluble: 6, none: 2 },
    });
    expect(presentDay(day([meal]), null)!.nutrients.macros[0]!.parts).toBeUndefined();
  });

  it("is not there on a day with no meals and no targets", () => {
    expect(presentDay(day([item("water")]), null)).toBeNull();
  });
});

describe("the day's vitamins and minerals", () => {
  const targets = microTargets({ sex: "male", age: 30 });

  it("shows only what some food carried, judged against E5's targets", () => {
    const m = microsOf({ ca: 1180, fe: 4, vitD: 9, na: 2600 }, targets);
    expect(m.summary).toBe("1 su 4 coperti · stime");
    expect(
      m.groups.map((g) => [g.name, g.items.map((i) => [i.name, i.t, i.state])]),
    ).toEqual([
      ["Vitamine", [["D", 15, "warn"]]],
      [
        "Minerali",
        [
          ["Calcio", 950, "good"],
          ["Ferro", 11, "bad"],
          ["Sodio", 2000, "bad"],
        ],
      ],
    ]);
  });

  it("says what is missing for the targets", () => {
    const m = microsOf({ k: 3000 }, null);
    expect(m.summary).toBe("stime · per gli obiettivi servono sesso ed età");
    expect(m.groups[0]!.items[0]).toEqual({
      name: "Potassio",
      v: 3000,
      t: null,
      unit: "mg",
    });
  });
});

describe("a meal's thin bars (L0)", () => {
  const oats = line("Avena", "50", {
    kcal: "372",
    protein: "13",
    carbs: "60",
    fat: "7",
    fibre: "10",
  });
  it("what it brought against the day's targets; planned counts what it will bring", () => {
    const done = mealL0(item("meal", { lines: [oats] }), week)!;
    expect(done.macros.map((m) => [m.key, m.v, m.t])).toEqual([
      ["protein", 6.5, 154],
      ["carbs", 30, 367],
      ["fat", 3.5, 77],
      ["fiber", 5, 39],
    ]);
    const planned = mealL0(item("meal", { status: "planned", lines: [oats] }), null)!;
    expect(planned.macros[0]).toMatchObject({ v: 6.5, t: null });
  });

  it("nothing to draw for a coffee, nor for what is not a meal", () => {
    expect(
      mealL0(item("meal", { lines: [line("Caffè", "30", { kcal: "2" })] }), week),
    ).toBeNull();
    expect(mealL0(item("water", {}), week)).toBeNull();
  });

  it("a meal's protein is zoned per kg (ISSN: 0.25 g/kg makes the most of it)", () => {
    const m = mealL0(
      item("meal", { lines: [line("Pollo", "100", { kcal: "110", protein: "23" })] }),
      week,
      new Map(),
      75.6,
    )!;
    expect(m.macros[0]!.zones).toEqual([
      { from: 0, level: "fair" },
      { from: 18.9, level: "good" },
    ]);
    expect(m.macros[1]!.zones).toBeUndefined();
  });

  it("«Altro»: the day's caffeine against 400 mg with its zones, creatine against 3 g", () => {
    const d = presentDay(
      day([
        item("meal", {
          lines: [
            { ...line("Capsula", "7.2", { kcal: "0" }), itemId: "coffee" },
            { ...line("Creatina", "3.4", { kcal: "0" }), itemId: "creatine" },
          ],
        }),
      ]),
      week,
      new Map([
        ["coffee", { caffeine: "1389" }],
        ["creatine", { creatine: "100" }],
      ]),
    )!;
    const altro = d.nutrients.micros!.groups.find((g) => g.name === "Altro")!;
    expect(altro.items.map((i) => [i.name, Math.round(i.v), i.t])).toEqual([
      ["Caffeina", 100, 400],
      ["Creatina", 3, 3],
    ]);
    expect(altro.items[0]!.zones!.map((z) => z.level)).toEqual(["good", "bad", "danger"]);
  });

  it("a meal's leucine, estimated from its protein's quality", () => {
    const m = mealL0(
      item("meal", {
        lines: [
          { ...line("Skyr", "250", { kcal: "63", protein: "11" }), itemId: "skyr" },
        ],
      }),
      week,
      new Map([["skyr", { protein_high: "1" }]]),
      75.6,
    )!;
    // 27.5 g of high-quality protein × 9 % ≈ 2.5 g.
    expect(m.macros[0]!.extras![0]!.t).toBe(
      "leucina " + F.approx(2.475, "g") + " (stima, 2,5 g ideale)",
    );
    expect(m.macros[0]!.extras![0]!.state).toBe("good");
  });
});
