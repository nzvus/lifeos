import { describe, expect, it } from "vitest";
import { nutrientsL1 as rows, shade, type NutrientsData } from "./nutrient-rows";

/** F writes a no-break space between a number and its unit; the cases read plain. */
const nutrientsL1 = (d: NutrientsData) =>
  JSON.parse(JSON.stringify(rows(d)).replace(/\u00a0/g, " ")) as ReturnType<typeof rows>;

describe("Nutrients L1", () => {
  it("draws kcal against the target, the planned part inside the track", () => {
    const { kcal } = nutrientsL1({
      kcal: { v: 1738, planned: 262, t: 2090 },
      macros: [],
    });
    expect(kcal).toMatchObject({
      v: "1.738",
      t: "2.090 kcal",
      left: "+262 kcal previste",
      bar: { w: "83.2%", pw: "12.5%" },
    });
    const over = nutrientsL1({ kcal: { v: 2200, planned: 300, t: 2000 }, macros: [] });
    expect(over.kcal?.bar).toEqual({ w: "100.0%", pw: "0.0%" });
  });

  it("has no bar and no target without a target", () => {
    const { kcal, macros } = nutrientsL1({
      kcal: { v: 900 },
      macros: [{ key: "protein", v: 50.25 }],
    });
    expect(kcal).toMatchObject({ t: null, bar: null, aria: "Energia: 900 kcal" });
    expect(macros[0]).toMatchObject({ value: "50,3", target: null, mark: null });
    expect(macros[0]!.segs).toEqual([
      { w: "95.2%", bg: shade("protein", 1), planned: false, dim: false },
    ]);
  });

  it("draws the macros without targets on one shared scale", () => {
    const { macros } = nutrientsL1({
      macros: [
        { key: "protein", v: 38 },
        { key: "carbs", v: 6.3 },
      ],
    });
    // scale = 38 × 1,05 = 39,9
    expect(macros.map((m) => m.segs[0]!.w)).toEqual(["95.2%", "15.8%"]);
  });

  it("puts the tick at the target on a scale with room past it, planned hatched", () => {
    const [m] = nutrientsL1({
      macros: [{ key: "carbs", v: 100, planned: 20, t: 200 }],
    }).macros;
    // scale = max(200 × 1,25, 120 × 1,05) = 250
    expect(m!.mark).toBe("80.0%");
    expect(m!.segs.map((s) => [s.w, s.planned])).toEqual([
      ["40.0%", false],
      ["8.0%", true],
    ]);
    expect(m!.aria).toBe("Carboidrati 100 g su 200 g, 20 g previsti");
  });

  it("shades by kind in the fixed order, and lists five sources then the rest", () => {
    const [m] = nutrientsL1({
      macros: [
        {
          key: "protein",
          v: 30,
          t: 40,
          parts: { low: 10, high: 20 },
          sources: [
            ["A", 10],
            ["B", 8],
            ["C", 5],
            ["D", 3],
            ["E", 2],
            ["F", 1.5],
            ["G", 0.5],
          ],
        },
      ],
    }).macros;
    expect(m!.kinds.map((k) => k.name)).toEqual(["qualità alta", "qualità bassa"]);
    expect(m!.segs.map((s) => s.bg)).toEqual([
      shade("protein", 1),
      shade("protein", 0.3),
    ]);
    expect(m!.sources.map((s) => [s.name, s.g, s.w])).toEqual([
      ["A", "10", "100%"],
      ["B", "8", "80%"],
      ["C", "5", "50%"],
      ["D", "3", "30%"],
      ["E", "2", "20%"],
      ["e altri 2", "2", "0%"],
    ]);
  });

  it("writes the micros against their targets, coloured by the page's state", () => {
    const { micros } = nutrientsL1({
      macros: [],
      micros: {
        summary: "1 su 2 coperti",
        groups: [
          {
            name: "Vitamine",
            items: [
              { name: "D", v: 4, t: 15, unit: "µg", state: "bad" },
              { name: "C", v: 120, t: 110, unit: "mg", state: "good" },
              { name: "K", v: 50, t: null, unit: "µg" },
            ],
          },
        ],
      },
    });
    expect(micros!.groups[0]!.items.map((i) => [i.v, i.w, i.color])).toEqual([
      ["4 / 15 µg", "27%", "var(--tomato)"],
      ["120 / 110 mg", "100%", "var(--herb)"],
      ["50 µg", "0%", "var(--ink)"],
    ]);
  });

  it("judges the maxima as ceilings", () => {
    const { limits } = nutrientsL1({
      macros: [],
      limits: [
        { key: "sugars", v: 78, t: 94 },
        { key: "salt", v: 6, t: 5 },
        { key: "sat", v: 9.6, t: 23 },
      ],
    });
    expect(limits.map((l) => [l.v, l.t, l.w, l.color])).toEqual([
      ["78", "94 g", "83%", "var(--herb)"],
      ["6", "5 g", "100%", "var(--tomato)"],
      ["9,6", "23 g", "42%", "var(--herb)"],
    ]);
  });
});

