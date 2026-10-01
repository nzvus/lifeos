/** Tests for core/training/analysis.ts, anchored on the developer's real numbers. */
import { describe, expect, it } from "vitest";
import {
  bestE1rm,
  burnRange,
  cardioMet,
  change,
  e1rm,
  exerciseHistory,
  records,
  sessionMinutes,
  sessionTonnage,
  tonnage,
  trainingByDay,
  weightAt,
} from "./analysis";

const s = (reps: number, load: number | null, warmup = false) => ({
  reps,
  loadKg: load === null ? null : String(load),
  warmup,
});

describe("tonnage", () => {
  it("matches the hand-made PUSH 1 figure (2026-09-11): 4 722 kg", () => {
    const push1 = [
      [s(12, 45), s(8, 50), s(10, 45)], // machine chest press
      [s(10, 35), s(8, 35), s(10, 30)], // peck back
      [s(10, 14), s(10, 14), s(8, 14)], // incline db press, "da 14" as written
      [s(9, 25), s(8, 25), s(7, 20)], // shoulder press
      [s(8, 10), s(9, 5), s(8, 5)], // cable lateral raise (unilateral, not doubled)
      [s(10, 25), s(10, 25), s(8, 25)], // overhead cable triceps extension
      [s(6, 30), s(8, 25), s(10, 20)], // cable triceps pushdown
    ];
    expect(push1.reduce((sum, sets) => sum + tonnage(sets), 0)).toBe(4722);
  });

  it("matches PULL 1 (2026-09-15): 4 080 kg — pairs doubled, '+ asta' left out", () => {
    const approx = (reps: number, load: number) => ({
      ...s(reps, load),
      loadApprox: true,
    });
    const pull1 = [
      [s(10, 35), s(10, 35), s(10, 35)], // pulley row
      [s(10, 20), s(8, 20), s(10, 15)], // reverse peck deck
      [s(8, 35), s(10, 30), s(10, 30)], // chest supp row "con 2 da 17.5 / 15"
      [s(8, 35), s(10, 30), s(8, 30)], // lat pulldown
      [approx(10, 10), approx(10, 10), approx(10, 10)], // preacher "con 2 da 5 + asta"
      [s(8, 35), s(10, 30), s(8, 30)], // cable biceps curl
    ];
    expect(pull1.reduce((sum, sets) => sum + tonnage(sets), 0)).toBe(4080);
  });

  it("leaves out warm-ups and sets without a load", () => {
    expect(tonnage([s(5, 30, true), s(10, 60), s(10, null)])).toBe(600);
  });
});

describe("e1RM and comparisons", () => {
  it("uses Epley for 1–12 reps only", () => {
    expect(e1rm(10, "60")).toBe(80);
    expect(e1rm(15, "60")).toBeNull();
    expect(e1rm(8, null)).toBeNull();
    expect(bestE1rm([s(10, 60), s(6, 55), s(3, 70, true)])).toBe(80);
  });

  it("gives whole-percent changes", () => {
    expect(change(5480, 4722)).toBe(-14); // PUSH pre → PUSH 1, as in the diet plan
    expect(change(null, 10)).toBeNull();
  });

  it("keeps the heaviest load and best e1RM per exercise, with the day", () => {
    const r = records([
      {
        day: "2026-09-11",
        exercises: [{ exerciseId: "chest", sets: [s(12, 45), s(8, 50)] }],
      },
      {
        day: "2026-09-23",
        exercises: [{ exerciseId: "chest", sets: [s(10, 60), s(6, 55)] }],
      },
    ]);
    expect(r.get("chest")).toEqual({
      maxLoad: { kg: 60, day: "2026-09-23" },
      bestE1rm: { kg: 80, day: "2026-09-23" },
    });
  });
});

describe("burn range", () => {
  it("computes treadmill MET from speed and incline (ACSM walking)", () => {
    // FitForge's treadmill: 5 km/h (83.3 m/min), 12 % incline →
    // VO2 = 0.1·83.3 + 1.8·83.3·0.12 + 3.5 = 29.8 ml/kg/min → 8.5 MET.
    // FitForge said 227 kcal for 20 min at 76 kg ≈ 9 MET: consistent.
    expect(cardioMet(5, 12)).toBeCloseTo(8.52, 2);
  });

  it("gives a range, never a single number, and nothing without a weight", () => {
    const session = {
      durationMin: 60,
      exercises: [
        { kind: "strength" as const, sets: [s(10, 40)] },
        {
          kind: "cardio" as const,
          sets: [
            {
              reps: null,
              loadKg: null,
              warmup: false,
              durationS: 1200,
              speedKmh: "5",
              inclinePct: "12",
            },
          ],
        },
      ],
    };
    const r = burnRange(session, "76");
    // 40 min strength at 3.5–5 MET (rests included) + 20 min treadmill at 8.52 MET ±15 %.
    const met = cardioMet(5, 12);
    expect(r).toEqual({
      low: Math.round(3.5 * 76 * (40 / 60) + met * 0.85 * 76 * (20 / 60)),
      high: Math.round(5 * 76 * (40 / 60) + met * 1.15 * 76 * (20 / 60)),
    });
    expect(burnRange(session, null)).toBeNull();
  });
});

