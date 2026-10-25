import { describe, expect, it } from "vitest";
import type { DayItem } from "@/core/day";
import { kindRegistry } from "@/core/kinds";
import { present } from "./present";

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

describe("a day item as a Box", () => {
  it("a meal with no energy and one line says how much: coffee 30 ml, not 0", () => {
    const coffee = (unit: string, kcal: string) =>
      present(
        item("meal", {
          lines: [
            {
              id: "l",
              name: "CAFFÉ",
              itemId: null,
              productId: null,
              quantity: "30.00",
              unit,
              values: { kcal },
            },
          ],
        }),
      ).value;
    expect(coffee("ml", "0")?.replace(/\u00a0/g, " ")).toBe("30 ml");
    expect(coffee("g", "2")).toBe("1");
  });

  it("a meal: named by its role, its foods under it, its kcal from the snapshot × servings, tags", () => {
    const b = present(
      item("meal", {
        subcategory: "breakfast",
        minute: 11 * 60 + 17,
        values: { servings: "2" },
        tags: ["post-workout"],
        lines: [
          {
            id: "l1",
            name: "AVENA",
            itemId: null,
            productId: null,
            quantity: "50",
            unit: "g",
            values: { kcal: "372" },
          },
          {
            id: "l2",
            name: "Lamponi",
            itemId: null,
            productId: null,
            quantity: "100",
            unit: "g",
            values: { kcal: "32.5" },
          },
        ],
      }),
    );
    expect(b).toMatchObject({
      fam: "food",
      sub: "breakfast",
      title: "Colazione",
      meta: "AVENA, Lamponi",
      value: "437",
      time: "11:17",
      pills: [{ t: "dopo l’allenamento", of: { fam: "train" } }],
    });
  });

  it("a coffee or creatine (no energy) keeps its own name, not the role of its hour", () => {
    const b = present(
      item("meal", {
        subcategory: "breakfast",
        lines: [
          {
            id: "c",
            name: "CAFFÉ",
            itemId: null,
            productId: null,
            quantity: "7.2",
            unit: "g",
            values: { kcal: "0" },
          },
        ],
      }),
    );
    expect(b).toMatchObject({ title: "CAFFÉ", meta: "" });
  });

  it("a meal with no role keeps its foods as its name", () => {
    const b = present(
      item("meal", {
        subcategory: null,
        lines: [
          {
            id: "l",
            name: "Pizza",
            itemId: null,
            productId: null,
            quantity: "300",
            unit: "g",
            values: { kcal: "250" },
          },
        ],
      }),
    );
    expect(b).toMatchObject({ title: "Pizza", meta: "" });
  });

  it("a session counts its done working sets and tonnage (warm-ups and assumed sets left out)", () => {
    const set = (reps: number, loadKg: string, warmup = false, done = true) =>
      ({ reps, loadKg, warmup, done }) as DayItem["sets"][number];
    const b = present(
      item("session", {
        children: [
          item("session_exercise", {
            sets: [
              set(8, "30", true),
              set(10, "60"),
              set(9, "60"),
              set(8, "60", false, false),
            ],
          }),
          item("session_exercise", { sets: [set(12, "0")] }),
        ],
      }),
    );
    // 10 × 60 + 9 × 60 = 1.140 kg over 3 working sets.
    expect(b.pills).toEqual([{ t: "3 serie" }, { t: "1.140" + "\u00a0" + "kg" }]);
  });

  it("a session: its length and the drawings of its exercises, in order", () => {
    const ex = (name: string, pattern: string) =>
      item("session_exercise", { item: { id: name, name, drawing: { pattern } } });
    const b = present(
      item("session", {
        values: { durationMin: "62.0000", label: "Push" },
        children: [ex("Panca", "horizontal_press"), ex("Lento", "vertical_press")],
      }),
    );
    expect(b.title).toBe("Push");
    expect(b.value).toBe("62 min");
    expect(b.members).toEqual([
      { fam: "train", pattern: "horizontal_press", title: "Panca" },
      { fam: "train", pattern: "vertical_press", title: "Lento" },
    ]);
  });

  it("sleep from its span; a weigh-in with its context; a check-in as words", () => {
    const sleep = present(
      item("sleep", {
        start: new Date("2026-10-15T21:55:00Z"),
        end: new Date("2026-10-16T05:25:00Z"),
      }),
    );
    expect([sleep.title, sleep.value]).toEqual(["Sveglia", "7,5 h"]);
    const w = present(
      item("weigh_in", { values: { weightKg: "74.2500", fasted: true } }),
    );
    expect([w.value, w.pills]).toEqual(["74,3 kg", [{ t: "a digiuno", state: "good" }]]);
    const c = present(item("checkin", { values: { mood: "3.0000", energy: "2.0000" } }));
    expect(c.meta).toBe("umore 3/5 · energia 2/5");
    expect(c.time).toBeUndefined();
  });

  it("planned is planned, skipped is faded and says so, an estimate says so", () => {
    expect(present(item("meal", { status: "planned" })).planned).toBe(true);
    const s = present(item("session", { status: "skipped" }));
    expect([s.faded, s.pills]).toEqual([true, [{ t: "saltato", state: "muted" }]]);
    expect(present(item("meal", { confidence: "0.60" })).pills).toEqual([
      { t: "stimato", state: "warn" },
    ]);
  });

  it("a kind of the person's own shows its first number with its unit", () => {
    const own = kindRegistry([
      {
        key: "guitar",
        domain: "work",
        shape: "interval",
        entryMode: "timer",
        archivedAt: null,
        definition: {
          family: "habit",
          fields: [{ key: "minutes", type: "number", unit: "min" }],
        },
      },
    ]).get("guitar");
    const b = present(
      item("meal", { kind: own, family: "habit", values: { minutes: "30" } }),
    );
    expect([b.title, b.value]).toEqual(["guitar", "30 min"]);
  });
});

describe("a kind of the person's own on Oggi", () => {
  const mine = kindRegistry([
    {
      key: "mal_di_testa",
      name: "Mal di testa",
      domain: "body",
      shape: "instant",
      entryMode: "form",
      archivedAt: null,
      definition: {
        family: "body",
        fields: [
          { key: "intensita", label: "Intensità", type: "scale", scale: 5 },
          { key: "farmaco", label: "Farmaco", type: "choice", choices: ["no", "sì"] },
          { key: "acqua", label: "Acqua", type: "number", unit: "ml" },
        ],
      },
    },
  ]).get("mal_di_testa");
  it("is named by its name, valued by its first number, each field with its word", () => {
    const e = present(
      item("chore", {
        kind: mine,
        family: "body",
        values: { intensita: "3", farmaco: "sì", acqua: "250" },
      }),
    );
    expect(e.title).toBe("Mal di testa");
    expect(e.value).toBe("250 ml");
    expect(e.meta).toBe("Intensità 3/5 · Farmaco sì");
  });
});
