import { describe, expect, it } from "vitest";
import type { Day, DayItem } from "../day";
import { sessionContext } from "./context";

const item = (p: Partial<DayItem> & { key: string }): DayItem =>
  ({
    id: Math.random().toString(36),
    kind: { key: p.key },
    status: "done",
    start: null,
    end: null,
    values: {},
    lines: [],
    children: [],
    sets: [],
    ...p,
  }) as unknown as DayItem;
const line = (
  name: string,
  quantity: string,
  values: Record<string, string> = {},
  unit = "g",
) => ({
  id: name,
  name,
  itemId: null,
  productId: null,
  quantity,
  unit,
  values,
});
const day = (d: string, timed: DayItem[]): Day =>
  ({
    day: d,
    clock: { timeZone: "Europe/Rome", boundaryMin: 240 },
    timed,
    untimed: [],
    invalidKinds: [],
  }) as Day;
const at = (iso: string) => new Date(iso);

describe("what came before a session", () => {
  const start = at("2026-10-14T07:15:00Z");
  const days = [
    day("2026-10-12", [
      item({
        key: "meal",
        start: at("2026-10-12T12:00:00Z"),
        lines: [line("Creatina", "5")],
      }),
    ]),
    day("2026-10-13", [
      item({
        key: "meal",
        start: at("2026-10-13T12:00:00Z"),
        lines: [
          line("Pasta", "100", { kcal: "360", carbs: "72" }),
          line("Creatina", "2"),
        ],
      }),
      item({
        key: "meal",
        start: at("2026-10-13T19:30:00Z"),
        lines: [line("Pizza", "300", { kcal: "250", carbs: "30" })],
      }),
      item({
        key: "sleep",
        start: at("2026-10-13T22:40:00Z"),
        end: at("2026-10-14T06:10:00Z"),
      }),
    ]),
    day("2026-10-14", [
      item({
        key: "meal",
        start: at("2026-10-14T06:30:00Z"),
        values: { servings: "2" },
        lines: [
          line("Caffè espresso", "30", { kcal: "2" }, "ml"),
          line("Fette biscottate", "20", { kcal: "400", carbs: "80" }),
        ],
      }),
      item({
        key: "meal",
        status: "planned",
        start: at("2026-10-14T06:45:00Z"),
        lines: [line("Banana", "100", { kcal: "90", carbs: "23" })],
      }),
    ]),
  ];

  it("the night, intake, carbs and coffee before, creatine days; planned meals don't count", () => {
    expect(sessionContext(days, start, "2026-10-14", 3)).toEqual({
      sleptMin: 450,
      // 24 h before 07:15 on the 14th: from 07:15 on the 13th → pasta 360 + pizza 750 + breakfast (0.6 + 80) × 2.
      kcal24h: 360 + 750 + (0.6 + 80) * 2,
      carbs3h: 32,
      coffees3h: 1,
      creatineDays: 1,
      readiness: 3,
    });
  });

  it("creatine from the narrow read when given: days with ≥ 3 g", () => {
    const c = sessionContext(days.slice(1), start, "2026-10-14", null, [
      { day: "2026-10-01", quantity: "5", unit: "g" },
      { day: "2026-10-02", quantity: "2", unit: "g" },
      { day: "2026-10-12", quantity: "5", unit: "g" },
    ]);
    expect(c.creatineDays).toBe(2);
  });

  it("nothing logged: nothing claimed", () => {
    expect(sessionContext([day("2026-10-14", [])], start, "2026-10-14", null)).toEqual({
      sleptMin: null,
      kcal24h: null,
      carbs3h: null,
      coffees3h: 0,
      creatineDays: null,
      readiness: null,
    });
  });
});
