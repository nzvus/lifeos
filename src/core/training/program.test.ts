/** Tests for core/training/program.ts (ADR-0024): the cycle slips, nothing is lost. */
import { describe, expect, it } from "vitest";
import { programPlan, type Slot } from "./program";

/** A day with one routine (null: rest), as most tests need. */
const slot = (position: number, routineId: string | null, label = ""): Slot => ({
  position,
  items: routineId ? [{ routineId, exerciseId: null }] : [],
  label,
});
const first = (s: Slot) => s.items[0]?.routineId ?? s.items[0]?.exerciseId ?? null;
const slots: Slot[] = [
  slot(0, "push"),
  slot(1, "pull"),
  slot(2, null, "Rest"),
  slot(3, "legs"),
];
const names = (r: ReturnType<typeof programPlan>) =>
  r.plan.map(
    (d) =>
      `${d.day.slice(8)} ${first(d.slot) ?? "rest"}${d.late ? "!" : ""}${d.skipped ? " skipped" : ""}`,
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

  it("an exercise slot counts any session with that exercise", () => {
    const run: Slot[] = [
      slot(0, "push"),
      { position: 1, items: [{ routineId: null, exerciseId: "run" }], label: "" },
    ];
    const r = programPlan({
      slots: run,
      startDay: "2026-10-01",
      today: "2026-10-03",
      done: [
        { day: "2026-10-01", routineId: "push" },
        { day: "2026-10-02", routineId: null, exerciseIds: ["run"] },
      ],
      days: 2,
    });
    expect(r.plan.map((d) => first(d.slot))).toEqual(["push", "run"]);
  });
});

describe("programPlan with overrides (ADR-0029)", () => {
  const base = { slots, startDay: "2026-10-01", today: "2026-10-01", done: [], days: 6 };

  it("a swap of two days exchanges them; the rest of the cycle stays", () => {
    const r = programPlan({
      ...base,
      overrides: [
        { day: "2026-10-01", position: 1 },
        { day: "2026-10-02", position: 0 },
      ],
    });
    expect(names(r)).toEqual([
      "01 pull",
      "02 push",
      "03 rest",
      "04 legs",
      "05 push",
      "06 pull",
    ]);
  });

  it("moving a slot later: the cycle skips it until its day, no double", () => {
    // Legs (normally on the 4th) moved to the 6th.
    const r = programPlan({ ...base, overrides: [{ day: "2026-10-06", position: 3 }] });
    expect(names(r)).toEqual([
      "01 push",
      "02 pull",
      "03 rest",
      "04 push",
      "05 pull",
      "06 legs",
    ]);
    expect(names(r).filter((x) => x.endsWith("legs"))).toHaveLength(1);
  });

  it("moving a slot earlier takes it out of its usual day", () => {
    const r = programPlan({ ...base, overrides: [{ day: "2026-10-02", position: 3 }] });
    expect(names(r)).toEqual([
      "01 push",
      "02 legs",
      "03 pull",
      "04 rest",
      "05 push",
      "06 pull",
    ]);
  });

  it("a rest override pauses the cycle (a rest due is taken instead)", () => {
    const r = programPlan({
      ...base,
      overrides: [{ day: "2026-10-01", position: null }],
    });
    expect(names(r)).toEqual([
      "01 rest",
      "02 push",
      "03 pull",
      "04 rest",
      "05 legs",
      "06 push",
    ]);
    const onRest = programPlan({
      ...base,
      overrides: [{ day: "2026-10-03", position: null }],
    });
    expect(names(onRest)).toEqual(names(programPlan(base)));
  });

  it("past overrides and unknown slots change nothing", () => {
    const r = programPlan({
      ...base,
      today: "2026-10-03",
      done: [
        { day: "2026-10-01", routineId: "push" },
        { day: "2026-10-02", routineId: "pull" },
      ],
      overrides: [
        { day: "2026-10-01", position: 3 },
        { day: "2026-10-04", position: 9 },
      ],
    });
    expect(names(r)[0]).toBe("03 rest");
    expect(names(r)[1]).toBe("04 legs");
  });

  it("ADR-0035: a day with several items counts when any of them is done", () => {
    const both: Slot[] = [
      {
        position: 0,
        items: [
          { routineId: "push", exerciseId: null },
          { routineId: null, exerciseId: "run" },
        ],
        label: "",
      },
      slot(1, "legs"),
    ];
    const r = programPlan({
      slots: both,
      startDay: "2026-10-01",
      today: "2026-10-02",
      done: [{ day: "2026-10-01", routineId: null, exerciseIds: ["run"] }],
      days: 1,
    });
    expect(names(r)).toEqual(["02 legs"]);
  });

  it("ADR-0035: a skipped day passes the slot due, and nothing is late", () => {
    // Coming: 03 is skipped — pull passes, rest and legs follow.
    const coming = programPlan({
      slots,
      startDay: "2026-10-01",
      today: "2026-10-02",
      done: [{ day: "2026-10-01", routineId: "push" }],
      days: 4,
      skips: ["2026-10-03"],
    });
    expect(names(coming)).toEqual(["02 pull", "03 rest", "04 legs", "05 push"]);
    const today = programPlan({
      slots,
      startDay: "2026-10-01",
      today: "2026-10-02",
      done: [{ day: "2026-10-01", routineId: "push" }],
      days: 3,
      skips: ["2026-10-02"],
    });
    expect(names(today)).toEqual(["02 pull skipped", "03 rest", "04 legs"]);
    // Past: pull was skipped on 02, so on 04 nothing is late.
    const past = programPlan({
      slots,
      startDay: "2026-10-01",
      today: "2026-10-04",
      done: [{ day: "2026-10-01", routineId: "push" }],
      days: 1,
      skips: ["2026-10-02"],
    });
    expect(names(past)).toEqual(["04 legs"]);
  });
});
