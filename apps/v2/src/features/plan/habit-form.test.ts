import { describe, expect, it } from "vitest";
import { readHabit, ruleWords } from "./habit-form";

describe("a habit's form", () => {
  it("what, how often, when, how long", () => {
    expect(
      readHabit(
        {
          name: "Studio",
          what: "activity:study",
          rule: "weekdays",
          at: "18:00",
          durationMin: "90",
        },
        [3, 1],
      ),
    ).toEqual({
      ok: true,
      habit: {
        name: "Studio",
        kind: "activity",
        category: "study",
        recurrence: { type: "weekdays", days: [1, 3] },
        atMin: 1080,
        durationMin: 90,
      },
    });
    expect(
      readHabit({ name: "Stretching", what: "chore", rule: "times", n: "3" }, []),
    ).toMatchObject({
      ok: true,
      habit: {
        kind: "chore",
        category: null,
        recurrence: { type: "timesPerWeek", n: 3 },
        atMin: null,
      },
    });
  });

  it("errors by field", () => {
    const r = readHabit(
      { name: "", what: "meal", rule: "weekdays", at: "dopo", n: "" },
      [],
    );
    expect(r.ok ? [] : Object.keys(r.errors).sort()).toEqual([
      "at",
      "name",
      "rule",
      "what",
    ]);
  });

  it("the rule in words", () => {
    expect(ruleWords({ type: "weekdays", days: [1, 2, 3, 4, 5] })).toBe("nei feriali");
    expect(ruleWords({ type: "weekdays", days: [1, 4] })).toBe("L G");
    expect(ruleWords({ type: "timesPerWeek", n: 3 })).toBe("3 volte a settimana");
  });
});
