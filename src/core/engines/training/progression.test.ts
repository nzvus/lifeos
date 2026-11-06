/**
 * Parity with v1 (src/core/training/targets.test.ts, ADR-0028/0049): v1's cases,
 * unchanged, on v2's double progression. Then the session as a whole.
 */
import { describe, expect, it } from "vitest";
import type { LastSet } from "./progression";
import { GUIDES, nextTarget } from "./progression";
import { nextSession, orderEffect, volumeState, weeklySets } from "./session";

const set = (
  reps: number | null,
  loadKg: string | null,
  extra: Partial<LastSet> = {},
): LastSet => ({
  reps,
  loadKg,
  durationS: null,
  warmup: false,
  ...extra,
});

describe("guides", () => {
  it("every guide has sane ranges", () => {
    for (const g of Object.values(GUIDES)) {
      expect(g.reps[0]).toBeLessThanOrEqual(g.reps[1]);
      expect(g.sets[0]).toBeLessThanOrEqual(g.sets[1]);
      expect(g.restS[0]).toBeLessThanOrEqual(g.restS[1]);
    }
  });
});

describe("nextTarget: double progression (v1 ADR-0028)", () => {
  const pull = GUIDES.vertical_pull;
  it("all working sets at the top: one load step up, back to the bottom", () => {
    expect(nextTarget(pull, [set(12, "40"), set(12, "40"), set(12, "40")])).toEqual({
      reason: "add_load",
      sets: 3,
      reps: [8, 12],
      loadKg: "42.5",
    });
  });
  it("not there yet: same load, one more rep on the weakest set; warm-ups ignored", () => {
    expect(
      nextTarget(pull, [set(10, "20", { warmup: true }), set(11, "40"), set(9, "40")]),
    ).toEqual({
      reason: "add_reps",
      sets: 2,
      reps: [10, 12],
      loadKg: "40",
    });
  });
  it("sets at different loads: progress from the heaviest", () => {
    expect(nextTarget(pull, [set(10, "40"), set(9, "42.5")])).toEqual({
      reason: "add_reps",
      sets: 2,
      reps: [10, 12],
      loadKg: "42.5",
    });
  });
  it("below the range: hold the load and aim for the bottom", () => {
    expect(nextTarget(pull, [set(6, "50")])).toMatchObject({
      reason: "hold",
      reps: [8, 12],
    });
  });
  it("no history: the range and a reasonable effort", () => {
    expect(nextTarget(pull, undefined)).toEqual({
      reason: "start",
      sets: 3,
      reps: [8, 12],
    });
  });
  it("bodyweight moves by reps, then asks for load or a harder variant", () => {
    const raise = GUIDES.leg_raise;
    expect(nextTarget(raise, [set(10, null), set(9, null)])).toMatchObject({
      reason: "add_reps",
      reps: [10, 15],
    });
    expect(nextTarget(raise, [set(15, null), set(15, null)])).toMatchObject({
      reason: "add_load",
      loadKg: null,
    });
  });
  it("cardio and planks move by time, about 10 %", () => {
    expect(nextTarget(GUIDES.run, [set(null, null, { durationS: 30 * 60 })])).toEqual({
      reason: "add_time",
      sets: 1,
      minutes: 33,
    });
    expect(nextTarget(GUIDES.plank, [set(null, null, { durationS: 40 })])).toMatchObject({
      reason: "add_time",
      seconds: 44,
    });
  });
});

