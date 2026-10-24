import { describe, expect, it } from "vitest";
import type { ResolvedBlock } from "@/core/plans";
import { blockRow, readBlock, readTargets, readTime, sharesWords } from "./model-form";

const plain = (s: unknown) => JSON.parse(JSON.stringify(s).replace(/\u00a0/g, " "));

describe("a model's targets from its form", () => {
  const base = {
    mode: "dynamic",
    deficitKcal: 200,
    proteinGPerKg: "1.8",
    fatGPerKg: "0.8",
  };

  it("keeps only what differs from the base", () => {
    expect(
      readTargets(
        { mode: "dynamic", deficitKcal: "200", proteinGPerKg: "2,2", fatGPerKg: "0.8" },
        base,
      ),
    ).toEqual({ targets: { proteinGPerKg: "2.2" }, errors: {} });
    expect(
      readTargets({ mode: "dynamic", deficitKcal: "200", proteinGPerKg: "1,8" }, base)
        .targets,
    ).toBeNull();
  });

  it("fixed numbers need the energy; a word is not a number", () => {
    expect(
      readTargets({ mode: "fixed", protein: "150" }, null).errors["kcal"],
    ).toBeDefined();
    expect(
      readTargets({ mode: "fixed", kcal: "2200", protein: "molte" }, null).errors[
        "protein"
      ],
    ).toBeDefined();
    expect(readTargets({ mode: "fixed", kcal: "2200" }, base).targets).toEqual({
      mode: "fixed",
      kcal: "2200",
    });
  });
});

describe("a block from its form", () => {
  it("a meal: its role, time and shares in %", () => {
    expect(readTime("8:30")).toBe(510);
    expect(readTime("")).toBeNull();
    expect(readTime("25:00")).toBeNaN();
    expect(
      readBlock({
        kind: "meal",
        role: "lunch",
        at: "13:00",
        kcalShare: "35",
        proteinShare: "30",
      }),
    ).toEqual({
      ok: true,
      block: {
        kind: "meal",
        role: "lunch",
        atMin: 780,
        durationMin: null,
        kcalShare: "0.350",
        proteinShare: "0.300",
      },
    });
  });

  it("a session keeps its minutes, not shares; errors by field", () => {
    expect(
      readBlock({ kind: "session", at: "18:00", durationMin: "60", kcalShare: "20" }),
    ).toMatchObject({
      ok: true,
      block: { kind: "session", durationMin: 60, kcalShare: null },
    });
    const bad = readBlock({ kind: "meal", at: "dopo", kcalShare: "140" });
    expect(bad.ok).toBe(false);
    expect(Object.keys(!bad.ok ? bad.errors : {}).sort()).toEqual([
      "at",
      "kcalShare",
      "role",
    ]);
  });
});

describe("a block as a row", () => {
  const lunch: ResolvedBlock = {
    id: "l",
    kind: "meal",
    when: { type: "at", min: 780 },
    shares: { kcal: 0.35, protein: 0.3 },
    defaults: { role: "lunch" },
    origin: "base",
  };

  it("its time, name, share of the day with grams, where it comes from", () => {
    expect(
      plain(blockRow(lunch, new Map(), "Rest", { kcal: 2778, protein: 154 })),
    ).toMatchObject({
      fam: "food",
      sub: "lunch",
      title: "Pranzo",
      time: "13:00",
      meta: "35 % kcal (≈ 972 kcal) · 30 % proteine (≈ 46 g)",
      pills: [{ t: "da «Rest»", state: "info" }],
    });
  });

  it("says when the meals are far from the whole day", () => {
    expect(sharesWords([lunch])!.state).toBe("warn");
    expect(
      sharesWords([lunch, { ...lunch, id: "d", shares: { kcal: 0.65 } }])!.state,
    ).toBe("good");
  });
});
