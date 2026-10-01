/** Tests for core/training/program.ts (ADR-0024): the cycle slips, nothing is lost. */
import { describe, expect, it } from "vitest";
import { programPlan, type Slot } from "./program";

const slots: Slot[] = [
  { position: 0, routineId: "push", label: "" },
  { position: 1, routineId: "pull", label: "" },
  { position: 2, routineId: null, label: "Rest" },
  { position: 3, routineId: "legs", label: "" },
];
const names = (r: ReturnType<typeof programPlan>) =>
  r.plan.map(
    (d) => `${d.day.slice(8)} ${d.slot.routineId ?? "rest"}${d.late ? "!" : ""}`,
  );

describe("programPlan", () => {
  it("lays the cycle on the days from the start", () => {
    const r = programPlan({
      slots,
      startDay: "2026-10-01",
      today: "2026-10-01",
      done: [],
      days: 6,
    });
    expect(names(r)).toEqual([
      "01 push",
      "02 pull",
      "03 rest",
      "04 legs",
      "05 push",
      "06 pull",
    ]);
  });

  it("a missed day slips the cycle: what was due is still due, marked late", () => {
    const r = programPlan({
      slots,
      startDay: "2026-10-01",
      today: "2026-10-03",
      done: [{ day: "2026-10-01", routineId: "push" }], // 2 Oct: pull skipped
      days: 3,
    });
    expect(names(r)).toEqual(["03 pull!", "04 rest", "05 legs"]);
  });

  it("a rest day passes by itself; training on it takes the rest as done", () => {
    const rested = programPlan({
      slots,
      startDay: "2026-10-01",
      today: "2026-10-04",
      done: [
        { day: "2026-10-01", routineId: "push" },
        { day: "2026-10-02", routineId: "pull" },
      ],
      days: 2,
    });
    expect(names(rested)).toEqual(["04 legs", "05 push"]);
    const trained = programPlan({
      slots,
      startDay: "2026-10-01",
      today: "2026-10-04",
      done: [
        { day: "2026-10-01", routineId: "push" },
        { day: "2026-10-02", routineId: "pull" },
        { day: "2026-10-03", routineId: "legs" },
      ],
      days: 2,
    });
    expect(names(trained)).toEqual(["04 push", "05 pull"]);
  });

  it("another routine of the round counts for its own slot; extras are ignored", () => {
    const r = programPlan({
      slots,
      startDay: "2026-10-01",
      today: "2026-10-02",
      done: [
        { day: "2026-10-01", routineId: "pull" }, // pull instead of push
        { day: "2026-10-01", routineId: "football" }, // not in the program
      ],
      days: 4,
    });
    // Push is still due (late); pull is skipped when reached.
    expect(names(r)).toEqual(["02 push!", "03 rest", "04 legs", "05 push"]);
  });

  it("done today: the plan starts tomorrow", () => {
    const r = programPlan({
      slots,
      startDay: "2026-10-01",
      today: "2026-10-01",
      done: [{ day: "2026-10-01", routineId: "push" }],
      days: 2,
    });
    expect(r.doneToday).toBe(true);
    expect(names(r)).toEqual(["02 pull"]);
  });

  it("a program starting later begins on its start day; no slots, no plan", () => {
    expect(
      names(
        programPlan({
          slots,
          startDay: "2026-10-05",
          today: "2026-10-01",
          done: [],
          days: 6,
        }),
      ),
    ).toEqual(["05 push", "06 pull"]);
    expect(
      programPlan({
        slots: [],
        startDay: "2026-10-01",
        today: "2026-10-01",
        done: [],
        days: 3,
      }).plan,
    ).toEqual([]);
  });
});
