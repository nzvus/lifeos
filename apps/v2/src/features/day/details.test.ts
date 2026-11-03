import { describe, expect, it } from "vitest";
import type { DayItem } from "@/core/day";
import { kindRegistry } from "@/core/kinds";
import { caffeineLeft } from "@/core/food/compounds";
import { details } from "./details";
import { caffeineDoses, withCompounds, type CompoundContext } from "./compounds";
import { present } from "./present";

const reg = kindRegistry();
/** F joins numbers and units with a no-break space; the tests read plain ones. */
const plain = <T>(x: T): T => JSON.parse(JSON.stringify(x).replace(/\u00a0/g, " "));
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
  source: "typed",
  confidence: "1",
  note: "",
  ...over,
});
const line = (name: string, itemId: string, quantity: string, kcal: string) => ({
  id: name,
  name,
  itemId,
  productId: null,
  quantity,
  unit: "g",
  values: { kcal },
});
const set = (reps: number, kg: string, warmup = false) =>
  ({ reps, loadKg: kg, warmup, durationS: null, done: true }) as DayItem["sets"][number];

describe("what an open box shows", () => {
  it("a weigh-in: its fields as tiles, in words", () => {
    const d = details(item("weigh_in", { values: { weightKg: "75.6", fasted: true } }));
    // The weight is the box's own number: not repeated.
    expect(plain(d.stats)).toEqual([{ label: "A digiuno", value: "sì" }]);
  });

  it("a session: each exercise with its working sets, warm-ups left out", () => {
    const ex = item("session_exercise", {
      item: { id: "e", name: "Panca", drawing: {} },
      sets: [set(8, "30", true), set(9, "60"), set(9, "60"), set(7, "55")],
    });
    const d = details(item("session", { children: [ex] }));
    expect(plain(d.lines)).toEqual([
      { label: "Panca", value: "9, 9 × 60 kg · 7 × 55 kg" },
    ]);
  });

  it("a meal: its foods with amounts and kcal; an estimate and a note in the foot", () => {
    const d = details(
      item("meal", {
        lines: [line("Gnocchi", "g", "300", "150")],
        confidence: "0.6",
        note: "al ristorante",
      }),
    );
    expect(plain(d.lines[0])).toEqual({ label: "Gnocchi", value: "300 g · 450 kcal" });
    expect(plain(d.foot)).toBe("stima (affidabilità 60 %) · al ristorante");
  });

  it("a meal's cost: each line's, the meal's as a tile, «senza prezzo» only beside a priced one", () => {
    const priced = {
      ...line("Avena", "g", "80", "370"),
      values: { kcal: "370", cents: "13" },
    };
    const d = details(item("meal", { lines: [priced, line("Burro", "g", "10", "740")] }));
    expect(plain(d.lines.map((l) => l.value))).toEqual([
      "80 g · 296 kcal · ≈ 0,10 €",
      "10 g · 74 kcal · senza prezzo",
    ]);
    expect(plain(d.stats.find((x) => x.label === "Costo"))).toEqual({
      label: "Costo",
      value: "≈ 0,10 €",
    });
  });

  it("leaves a meal's foods out when its window lists them (L2 chips)", () => {
    const meal = item("meal", { lines: [line("Gnocchi", "g", "300", "150")] });
    expect(details(meal, { foods: false }).lines).toEqual([]);
  });
});

describe("caffeine and creatine as the boards draw them", () => {
  const compounds = new Map([
    ["coffee", { caffeine: "1389" }],
    ["creatine", { creatine: "100" }],
  ]);
  const at = new Date("2026-10-15T06:33:00Z");
  const coffee = item("meal", {
    start: at,
    lines: [line("Capsula", "coffee", "7.2", "0")],
  });
  const ctx: CompoundContext = {
    compounds,
    doses: caffeineDoses([coffee], compounds),
    bed: { at: new Date("2026-10-15T21:30:00Z"), known: false },
    creatine: { stores: 0.76, trend: "up", sinceDose: 0 },
  };

  // His clock: Rome, UTC+2 on 15 Oct.
  const timeOf = (d: Date) =>
    d.toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Rome",
    });
  const capsule = (iso: string, id = "x") =>
    item("meal", {
      id,
      start: new Date(iso),
      lines: [line("Capsula", "coffee", "7.2", "0")],
    });

  it("a morning coffee says only its mg: nothing to decide at bedtime (FOOD-40, test 8.3)", () => {
    const e = withCompounds(present(coffee), coffee, { ...ctx, timeOf });
    expect(e.title).toBe("Caffè");
    expect(plain(e.value)).toBe("≈ 100 mg");
    expect(e.pills).toEqual([]);
    expect(e.meta).toBe("");
    expect(caffeineLeft(ctx.doses, ctx.bed!.at)).toBeCloseTo(100 / 2 ** 3, 0);
  });

  it("a coffee after the last-coffee time says so, at his usual bedtime (test 8.4)", () => {
    // 16:00 local, usual bed 00:28 → last coffee 15:28; ≈ 31 mg left: good, so no bed pill.
    const four = capsule("2026-10-15T14:00:00Z");
    const usual = {
      ...ctx,
      timeOf,
      doses: caffeineDoses([four], compounds),
      bed: { at: new Date("2026-10-15T22:28:00Z"), known: false, usual: true },
    };
    expect(plain(withCompounds(present(four), four, usual).pills)).toEqual([
      { t: "dopo le 15:28: tocca il sonno", state: "warn" },
    ]);
  });

  it("two late coffees: bad at bedtime, said with when; five a day: over 400 (test 8.5)", () => {
    const late = capsule("2026-10-15T19:00:00Z");
    const two = {
      ...ctx,
      timeOf,
      doses: caffeineDoses([late, { ...late, id: "l2" }], compounds),
    };
    const e = withCompounds(present(late), late, two);
    expect(plain(e.pills)).toEqual([
      { t: "alle 23:30: pessimo", state: "bad" },
      { t: "dopo le 14:30: tocca il sonno", state: "warn" },
    ]);
    expect(plain(e.meta)).toBe("ne restano ≈ 141 mg");
    const five = [0, 1, 2, 3, 4].map((n) =>
      capsule("2026-10-15T0" + (5 + n) + ":00:00Z", "c" + n),
    );
    const many = { ...ctx, timeOf, doses: caffeineDoses(five, compounds) };
    expect(plain(withCompounds(present(five[0]!), five[0]!, many).pills)).toContainEqual({
      t: "oggi ≈ 500 mg: oltre 400",
      state: "bad",
    });
  });

  it("creatine alone is a supplement with its days; inside a meal, a pill", () => {
    const alone = item("meal", { lines: [line("Creatina", "creatine", "3.4", "0")] });
    const e = withCompounds(present(alone), alone, ctx);
    expect(plain([e.title, e.value, e.meta])).toEqual([
      "Creatina",
      "3,4 g",
      "integratore · scorte ≈ 76 % · in aumento",
    ]);
    const meal = item("meal", {
      lines: [
        line("Creatina", "creatine", "3.4", "0"),
        line("Riso", "rice", "100", "350"),
      ],
    });
    expect(plain(withCompounds(present(meal), meal, ctx).pills)).toContainEqual({
      t: "creatina 3,4 g",
    });
  });
});