describe("nextTarget: gated by reps left (v1 ADR-0049)", () => {
  const pull = GUIDES.vertical_pull;
  const fly = GUIDES.fly;
  const at = (reps: number, rir: number | null) => set(reps, "50", { rir });
  it("the top of the range at a sane effort adds load", () => {
    expect(nextTarget(pull, [at(12, 2), at(12, 1), at(12, 1)])).toMatchObject({
      reason: "add_load",
      loadKg: "52.5",
    });
  });
  it("the top of the range at failure holds the load", () => {
    expect(nextTarget(pull, [at(12, 1), at(12, 0), at(12, 0)])).toMatchObject({
      reason: "hold_effort",
      loadKg: "50",
      reps: [12, 12],
    });
  });
  it("at failure twice in a row: one step lighter", () => {
    expect(nextTarget(pull, [at(9, 0), at(8, 0)], [at(10, 0), at(8, 0)])).toMatchObject({
      reason: "reduce",
      loadKg: "47.5",
      reps: [8, 12],
    });
  });
  it("an isolation exercise's last set may go to failure", () => {
    expect(
      nextTarget(fly, [
        set(15, "10", { rir: 2 }),
        set(15, "10", { rir: 1 }),
        set(15, "10", { rir: 0 }),
      ]),
    ).toMatchObject({ reason: "add_load" });
  });
  it("without reps left, as before", () => {
    expect(nextTarget(pull, [at(12, null), at(12, null)])).toMatchObject({
      reason: "add_load",
    });
    expect(nextTarget(pull, [at(10, null), at(9, null)])).toMatchObject({
      reason: "add_reps",
    });
  });
});

describe("the session as a whole", () => {
  const chest = { direct: ["chest"], indirect: ["triceps"] };
  const back = { direct: ["back"], indirect: ["biceps"] };
  it("weekly sets per muscle: direct 1, indirect ½", () => {
    const muscles = new Map([
      ["bench", chest],
      ["row", back],
    ]);
    const sets = [
      { exercise: "bench" },
      { exercise: "bench" },
      { exercise: "row", warmup: true },
      { exercise: "row" },
    ];
    expect(weeklySets(sets, muscles)).toEqual(
      new Map([
        ["chest", 2],
        ["triceps", 1],
        ["back", 1],
        ["biceps", 0.5],
      ]),
    );
    expect([volumeState(9), volumeState(10), volumeState(20), volumeState(21)]).toEqual([
      "under",
      "in",
      "in",
      "over",
    ]);
  });
  const exercises = [
    {
      exercise: "bench",
      guide: GUIDES.horizontal_press,
      muscles: chest,
      last: [set(10, "60"), set(10, "60"), set(10, "60")],
    },
    {
      exercise: "row",
      guide: GUIDES.horizontal_pull,
      muscles: back,
      last: [set(12, "50"), set(12, "50"), set(12, "50")],
    },
  ];
  it("a muscle under the band gets one more set where the session trains it directly", () => {
    const weekSoFar = new Map([
      ["chest", 3],
      ["back", 12],
    ]);
    const s = nextSession({ exercises, weekSoFar, readiness: [] });
    expect(s.map((x) => [x.exercise, x.target.sets, x.adjusted])).toEqual([
      ["bench", 4, ["volume_add"]],
      ["row", 3, []],
    ]);
    expect(s[1]!.target).toMatchObject({ reason: "add_load", loadKg: "52.5" });
  });
  it("a poor day keeps the load and takes one set off every exercise", () => {
    const s = nextSession({
      exercises,
      weekSoFar: new Map(),
      readiness: ["short_night"],
    });
    expect(s.map((x) => x.target)).toEqual([
      { reason: "hold", sets: 2, reps: [6, 10], loadKg: "60" }, // was add_load to 62.5
      { reason: "hold", sets: 2, reps: [8, 12], loadKg: "50" },
    ]);
    expect(s.every((x) => x.adjusted.includes("readiness"))).toBe(true);
  });
  it("the order effect is learnt from history and shown, not applied", () => {
    const history = [
      ...[100, 102, 98].map((e1rm) => ({ exercise: "bench", position: 0, e1rm })),
      ...[94, 95, 93].map((e1rm) => ({ exercise: "bench", position: 1, e1rm })),
      ...[80, 81].map((e1rm) => ({ exercise: "row", position: 2, e1rm })),
    ];
    const order = orderEffect(history);
    expect(order.get(0)).toBe(1);
    expect(order.get(1)).toBe(0.94); // (0.974 ÷ 1.036) on the medians
    expect(order.get(2)).toBe(1); // two sessions only: says nothing
    const s = nextSession({
      exercises,
      weekSoFar: new Map([
        ["chest", 12],
        ["back", 12],
      ]),
      readiness: [],
      order,
    });
    expect(s.map((x) => x.orderFactor)).toEqual([null, 0.94]);
    expect(s[1]!.target).toMatchObject({ loadKg: "52.5" });
  });
});
