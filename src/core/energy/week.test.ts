import { describe, expect, it } from "vitest";
import { addDays } from "../engines/time";
import { classOf } from "../engines/expenditure";
import type { EnergyRows } from "./read";
import { weekEnergy } from "./week";

const clock = { timeZone: "Europe/Rome", boundaryMin: 240 };
const from = "2026-08-24";
const to = "2026-10-18";
const days = Array.from({ length: 56 }, (_, i) => addDays(from, i));

/** 56 days of a person eating `kcal` and weighing `kg(i)` each fasted morning. */
const person = (kcal: number, kg: (i: number) => number): EnergyRows => ({
  meals: days.map((day) => ({ day, kcal, estimated: false })),
  closed: days,
  partial: [],
  weighIns: days.map((day, i) => ({
    day,
    at: new Date(day + "T05:30:00Z"),
    kg: kg(i),
    fasted: true,
    afterToilet: true,
    afterTraining: false,
  })),
  steps: [],
  sessions: [],
  profile: { sex: "male", birthYear: 2003, heightCm: 183 },
});

describe("the week's energy (E4 once a week)", () => {
  it("steady weight on 2 500 kcal: the expenditure is found near 2 500", () => {
    const w = weekEnergy(
      person(2500, () => 76),
      { from, to, today: "2026-10-19", clock, goal: null },
    )!;
    expect(Math.abs(w.expenditureKcal - 2500)).toBeLessThan(150);
    expect(w).toMatchObject({ source: "auto", deficitKcal: null, loggedDays: 56 });
    // The priors' parts: TEF ≈ 10 % of 2 500, no steps or training logged.
    expect(w.priors).toMatchObject({ steps: 0, training: 0 });
    expect(w.priors.tef).toBeGreaterThan(200);
    expect(w.priors.bmr).toBeGreaterThan(1700);
  });

  it("losing 0.25 kg a week on 2 300 kcal: the expenditure is above what is eaten", () => {
    const w = weekEnergy(
      person(2300, (i) => 78 - (0.25 / 7) * i),
      { from, to, today: "2026-10-19", clock, goal: null },
    )!;
    expect(w.expenditureKcal).toBeGreaterThan(2400);
  });

  it("a recomposition's deficit from its pace, never over 500 kcal (§8, 3)", () => {
    const goal = { kind: "recomp" as const, targetKg: 72.3, targetDay: "2026-12-20" };
    const w = weekEnergy(
      person(2500, () => 76.3),
      { from, to, today: "2026-10-19", clock, goal },
    )!;
    expect(w.ratePctWeek).toBe(-0.5);
    expect(w.deficitKcal!).toBeGreaterThan(250);
    expect(w.deficitKcal!).toBeLessThanOrEqual(500);
    expect(w.bmr).toBe(1797);
  });

  it("cardio by its catalog kind: an elliptical (pattern «other») costs its timed minutes", () => {
    const withSession = (cardio: boolean, cardioMin: number | null) =>
      weekEnergy(
        {
          ...person(2500, () => 76),
          sessions: [
            {
              id: "s1",
              day: "2026-10-15",
              minutes: 40,
              exercises: [{ pattern: "other", cardio, cardioMin, sets: [] }],
            },
          ],
        },
        { from, to, today: "2026-10-19", clock, goal: null },
      )!.priors.training;
    // As a lift with no sets it cost nothing; as cardio, 40 min at a moderate band.
    expect(withSession(false, null)).toBe(0);
    expect(withSession(true, 40)).toBeGreaterThan(0);
    expect(withSession(true, 40)).toBeGreaterThan(withSession(true, 20));
  });

  it("nothing without the body in the settings or a weigh-in", () => {
    expect(
      weekEnergy(
        { ...person(2500, () => 76), profile: null },
        { from, to, today: to, clock, goal: null },
      ),
    ).toBeNull();
    expect(
      weekEnergy(
        { ...person(2500, () => 76), weighIns: [] },
        { from, to, today: to, clock, goal: null },
      ),
    ).toBeNull();
  });
});

describe("what kind of work an exercise is (E4a)", () => {
  it("by its pattern; cardio apart", () => {
    expect(classOf("squat")).toBe("lowerCompound");
    expect(classOf("vertical_pull")).toBe("upperCompound");
    expect(classOf("plank")).toBe("core");
    expect(classOf("curl")).toBe("isolation");
    expect(classOf(null)).toBe("isolation");
    expect(classOf("run")).toBeNull();
  });
});