describe("L0: a meal box's thin bars", () => {
  it("each macro's kinds as shares of its target; past it, the bar is full", async () => {
    const { nutrientsL0 } = await import("./nutrient-rows");
    const rows = nutrientsL0({
      macros: [
        { key: "protein", v: 37.7, t: 150, parts: { high: 35.4, low: 2.3 } },
        { key: "fiber", v: 40, t: 30 },
        { key: "carbs", v: 0, t: 300 },
        { key: "fat", v: 10 },
      ],
    });
    expect(rows[0]!.segs.map((s) => s.w)).toEqual(["23.6%", "1.5%"]);
    expect(rows[0]!.value).toBe("37,7");
    expect(rows[1]!.segs).toEqual([expect.objectContaining({ w: "100.0%" })]);
    expect(rows[2]!.segs).toEqual([]);
    // No target: the macros without one share a scale (here only fat: full).
    expect(rows[3]!.segs[0]!.w).toBe("100.0%");
    expect(rows[0]!.aria).toContain("dell’obiettivo");
  });
});

describe("the heat bar (dossiers/ranges.md §6)", () => {
  const zones = [
    { from: 0, level: "bad" as const },
    { from: 62.7, level: "fair" as const },
    { from: 121, level: "good" as const },
    { from: 166, level: "fair" as const },
    { from: 227, level: "bad" as const },
  ];
  it("draws the zones on a strip of their own and says the value's zone", () => {
    const m = rows({ macros: [{ key: "protein", v: 140.7, t: 154, zones }] }).macros[0]!;
    expect(m.word).toBe("ottimo");
    expect(m.state).toBe("good");
    expect(m.aria).toContain("ottimo");
    // The scale shows the whole good zone: max(154 × 1.25, 166 × 1.1) = 192.5.
    expect(m.strip!.zones.map((z) => [z.w, z.c])).toEqual([
      ["32.6%", "var(--heat-bad)"],
      ["30.3%", "var(--heat-fair)"],
      ["23.4%", "var(--heat-good)"],
      ["13.8%", "var(--heat-fair)"],
      ["0.0%", "var(--heat-bad)"],
    ]);
    expect(m.strip).toMatchObject({ at: "73.1%", to: null });
  });
  it("judges where the plan takes the day, and marks it", () => {
    const m = rows({ macros: [{ key: "protein", v: 100, planned: 40, t: 154, zones }] })
      .macros[0]!;
    expect(m.word).toBe("→ ottimo");
    expect(m.aria).toContain("ottimo con il previsto");
    expect(m.strip).toMatchObject({ at: "51.9%", to: "72.7%" });
  });
  it("judges a limit by its zones, its bar running to twice the limit", () => {
    const salt = [
      { from: 0, level: "good" as const },
      { from: 5, level: "fair" as const },
      { from: 7.5, level: "bad" as const },
      { from: 12.5, level: "danger" as const },
    ];
    const l = rows({ macros: [], limits: [{ key: "salt", v: 11.6, t: 5, zones: salt }] })
      .limits[0]!;
    expect(l.strip!.at).toBe("95.2%"); // 11.6 of max(11.6 × 1.05, 10)
    expect(l.word).toBe("pessimo");
    expect(l.strip!.zones[3]).toMatchObject({ danger: true });
    expect(l.strip!.mean).toBeNull();
    const m = rows({
      macros: [],
      limits: [{ key: "salt", v: 11.6, t: 5, zones: salt, mean: 6, meanDays: 3 }],
    }).limits[0]!;
    expect(m.strip!.mean).toBe("49.3%"); // 6 of 12.18
    const p = rows({
      macros: [],
      limits: [{ key: "salt", v: 2, planned: 3, t: 5, zones: salt }],
    }).limits[0]!;
    // The plan's 3 g hatched after the 2 eaten, on a bar to 10 g; judged at 5 g.
    expect([p.w, p.pw, p.word]).toEqual(["20%", "30%", "→ ok"]);
    expect(m.aria).toContain("media di 3 giorni");
  });
  it("judges a kind a guideline speaks of on its own scale; the others as before", () => {
    const m = rows({
      macros: [
        {
          key: "fat",
          v: 60,
          t: 77,
          parts: { mufa: 30, n3: 0.8, sfa: 29.2 },
          partZones: {
            n3: [
              { from: 0, level: "fair" },
              { from: 1.5, level: "good" },
            ],
          },
        },
      ],
    }).macros[0]!;
    const n3 = m.kinds.find((k) => k.name === "omega-3")!;
    expect([n3.word, n3.w, n3.fill]).toEqual(["ok", "35.6%", "var(--warn)"]); // 0.8 of 2.25
    expect(n3.c).toContain("var(--macro-fat)");
    expect(m.kinds.find((k) => k.name === "monoinsaturi")!.strip).toBeNull();
  });
  it("without zones, nothing changes", () => {
    const m = rows({ macros: [{ key: "protein", v: 140.7, t: 154 }] }).macros[0]!;
    expect(m).toMatchObject({ strip: null, word: null });
  });

  describe("L2, a meal's window", () => {
    const dinner: NutrientsData = {
      foods: [
        {
          key: "p",
          name: "Passata",
          amount: "140 g",
          kcal: 40,
          macros: { carbs: { refined: 0.7, intrinsic: 6.3 }, protein: { low: 1.8 } },
        },
        {
          key: "c",
          name: "Merluzzo",
          amount: "200 g",
          kcal: 160,
          macros: { protein: { high: 35.4 } },
        },
      ],
      macros: [
        { key: "protein", v: 37.2, parts: { high: 35.4, low: 1.8 } },
        { key: "carbs", v: 7, parts: { refined: 0.7, intrinsic: 6.3 } },
      ],
    };

    it("draws each bar per food, shaded by kind, and dims the others when one is picked", () => {
      const all = rows(dinner);
      expect(all.foods.map((f) => [f.name, f.tone])).toEqual([
        ["Passata", 0.75],
        ["Merluzzo", 1],
      ]);
      const protein = all.macros[0]!;
      expect(protein.segs).toHaveLength(2);
      expect(protein.segs[0]!.bg).toBe(shade("protein", 0.3));
      expect(all.macros[1]!.segs[0]!.bg).toMatch(/^linear-gradient/);
      const picked = rows(dinner, "c");
      expect(picked.foods[1]!.pressed).toBe(true);
      expect(picked.macros[0]!.segs.map((s) => s.dim)).toEqual([true, false]);
      expect(picked.macros[0]!.sources.map((s) => [s.name, s.dim])).toEqual([
        ["Merluzzo", false],
        ["Passata", true],
      ]);
    });

    it("says which foods each kind came from, and leaves «da dove» out for a single food", () => {
      const protein = rows(dinner).macros[0]!;
      expect(protein.kinds.map((k) => k.from)).toEqual(["Merluzzo 35,4", "Passata 1,8"]);
      const carbs = rows(dinner).macros[1]!;
      expect(carbs.sources).toEqual([]);
      expect(carbs.kinds.map((k) => k.from)).toEqual([null, null]);
    });
  });
});
