import { describe, expect, it } from "vitest";
import { DEFAULT_RAMP, learnRamp, opensGroup, warmupSets } from "./warmups";

// Ramps as logged in the export of 29 Oct (warm-up loads before a first work set).
const ramp = (work: number, warm: [number, number][]) => [
  ...warm.map(([reps, kg]) => ({ warmup: true, reps, loadKg: String(kg) })),
  { warmup: false, reps: 10, loadKg: String(work) },
];

describe("warm-ups (session.md §5.1)", () => {
  const his = [
    ramp(60, [
      [8, 30],
      [5, 40],
      [3, 50],
    ]),
    ramp(30, [
      [8, 15],
      [5, 20],
      [3, 25],
    ]),
    ramp(40, [
      [8, 20],
      [5, 30],
      [3, 35],
    ]),
    ramp(60, [
      [8, 30],
      [5, 45],
      [3, 55],
    ]),
    ramp(30, [
      [8, 15],
      [5, 20],
      [3, 24],
    ]),
    ramp(40, [
      [8, 20],
      [5, 24],
      [3, 32],
    ]),
  ];

  it("learns the person's ramp: the usual number of sets, median % and reps", () => {
    expect(learnRamp(his)).toEqual([
      { pct: 0.5, reps: 8 },
      { pct: 0.67, reps: 5 },
      { pct: 0.83, reps: 3 },
    ]);
    expect(learnRamp(his.slice(0, 4))).toBeNull();
  });

  it("27 Oct chest press, first, 10 × 60 kg with his ramp → 30, 40, 47,5 kg", () => {
    const r = [
      { pct: 0.5, reps: 8 },
      { pct: 0.67, reps: 5 },
      { pct: 0.8, reps: 3 },
    ];
    expect(
      warmupSets({ workKg: 60, step: 2.5, ramp: r, opens: true, heaviestToday: null }),
    ).toEqual([
      { reps: 8, loadKg: 30 },
      { reps: 5, loadKg: 40 },
      { reps: 3, loadKg: 47.5 },
    ]);
  });

  it("with no past ramps: a light set and one near the work load", () => {
    expect(
      warmupSets({
        workKg: 60,
        step: 2.5,
        ramp: DEFAULT_RAMP,
        opens: true,
        heaviestToday: null,
      }),
    ).toEqual([
      { reps: 8, loadKg: 30 },
      { reps: 3, loadKg: 47.5 },
    ]);
  });

  it("opens a group only when its primary muscle was not primary before today", () => {
    // Peck back after chest press: chest already opened. Shoulder press: front delts new.
    expect(opensGroup("chest", new Set(["chest"]))).toBe(false);
    expect(opensGroup("front_delts", new Set(["chest"]))).toBe(true);
    expect(opensGroup(null, new Set())).toBe(false);
  });

  it("a later exercise: nothing, or one approach set when much heavier than today's", () => {
    const later = { step: 2.5, ramp: DEFAULT_RAMP, opens: false };
    expect(warmupSets({ ...later, workKg: 45, heaviestToday: 60 })).toEqual([]);
    expect(warmupSets({ ...later, workKg: 100, heaviestToday: 60 })).toEqual([
      { reps: 3, loadKg: 80 },
    ]);
  });

  it("no ramp for light or bodyweight work", () => {
    const p = { step: 1, ramp: DEFAULT_RAMP, opens: true, heaviestToday: null };
    expect(warmupSets({ ...p, workKg: 1.5 })).toEqual([]);
    expect(warmupSets({ ...p, workKg: null })).toEqual([]);
  });
});

describe("what to add this week (session.md §5.4)", () => {
  it("muscles under 10 weekly sets, most missing first, with the person's own exercise", async () => {
    const { missingVolume, weeklySets } = await import("./session");
    const used = [
      { id: "lat", name: "Alzate laterali", muscles: ["side_delts"] },
      { id: "bench", name: "Chest press", muscles: ["chest", "triceps"] },
      { id: "calf", name: "Calf", muscles: ["calves"] },
    ];
    const muscles = new Map(
      used.map((u) => [
        u.id,
        { direct: u.muscles.slice(0, 1), indirect: u.muscles.slice(1) },
      ]),
    );
    const sets = [
      ...Array.from({ length: 12 }, () => ({ exercise: "bench" })),
      ...Array.from({ length: 4 }, () => ({ exercise: "lat" })),
    ];
    const week = weeklySets(sets, muscles);
    expect(missingVolume(week, used)).toEqual([
      { muscle: "calves", sets: 0, exercise: { id: "calf", name: "Calf" } },
      { muscle: "side_delts", sets: 4, exercise: { id: "lat", name: "Alzate laterali" } },
    ]);
  });
});
