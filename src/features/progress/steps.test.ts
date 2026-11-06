import { describe, expect, it } from "vitest";
import { stepsDomain } from "./steps";

describe("the steps in «Gli ambiti»", () => {
  const days = ["2026-10-19", "2026-10-20", "2026-10-21", "2026-10-25"];
  it("the mean of the days logged, the days at the goal, a cell per day", () => {
    const row = stepsDomain(
      days,
      [
        { day: "2026-10-19", n: 9000 },
        { day: "2026-10-20", n: 5000 },
        { day: "2026-10-20", n: 1000 },
        { day: "2026-10-25", n: 12000 },
      ],
      { value: 8000, weekdaysOnly: true },
    )!;
    expect(row.value).toBe("9.000");
    expect(row.meta).toBe("media di 3 giorni · 1 su 3 a 8.000 · senza voto per ora");
    expect(row.strip).toHaveLength(4);
    expect(row.score).toBeUndefined();
  });

  it("nothing logged, no row", () => {
    expect(stepsDomain(days, [], null)).toBeNull();
  });
});
