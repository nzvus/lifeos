import { F } from "@lifeos/kit";
import { describe, expect, it } from "vitest";
import {
  kgStep,
  lastTimeText,
  restFor,
  setText,
  timed,
  usesDumbbells,
  bestE1rm,
  strengthPill,
} from "./present";

const nb = (s: string) => s.replace(/ /g, " ");
const set = (
  reps: number | null,
  loadKg: string | null,
  durationS: number | null = null,
) => ({
  reps,
  loadKg,
  durationS,
  warmup: false,
});

describe("gym mode's words", () => {
  it("writes a set as lifted", () => {
    expect(nb(setText({ ...set(8, "60.00"), rir: 2 }, true))).toBe("8 × 60 kg · RIR 2");
    expect(setText(set(12, null))).toBe("12");
    expect(nb(setText(set(null, null, 45)))).toBe("45 s");
    expect(nb(setText(set(null, null, 1800)))).toBe("30 min");
  });

  it("says the last time in one line", () => {
    expect(
      nb(lastTimeText("2026-10-12", [set(8, "60.00"), set(8, "60.00"), set(7, "60.00")])),
    ).toBe("L’ultima volta, 12 ott: 8 · 8 · 7 × 60 kg");
    expect(nb(lastTimeText("2026-10-12", [set(10, "20"), set(8, "22.5")]))).toBe(
      "L’ultima volta, 12 ott: 10 × 20 kg, 8 × 22,5 kg",
    );
    expect(lastTimeText("2026-10-12", [])).toBe("");
  });

  it("rests by the pattern's role, steps by the load, times a plank", () => {
    expect(restFor("squat", 5)).toEqual({ low: 120, high: 180 });
    expect(restFor("curl", 10)).toEqual({ low: 60, high: 90 });
    expect(restFor(null, 10)).toEqual({ low: 90, high: 120 });
    expect([kgStep("60"), kgStep("12,5"), kgStep("")]).toEqual([2.5, 1, 1]);
    expect([timed("plank"), timed("curl"), timed(null)]).toEqual([true, false, false]);
  });
});

describe("dumbbells", () => {
  it("are known from the equipment or the name, and shown per dumbbell", () => {
    expect(usesDumbbells("Incline db press", null)).toBe(true);
    expect(usesDumbbells("Alzate laterali", "dumbbell")).toBe(true);
    expect(usesDumbbells("Lat pulldown", "cable")).toBe(false);
    expect(
      setText({
        reps: 10,
        loadKg: "25",
        durationS: null,
        loadEntry: "per_dumbbell",
      }).replace(/\u00a0/g, " "),
    ).toBe("10 × 2 × 12,5 kg");
  });
});

describe("the load stepper's step", () => {
  it("per dumbbell: 1 kg under 10 kg, 2 kg from 10 kg; else E6's plate step", async () => {
    const { kgStep } = await import("./present");
    expect(kgStep("8", true)).toBe(1);
    expect(kgStep("16", true)).toBe(2);
    expect(kgStep("40")).toBe(2.5);
    expect(kgStep("12")).toBe(1);
  });
});

describe("the session's words", () => {
  it("context in one line, only what was logged; the score with what is left out", async () => {
    const { contextText, sessionBox, muscleSplit } = await import("./present");
    const { score, SESSION } = await import("@/core/engines/judgements");
    expect(
      contextText({
        sleptMin: 450,
        kcal24h: 1871,
        carbs3h: null,
        coffees3h: 1,
        creatineDays: null,
        readiness: null,
      }),
    ).toBe(
      "Prima: " +
        F.hm(450) +
        " di sonno · " +
        F.num(1871, "kcal") +
        " nelle 24 h · 1 caffè prima",
    );
    expect(
      contextText({
        sleptMin: null,
        kcal24h: null,
        carbs3h: null,
        coffees3h: 0,
        creatineDays: null,
        readiness: null,
      }),
    ).toBe("");
    const box = sessionBox(
      score(SESSION, { progression: 1, volume: 0.5, effort: null, rests: null }),
      42,
      muscleSplit([
        { muscles: ["chest", "triceps"], sets: 6 },
        { muscles: ["side_delts"], sets: 3 },
        { muscles: ["triceps"], sets: 3 },
        { muscles: [], sets: 4 },
      ]),
      false,
    );
    expect(box.score).toMatchObject({
      value: 79,
      missing: ["sforzo (nessun RIR)", "recuperi (non cronometrati)"],
    });
    expect(box.score!.parts.map((x) => x.name)).toEqual(["progressione", "volume"]);
    expect(box.title).toBe("La sessione finora");
    expect(box.pills!.map((x) => x.t.replace(/\u00a0/g, " "))).toEqual([
      "petto 50 %",
      "spalle 25 %",
      "braccia 25 %",
    ]);
    expect(box.strip![0]).toEqual({ w: 50, c: "var(--muscle-chest)" });
  });
});

describe("the gym's pills", () => {
  it("what came before, a short night or a low readiness in warn; the rest against the plan", async () => {
    const { contextPills, restPill } = await import("./present");
    const pills = contextPills({
      sleptMin: 380,
      kcal24h: 2100,
      carbs3h: null,
      coffees3h: 0,
      creatineDays: 26,
      readiness: 2,
    });
    expect(pills.map((p) => p.state)).toEqual(["warn", "info", "info", "warn"]);
    expect(restPill(80, 90)).toEqual({ t: "riposo 1:20 / 1:30", state: "good" });
    expect(restPill(150, 90)!.state).toBe("warn");
    expect(restPill(null, 90)).toBeNull();
  });
});

describe("«forza stimata» (the board Gym's first context pill)", () => {
  const set = (reps: number, kg: string, rir: number | null = null, warmup = false) => ({
    reps,
    loadKg: kg,
    durationS: null,
    warmup,
    rir,
  });
  it("today's best e1RM against last time's, good unless it fell over 2 %", () => {
    // 8 × 30 kg at RIR 2: 30 × (1 + 10/30) = 40.
    expect(bestE1rm([set(8, "30", 2), set(20, "10", null, true)])).toBe(40);
    expect(strengthPill([set(8, "30", 2)], 39.2)).toEqual({
      t: "forza stimata 40 · +2 %",
      state: "good",
    });
    expect(strengthPill([set(6, "30", 0)], 40)?.state).toBe("warn");
    expect(strengthPill([set(6, "30", 0)], null)).toEqual({
      t: "forza stimata 36",
      state: "info",
    });
    expect(strengthPill([], 40)).toBeNull();
  });
});
