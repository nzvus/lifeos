/** Tests for core/training/progress.ts: week volume, routines, exercise trends. */
import { describe, expect, it } from "vitest";
import { dayBurn, exerciseTrends, routineProgress, weekSummary } from "./progress";

const set = (reps: number, loadKg: string, warmup = false) => ({ reps, loadKg, warmup });
type Ex = {
  exerciseId: string;
  kind: "strength" | "cardio";
  muscleGroups: string[];
  sets: ReturnType<typeof set>[];
};
const lat = (...sets: ReturnType<typeof set>[]): Ex => ({
  exerciseId: "lat",
  kind: "strength",
  muscleGroups: ["lats", "biceps"],
  sets,
});
const session = (
  day: string,
  label: string,
  exercises: Ex[],
  v: { status?: string; routineId?: string | null; durationMin?: number | null } = {},
) => ({
  id: `${label}-${day}`,
  day,
  label,
  status: v.status ?? "done",
  durationMin: v.durationMin ?? 60,
  routineId: v.routineId ?? null,
  exercises,
});

describe("weekSummary", () => {
  it("counts working sets per group, 1 for the main one and 0.5 for the others", () => {
    const w = weekSummary(
      [
        session("2026-09-28", "PULL 4", [
          lat(set(10, "30", true), set(10, "35"), set(8, "35")),
        ]),
        session("2026-09-30", "Pull", [lat(set(10, "35"))]),
        session("2026-10-01", "Pull", [lat(set(10, "40"))], { status: "planned" }),
        session("2026-10-05", "Pull", [lat(set(10, "40"))]), // next week
        session("2026-09-29", "Corsa", [
          { exerciseId: "run", kind: "cardio", muscleGroups: [], sets: [set(0, "0")] },
        ]),
      ],
      [{ day: "2026-05-31", weightKg: "76" }],
      "2026-09-28",
    );
    expect([w.from, w.to, w.sessions, w.sets, w.minutes]).toEqual([
      "2026-09-28",
      "2026-10-04",
      3,
      3,
      180,
    ]);
    expect(Object.fromEntries(w.byGroup)).toEqual({ lats: 3, biceps: 1.5 });
    expect(w.tonnage).toBe(350 + 280 + 350);
    // 3 sessions × 60 min at 3.5–6 MET × 76 kg.
    expect(w.burn).toEqual({ low: 3 * 266, high: 3 * 456 });
  });

  it("an empty week has zeros and no burn", () => {
    const w = weekSummary([], [], "2026-09-28");
    expect([w.sessions, w.sets, w.tonnage, w.burn, w.byGroup.size]).toEqual([
      0,
      0,
      0,
      null,
      0,
    ]);
  });
});

describe("routineProgress", () => {
  it("finds runs by link or by name, with tonnage per run and the last change", () => {
    const [pull, legs] = routineProgress(
      [
        { id: "r-pull", name: "Pull" },
        { id: "r-legs", name: "Legs" },
      ],
      [
        session("2026-09-15", "PULL 1", [lat(set(10, "30"))]),
        session("2026-09-21", "whatever", [lat(set(10, "33"))], { routineId: "r-pull" }),
        session("2026-09-28", "Pull", [lat(set(10, "30"), set(10, "36"))]),
        session("2026-10-02", "Pull", [lat(set(10, "50"))], { status: "planned" }),
      ],
    );
    expect(pull).toEqual({
      id: "r-pull",
      name: "Pull",
      runs: 3,
      last: { day: "2026-09-28", sessionId: "Pull-2026-09-28", tonnage: 660, sets: 2 },
      change: 100,
      series: [300, 330, 660],
    });
    expect(legs).toEqual({
      id: "r-legs",
      name: "Legs",
      runs: 0,
      last: null,
      change: null,
      series: [],
    });
  });
});

describe("exerciseTrends", () => {
  it("compares the latest e1RM with the one about 4 weeks earlier", () => {
    const [t] = exerciseTrends([
      session("2026-08-20", "Pull", [lat(set(10, "30"))]), // e1RM 40
      session("2026-09-01", "Pull", [lat(set(10, "33"))]), // 44
      session("2026-09-15", "Pull", [lat(set(10, "36"))]), // 48
      session("2026-10-01", "Pull", [lat(set(10, "39"))]), // 52
    ]);
    // 2026-10-01 − 28 days = 09-03: the reference is 09-01 (44), not 08-20.
    expect(t!.exerciseId).toBe("lat");
    expect(t!.lastDay).toBe("2026-10-01");
    expect(t!.sessions).toBe(4);
    expect(t!.e1rm).toBeCloseTo(52);
    expect(t!.change).toBe(18);
    expect(t!.series.map(Math.round)).toEqual([40, 44, 48, 52]);
  });

  it("a short history compares with its start; a single point has no change", () => {
    const [two] = exerciseTrends([
      session("2026-09-25", "Pull", [lat(set(10, "30"))]),
      session("2026-10-01", "Pull", [lat(set(10, "33"))]),
    ]);
    expect(two!.change).toBe(10);
    const [one] = exerciseTrends([session("2026-10-01", "Pull", [lat(set(10, "30"))])]);
    expect(one!.change).toBeNull();
  });
});

describe("dayBurn", () => {
  it("sums the done sessions, and the planned ones only 'with the plan'", () => {
    const kg = [{ day: "2026-09-01", weightKg: "75" }];
    const done = session("2026-10-01", "Pull", [lat(set(10, "40"))]);
    const planned = session("2026-10-01", "Push", [lat(set(10, "40"))], {
      status: "planned",
    });
    const one = dayBurn([done], kg);
    const both = dayBurn([done, planned], kg);
    expect(both.done).toEqual(one.done);
    expect(both.withPlanned).toEqual({
      low: one.done!.low * 2,
      high: one.done!.high * 2,
    });
    expect(dayBurn([], kg)).toEqual({ done: null, withPlanned: null });
  });
});
