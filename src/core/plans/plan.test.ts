import { describe, expect, it } from "vitest";
import { cycleWords, dayPlans, planTag, planWords, type PlanInput } from "./plan";

const base: PlanInput = {
  today: "2026-10-23",
  from: "2026-10-20",
  to: "2026-10-26",
  cycles: [
    {
      id: "c",
      name: "PLPRR",
      start: "2026-10-20",
      advance: "occurrence",
      onSkip: "lose",
      steps: [
        { position: 0, keys: ["push"], label: "Push" },
        { position: 1, keys: ["legs"], label: "Legs" },
        { position: 2, keys: [], label: "" },
      ],
    },
  ],
  done: [
    { day: "2026-10-20", keys: ["push"] },
    { day: "2026-10-21", keys: ["legs"] },
  ],
  overrides: new Map(),
  skips: new Map(),
};

describe("what each day is supposed to be", () => {
  it("cycles from today on only, with the step after", () => {
    const p = dayPlans(base);
    expect(p.get("2026-10-22")!.cycles).toEqual([]);
    const today = p.get("2026-10-23")!;
    expect(today.cycles[0]).toMatchObject({ label: "Push", rest: false, next: "Legs" });
    expect(planWords(today, true)).toBe("PLPRR: oggi Push, poi Legs");
    expect(today.cycles[0]!.itemId).toBe("push");
    expect(cycleWords(today, true)).toBe("ciclo PLPRR: oggi Push, poi Legs");
    expect(cycleWords(p.get("2026-10-22"), true)).toBe("");
    expect(p.get("2026-10-26")!.cycles[0]!.next).not.toBeNull();
  });

  it("names a day in the week strip: its cycle's step, else nothing (PL-33)", () => {
    const p = dayPlans(base);
    expect(planTag(p.get("2026-10-23"))).toBe("Push");
    expect(planTag(p.get("2026-10-21"))).toBe("");
    expect(planTag(undefined)).toBe("");
  });
});
