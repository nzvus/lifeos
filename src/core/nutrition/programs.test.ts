/** A day type's program input and the starters (ADR-0044). */
import { describe, expect, it } from "vitest";
import { parseInput } from "../shared/validation";
import { programInput, STARTERS } from "./programs";

const slots = (rows: object[]) => JSON.stringify(rows);

describe("programInput", () => {
  it("reads times as minutes, percent as shares, and sorts the slots by time", () => {
    const r = parseInput(programInput, {
      trainingAt: "18:00",
      shiftKcal: "300",
      slots: slots([
        { kind: "post_workout", at: "19:45", kcalShare: "30", proteinShare: "35" },
        { kind: "breakfast", at: "08:00", kcalShare: "20", proteinShare: "" },
      ]),
    });
    expect(r).toEqual({
      ok: true,
      value: {
        trainingAt: 1080,
        shiftKcal: 300,
        slots: [
          { kind: "breakfast", at: 480, kcalShare: 0.2, proteinShare: null },
          { kind: "post_workout", at: 1185, kcalShare: 0.3, proteinShare: 0.35 },
        ],
      },
    });
  });

  it("no training time and no slots is an empty program", () => {
    expect(parseInput(programInput, { trainingAt: "", shiftKcal: "0" })).toEqual({
      ok: true,
      value: { trainingAt: null, shiftKcal: 0, slots: [] },
    });
  });

  it("refuses shares above 100 % in total, bad times, kinds and shifts", () => {
    expect(
      parseInput(programInput, {
        shiftKcal: "0",
        slots: slots([
          { kind: "lunch", at: "13:00", kcalShare: "60" },
          { kind: "dinner", at: "20:00", kcalShare: "50" },
        ]),
      }),
    ).toMatchObject({ ok: false, errors: { slots: "too_large" } });
    expect(
      parseInput(programInput, {
        shiftKcal: "0",
        slots: slots([{ kind: "lunch", at: "25:00" }]),
      }),
    ).toMatchObject({ ok: false });
    expect(
      parseInput(programInput, {
        shiftKcal: "0",
        slots: slots([{ kind: "brunch", at: "11:00" }]),
      }),
    ).toMatchObject({ ok: false });
    expect(parseInput(programInput, { shiftKcal: "1500" })).toMatchObject({
      ok: false,
      errors: { shiftKcal: "too_large" },
    });
  });
});

describe("STARTERS", () => {
  it("each sums to 100 % of kcal and protein, slots in time order", () => {
    for (const p of Object.values(STARTERS)) {
      const sum = (k: "kcalShare" | "proteinShare") =>
        Math.round(p.slots.reduce((a, s) => a + (s[k] ?? 0), 0) * 100);
      expect(sum("kcalShare")).toBe(100);
      expect(sum("proteinShare")).toBe(100);
      expect(p.slots.map((s) => s.at)).toEqual(
        [...p.slots.map((s) => s.at)].sort((a, b) => a - b),
      );
    }
  });
});