describe("session helpers", () => {
  it("adds up a session's tonnage", () => {
    expect(
      sessionTonnage([{ sets: [s(10, 60)] }, { sets: [s(8, 25), s(8, 25, true)] }]),
    ).toBe(800);
  });

  it("uses the latest weight on or before a day, else the first after", () => {
    const m = [
      { day: "2026-09-20", weightKg: "74.50" },
      { day: "2026-05-31", weightKg: "76.00" },
    ];
    expect(weightAt(m, "2026-09-28")).toBe("74.50");
    expect(weightAt(m, "2026-06-10")).toBe("76.00");
    expect(weightAt(m, "2026-01-01")).toBe("76.00");
    expect(weightAt([], "2026-01-01")).toBeNull();
  });
});

describe("exerciseHistory", () => {
  it("follows one exercise through done sessions, oldest first", () => {
    const h = exerciseHistory(
      [
        {
          id: "b",
          day: "2026-09-23",
          status: "done",
          exercises: [{ exerciseId: "chest", sets: [s(10, 60)] }],
        },
        {
          id: "a",
          day: "2026-09-11",
          status: "done",
          exercises: [{ exerciseId: "chest", sets: [s(12, 45)] }],
        },
        {
          id: "c",
          day: "2026-10-01",
          status: "planned",
          exercises: [{ exerciseId: "chest", sets: [s(10, 65)] }],
        },
      ],
      "chest",
    );
    expect(h.map((p) => [p.day, Math.round(p.bestE1rm!), p.tonnage])).toEqual([
      ["2026-09-11", 63, 540],
      ["2026-09-23", 80, 600],
    ]);
  });
});

describe("trainingByDay", () => {
  it("adds up done sessions per day, zeros elsewhere, burn with that day's weight", () => {
    const strength = (load: number) => ({
      kind: "strength" as const,
      sets: [s(10, load)],
    });
    const r = trainingByDay(
      ["2026-09-27", "2026-09-28", "2026-09-29"],
      [
        { day: "2026-09-28", status: "done", durationMin: 60, exercises: [strength(40)] },
        {
          day: "2026-09-28",
          status: "done",
          durationMin: null,
          exercises: [strength(20)],
        },
        {
          day: "2026-09-29",
          status: "planned",
          durationMin: 60,
          exercises: [strength(50)],
        },
      ],
      [{ day: "2026-09-01", weightKg: "76" }],
    );
    expect(r).toEqual([
      { day: "2026-09-27", sessions: 0, tonnage: 0, burn: null },
      {
        day: "2026-09-28",
        sessions: 2,
        tonnage: 600,
        // The second has no time: one set ≈ 45 s + 90 s rest = 2 min.
        burn: { low: 266 + 9, high: 380 + 13 },
      },
      { day: "2026-09-29", sessions: 0, tonnage: 0, burn: null }, // plans don't count
    ]);
  });
});

describe("burn outdoors", () => {
  it("takes the speed from distance and time: 5 km in 30 min runs at 10 km/h", () => {
    const run = {
      durationMin: 30,
      exercises: [
        {
          kind: "cardio" as const,
          sets: [
            { reps: null, loadKg: null, warmup: false, durationS: 1800, distanceM: 5000 },
          ],
        },
      ],
    };
    const met = cardioMet(10, 0); // ACSM running
    expect(burnRange(run, "76")).toEqual({
      low: Math.round(met * 0.85 * 76 * 0.5),
      high: Math.round(met * 1.15 * 76 * 0.5),
    });
  });
});

describe("burnRange of an estimated session (ADR-0016)", () => {
  const est = (v: {
    durationMin?: number | null;
    intensity?: "light" | "moderate" | "vigorous" | null;
    kcalEstimate?: number | null;
  }) => ({
    durationMin: v.durationMin ?? null,
    exercises: [],
    intensity: v.intensity ?? null,
    kcalEstimate: v.kcalEstimate ?? null,
  });

  it("the user's kcal ±15 %, with or without a weight", () => {
    expect(burnRange(est({ kcalEstimate: 600 }), null)).toEqual({ low: 510, high: 690 });
  });

  it("else the intensity's MET band × weight × time", () => {
    // 90 min football, vigorous, 76 kg: 6–9 MET × 76 × 1.5.
    expect(burnRange(est({ durationMin: 90, intensity: "vigorous" }), "76")).toEqual({
      low: 684,
      high: 1026,
    });
    expect(burnRange(est({ durationMin: 90, intensity: "vigorous" }), null)).toBeNull();
    expect(burnRange(est({ intensity: "light" }), "76")).toBeNull();
  });
});

describe("sessionMinutes", () => {
  it("the typed duration, else sets' time and rests, else null", () => {
    const set = { reps: 10, loadKg: "40", warmup: false };
    expect(sessionMinutes({ durationMin: 50, exercises: [] })).toBe(50);
    // 4 sets × (45 s + 120 s rest) = 11 min; a timed set counts its own time.
    expect(
      sessionMinutes({
        durationMin: null,
        exercises: [
          { restS: 120, sets: [set, set, set, set] },
          { sets: [{ ...set, durationS: 600 }] },
        ],
      }),
    ).toBe(21);
    expect(sessionMinutes({ durationMin: null, exercises: [] })).toBeNull();
  });
});
