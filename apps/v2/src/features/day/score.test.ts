import { describe, expect, it } from "vitest";
import { F } from "@lifeos/kit";
import type { DayItem, FoodTargets } from "@/core/day";
import { kindRegistry } from "@/core/kinds";
import { microTargets } from "@/core/engines/targets";
import {
  foodScore,
  mealScore,
  sleepScore,
  waterBox,
  weighScore,
  type ScoreContext,
} from "./score";

const reg = kindRegistry();
const item = (kind: string, more: Partial<DayItem> = {}): DayItem =>
  ({
    id: kind,
    kind: reg.get(kind),
    family: "food",
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
    ...more,
  }) as DayItem;
const meal = (lines: DayItem["lines"]): DayItem =>
  item("meal", { subcategory: "lunch", lines });
const targets: FoodTargets = {
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
const broccoli = {
  id: "b",
  name: "Broccoli",
  itemId: "f1",
  productId: null,
  quantity: "300",
  unit: "g",
  values: {
    kcal: "34",
    protein: "2.8",
    fibre: "2.6",
    fat: "0.4",
    carbs: "6.6",
    saturatedFat: "0.04",
    salt: "0.08",
  },
};
const est = new Map([
  [
    "f1",
    {
      k: "316",
      ca: "47",
      fe: "0.7",
      mg: "21",
      vitA: "31",
      vitC: "89",
      vitD: "0",
      folate: "63",
      protein_medium: "1",
      carbs_free: "0",
      carbs_intrinsic: "1",
      fat_n3: "0.02",
      fat_sfa: "0.04",
    },
  ],
]);

describe("a food's score, per 100 kcal (meal-score.md §8)", () => {
  const micros = microTargets({ sex: "male", age: 24 });
  it("broccoli scores high on 100 kcal of it, whatever the grams", () => {
    const s = foodScore(broccoli.values, est.get("f1"), targets, micros)!;
    expect(s.value).toBeGreaterThanOrEqual(90);
  });
  it("bread, poor in micros for its energy, scores low (the dossier's 12)", () => {
    const bread = {
      kcal: "270",
      protein: "9",
      carbs: "52",
      fibre: "3",
      fat: "3",
      saturatedFat: "0.5",
      salt: "1.4",
    };
    const breadEst = {
      k: "110",
      ca: "20",
      fe: "1",
      mg: "25",
      vitA: "0",
      vitC: "0",
      vitD: "0",
      folate: "30",
      protein_medium: "1",
      carbs_free: "0",
      carbs_refined: "1",
      fat_n3: "0.05",
      fat_sfa: "0.5",
    };
    const s = foodScore(bread, breadEst, targets, micros)!;
    expect(s.value).toBeLessThan(50);
    expect(s.parts.find((p) => p.name === "densità")!.score).toBeLessThan(0.3);
  });
  it("none for water or coffee, nor without the day's targets", () => {
    expect(foodScore({ kcal: "2" }, undefined, targets, micros)).toBeUndefined();
    // A cake without its micros: density unknown, the limits alone would say 100.
    const cake = {
      kcal: "480",
      protein: "7",
      carbs: "55",
      fat: "25",
      saturatedFat: "8",
      salt: "0.3",
    };
    expect(foodScore(cake, undefined, targets, micros)).toBeUndefined();
    // Basil is eaten by the gram: its 100 kcal would be 435 g.
    expect(
      foodScore(broccoli.values, est.get("f1"), targets, micros, "herbs"),
    ).toBeUndefined();
    expect(foodScore(broccoli.values, est.get("f1"), null, micros)).toBeUndefined();
  });
});

describe("a meal's score on the day", () => {
  it("parts in words with their weights; the parts that cannot be computed named", () => {
    const s = mealScore(
      meal([broccoli]),
      targets,
      est,
      microTargets({ sex: "male", age: 24 }),
    )!;
    expect(s.parts.map((p) => p.name)).toEqual(["densità", "limiti"]);
    expect(s.missing).toEqual(["valore", "adatto al blocco"]);
    expect(s.value).toBeGreaterThanOrEqual(70);
    expect(s.parts.reduce((a, p) => a + p.weight, 0)).toBeCloseTo(1, 10);
  });

  it("names the limit that decided it", () => {
    const salty = { ...broccoli, values: { ...broccoli.values, salt: "2" } };
    const s = mealScore(
      meal([salty]),
      targets,
      est,
      microTargets({ sex: "male", age: 24 }),
    )!;
    expect(s.parts.find((p) => p.name.startsWith("limiti"))!.name).toBe("limiti · sale");
  });

  it("none without the day's targets, nor for a coffee", () => {
    expect(mealScore(meal([broccoli]), null, est, null)).toBeUndefined();
    expect(
      mealScore(
        meal([{ ...broccoli, quantity: "5", values: { kcal: "2" } }]),
        targets,
        est,
        null,
      ),
    ).toBeUndefined();
  });
});

// The developer's 23 October (Europe/Rome, UTC+2).
const clock = { timeZone: "Europe/Rome", boundaryMin: 0 };
const at = (iso: string) => new Date(iso);
const night = item("sleep", {
  start: at("2026-10-22T22:30:00Z"),
  end: at("2026-10-23T06:00:00Z"),
  minute: 8 * 60,
  values: { quality: "4" },
});
const weighIn = (values: DayItem["values"], minute = 8 * 60 + 23) =>
  item("weigh_in", { minute, values: { weightKg: "76.2", ...values } });
const ctx: ScoreContext = {
  date: "2026-10-23",
  clock,
  weighings: [
    { day: "2026-10-14", kg: 75.5 },
    { day: "2026-10-15", kg: 75.6 },
    { day: "2026-10-16", kg: 75.3 },
    { day: "2026-10-18", kg: 76 },
    { day: "2026-10-19", kg: 77 },
    { day: "2026-10-20", kg: 76 },
    { day: "2026-10-21", kg: 75.4 },
    { day: "2026-10-22", kg: 77.3 },
    { day: "2026-10-23", kg: 76.2 },
  ],
  weightGoal: { value: 72.3, since: "2026-10-12", by: "2026-12-20" },
  nights: [
    ["2026-10-20", "2026-10-19T22:12:00Z", "2026-10-20T03:17:00Z"],
    ["2026-10-21", "2026-10-20T20:50:00Z", "2026-10-21T04:10:00Z"],
    ["2026-10-22", "2026-10-21T21:00:00Z", "2026-10-22T04:15:00Z"],
  ].map(([day, s, e]) => ({ day: day!, start: at(s!), end: at(e!) })),
  sex: "male",
  now: 14 * 60,
};

describe("a weigh-in's score", () => {
  it("fasted, after the toilet, at 08:23: reliable; gaining against a loss goal: no pace", () => {
    const w = weighIn({ fasted: true, afterToilet: true, afterTraining: false });
    const s = weighScore(w, [night, w], ctx)!;
    const part = (n: string) => s.parts.find((p) => p.name === n)!.score;
    expect(part("pesata affidabile")).toBe(1);
    expect(part("costanza delle pesate")).toBe(1);
    expect(part("ritmo vs obiettivo")).toBe(0);
    expect(s.value).toBe(60);
  });

  it("not fasted after a meal: less reliable; without a goal the pace is named missing", () => {
    const breakfast = { ...meal([broccoli]), minute: 7 * 60 };
    const w = weighIn({ fasted: false });
    const s = weighScore(w, [breakfast, w], { ...ctx, weightGoal: null })!;
    expect(s.parts.find((p) => p.name === "pesata affidabile")!.score).toBeCloseTo(0.38);
    expect(s.missing).toEqual(["ritmo vs obiettivo"]);
  });

  it("none for a planned weigh-in", () => {
    const w = { ...weighIn({}), status: "planned" as const };
    expect(weighScore(w, [w], ctx)).toBeUndefined();
  });
});

describe("a night's score", () => {
  it("7.5 h, later than the nights before, quality 4 and energy 3", () => {
    const checkin = item("checkin", { values: { energy: "3" } });
    const s = sleepScore(night, [night, checkin], ctx)!;
    const part = (n: string) => s.parts.find((p) => p.name === n)!.score;
    expect(part("durata vs bisogno")).toBe(1);
    // Bed 00:30 against ≈ 23:21, wake 08:00 against ≈ 05:54: a gap of 1 h 37.
    expect(part("regolarità")).toBeCloseTo(0.25, 1);
    expect(part("come ti senti")).toBeCloseTo(0.625);
  });

  it("regularity named missing with fewer than three nights before", () => {
    const s = sleepScore(night, [night], { ...ctx, nights: ctx.nights!.slice(1) })!;
    expect(s.missing).toEqual(["regolarità"]);
  });
});

describe("the day's water", () => {
  const drink = (hhmm: number, ml: string) =>
    item("water", { minute: hhmm, values: { ml } });
  it("drunk of the need, with the training's reason and the score", () => {
    const gym = item("session", {
      start: at("2026-10-23T09:00:00Z"),
      end: at("2026-10-23T10:00:00Z"),
      minute: 11 * 60,
      values: { durationMin: "60" },
    });
    const b = waterBox(
      [night, gym, drink(9 * 60, "500"), drink(12 * 60 + 30, "500")],
      ctx,
    );
    // 2.5 l total + 1 l of sweat − 0.5 l from food = 3 l to drink.
    expect(b.value).toBe(F.of(1, 3, "l"));
    expect(b.pills![0]!.t).toBe(
      F.signed(1, "l") + " per " + F.hm(60) + " di allenamento",
    );
    expect(b.score!.parts.map((p) => p.name)).toEqual([
      "bevuta vs attesa a quest’ora",
      "dopo l’allenamento",
      "distribuita nel giorno",
    ]);
  });

  it("without the person's sex, only what was drunk", () => {
    const b = waterBox([drink(9 * 60, "250")], { ...ctx, sex: null });
    expect(b.value).toBe(F.num(0.25, "l"));
    expect(b.score).toBeUndefined();
  });
});
