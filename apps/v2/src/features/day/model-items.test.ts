import { describe, expect, it } from "vitest";
import type { DayItem } from "@/core/day";
import { kindRegistry } from "@/core/kinds";
import type { ResolvedBlock } from "@/core/plans";
import { habitItems, modelItems } from "./model-items";

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
const meal = (role: string, at?: number): ResolvedBlock => ({
  id: role,
  kind: "meal",
  when: at === undefined ? { type: "unset" } : { type: "at", min: at },
  defaults: { role },
  shares: { kcal: 0.3 },
  origin: "local",
});
const session: ResolvedBlock = {
  id: "s",
  kind: "session",
  when: { type: "at", min: 1080 },
  durationMin: 60,
  origin: "local",
};
const blocks = [meal("breakfast", 480), meal("lunch", 780), meal("dinner"), session];

describe("what the day's model still plans", () => {
  it("a day to come: every block not yet on the day, in time order", () => {
    const rows = modelItems({
      day: "2026-10-25",
      blocks,
      items: [item("meal", { subcategory: "lunch", status: "planned" })],
      nowMinute: null,
      step: "Push",
      slots: new Map(),
    });
    expect(rows.map((r) => [r.title, r.time])).toEqual([
      ["Colazione", "08:00"],
      ["Push", "18:00"],
      ["Cena", "20:00"],
    ]);
    expect(rows[0]!.href).toBe(
      "/aggiungi/pasto?giorno=2026-10-25&ruolo=breakfast&ora=08:00",
    );
  });

  it("today: from an hour ago on; a session done, or a rest, plans no training", () => {
    const rows = modelItems({
      day: "2026-10-24",
      blocks,
      items: [item("session")],
      nowMinute: 840,
      step: null,
      slots: new Map(),
    });
    expect(rows.map((r) => r.title)).toEqual(["Pranzo", "Cena"]);
    expect(
      modelItems({
        day: "d",
        blocks: [session],
        items: [],
        nowMinute: null,
        step: "Riposo",
        slots: new Map(),
      }),
    ).toEqual([]);
  });
});

describe("the habits due, as the day's rows", () => {
  const h = {
    id: "s",
    name: "Studio",
    kind: "activity",
    category: "study",
    atMin: 1080,
    durationMin: 60,
  };
  it("their time, their sheet with category and time; today from an hour ago", () => {
    const rows = habitItems({
      day: "2026-10-25",
      habits: [
        h,
        { ...h, id: "r", name: "Lettura", kind: "reading", category: null, atMin: null },
      ],
      nowMinute: null,
      familyOf: () => "habit",
    });
    expect(rows.map((r) => [r.title, r.time, r.href])).toEqual([
      [
        "Studio",
        "18:00",
        "/aggiungi/activity?giorno=2026-10-25&categoria=study&ora=18:00",
      ],
      ["Lettura", "—", "/aggiungi/reading?giorno=2026-10-25"],
    ]);
    expect(
      habitItems({ day: "d", habits: [h], nowMinute: 1200, familyOf: () => "habit" }),
    ).toEqual([]);
  });
});
