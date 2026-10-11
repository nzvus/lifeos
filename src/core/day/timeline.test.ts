/** The day as one timeline (ADR-0050). */
import { describe, expect, it } from "vitest";
import { DEFAULT_BOUNDS, groupByMoment, type Moment } from "../nutrition/moments";
import { STARTERS } from "../nutrition/programs";
import { withSlots } from "../nutrition/slots";
import { defaultSlots, SESSION_DEFAULT_AT, timeline } from "./timeline";

// Times are UTC; Rome is UTC+2 in October.
const e = (moment: Moment, at: string | null) => ({
  moment,
  at: at && `2026-10-10T${at}:00Z`,
  status: "eaten" as const,
  totals: { nutrients: { kcal: "500", protein: "30" } },
});
const day = { kcal: 2400, protein: 160, kg: 76 };

describe("timeline", () => {
  const groups = groupByMoment(
    [e("breakfast", "06:10"), e("lunch", "11:00")],
    "Europe/Rome",
  );
  const items = withSlots(groups, STARTERS.gymEvening.slots, day);
  const pull = { id: "s1", label: "Pull", status: "planned" as const, at: 18 * 60 };

  it("orders slots, food, training and now by the time of day", () => {
    const rows = timeline(items, [pull], 14 * 60 + 20, false);
    expect(
      rows.map((r) =>
        r.type === "group"
          ? r.item.group.moment
          : r.type === "empty"
            ? `(${r.item.moment})`
            : r.type,
      ),
    ).toEqual([
      "breakfast",
      "lunch",
      "now",
      "(pre_workout)",
      "session",
      "(post_workout)",
      "(pre_sleep)",
    ]);
  });

  it("an empty slot is past once its time has gone, or when the day is over", () => {
    const rows = timeline(items, [], 17 * 60, false);
    const pre = rows.find((r) => r.type === "empty" && r.item.moment === "pre_workout");
    const post = rows.find((r) => r.type === "empty" && r.item.moment === "post_workout");
    expect(pre?.type === "empty" && pre.past).toBe(true);
    expect(post?.type === "empty" && post.past).toBe(false);
    expect(
      timeline(items, [], null, true).every((r) => r.type !== "empty" || r.past),
    ).toBe(true);
  });

  it("no now line on another day; a session without time sits at the usual hour", () => {
    const rows = timeline(items, [{ ...pull, at: null }], null, false);
    expect(rows.some((r) => r.type === "now")).toBe(false);
    expect(rows.find((r) => r.type === "session")?.at).toBe(SESSION_DEFAULT_AT);
  });
});

describe("defaultSlots", () => {
  it("the main meals at their usual times, without shares", () => {
    expect(defaultSlots(DEFAULT_BOUNDS).map((s) => [s.kind, s.at, s.kcalShare])).toEqual([
      ["breakfast", 480, null],
      ["lunch", 780, null],
      ["dinner", 1200, null], // 20:00
    ]);
  });
});

describe("events on the timeline (2026-10-11)", () => {
  it("sit in time order among the rest", () => {
    const rows = timeline([], [], null, false, [
      { id: "m", kind: "money", at: 12 * 60, text: "lunch" },
      { id: "wake", kind: "wake", at: 7 * 60, text: "woke" },
    ]);
    expect(rows.map((r) => (r.type === "event" ? r.event.id : r.type))).toEqual([
      "wake",
      "m",
    ]);
  });
});
