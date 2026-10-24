import { describe, expect, it } from "vitest";
import { dayPlans, planTag, planWords, type PlanInput } from "./plan";

const base: PlanInput = {
  today: "2026-10-23",
  from: "2026-10-20",
  to: "2026-10-26",
  models: new Map([
    ["rest", "Rest"],
    ["gym", "Gym"],
  ]),
  week: new Map([1, 2, 3, 4, 5, 6, 7].map((d) => [d, "rest"])),
  fixed: new Map([["2026-10-21", "gym"]]),
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
  it("the day's fixed copy names its model, else the week's", () => {
    const p = dayPlans(base);
    expect(p.get("2026-10-21")!.model).toEqual({ id: "gym", name: "Gym", from: "day" });
    expect(p.get("2026-10-22")!.model?.from).toBe("week");
  });

  it("cycles from today on only, with the step after", () => {
    const p = dayPlans(base);
    expect(p.get("2026-10-22")!.cycles).toEqual([]);
    const today = p.get("2026-10-23")!;
    expect(today.cycles[0]).toMatchObject({ label: "Push", rest: false, next: "Legs" });
    expect(planWords(today, true)).toBe("Giornata «Rest» · PLPRR: oggi Push, poi Legs");
    expect(p.get("2026-10-26")!.cycles[0]!.next).not.toBeNull();
  });

  it("a model archived or missing gives no model", () => {
    const p = dayPlans({ ...base, models: new Map() });
    expect(p.get("2026-10-23")!.model).toBeNull();
  });

  it("names a day in the week strip: its cycle's step, else its model", () => {
    const p = dayPlans(base);
    expect(planTag(p.get("2026-10-23"))).toBe("Push");
    expect(planTag(p.get("2026-10-21"))).toBe("Gym");
    expect(planTag(undefined)).toBe("");
  });
});
