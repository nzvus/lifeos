import { F } from "@lifeos/kit";
import { describe, expect, it } from "vitest";
import { kgStep, lastTimeText, restFor, setText, timed, usesDumbbells } from "./present";

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
    const { contextText, scoreText } = await import("./present");
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
      "Prima: dormito " +
        F.hm(450) +
        " · " +
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
    expect(
      scoreText(
        score(SESSION, { progression: 1, volume: 0.5, effort: null, rests: null }),
      ),
    ).toBe(
      "Sessione 79/100 · progressione 100 · volume 50 · senza: sforzo (nessun RIR), recuperi (non cronometrati)",
    );
  });
});
