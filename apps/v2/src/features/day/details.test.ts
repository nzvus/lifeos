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
    creatineDays: 11,
  };

  it("a coffee: «Caffè ≈ 100 mg», what is left at bedtime after three half-lives", () => {
    const e = withCompounds(present(coffee), coffee, ctx);
    expect(e.title).toBe("Caffè");
    expect(plain(e.value)).toBe("≈ 100 mg");
    expect(plain(e.meta)).toBe("alle 23:30 ne restano ≈ 13 mg");
    expect(caffeineLeft(ctx.doses, ctx.bed!.at)).toBeCloseTo(100 / 2 ** 3, 0);
  });

  it("creatine alone is a supplement with its days; inside a meal, a pill", () => {
    const alone = item("meal", { lines: [line("Creatina", "creatine", "3.4", "0")] });
    const e = withCompounds(present(alone), alone, ctx);
    expect(plain([e.title, e.value, e.meta])).toEqual([
      "Creatina",
      "3,4 g",
      "integratore · 11 giorni su 28",
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
