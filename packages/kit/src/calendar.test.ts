import { describe, expect, it } from "vitest";
import { addDays, monthOf, weekOf } from "./calendar";
import { F } from "./format";

describe("calendar", () => {
  it("15 October 2026 is a Thursday, in a Monday-first week", () => {
    expect(F.day("2026-10-15")).toBe("giovedì 15");
    expect(weekOf("2026-10-15")).toEqual([
      "2026-10-12",
      "2026-10-13",
      "2026-10-14",
      "2026-10-15",
      "2026-10-16",
      "2026-10-17",
      "2026-10-18",
    ]);
    expect(weekOf("2026-10-18")[0]).toBe("2026-10-12");
  });

  it("a month has its days and the blanks before the 1st", () => {
    const m = monthOf("2026-10-15");
    expect(m.days.length).toBe(31);
    expect(m.lead).toBe(3); // 1 October 2026 is a Thursday
    expect(monthOf("2028-02-10").days.length).toBe(29);
  });

  it("adds days across months and years", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("the open month moves by a month (DateNav, ledger UI-98)", () => {
  it("keeps the day, clamped to the month's last", async () => {
    const { shiftMonth } = await import("./DateNav");
    expect(shiftMonth("2026-11-03", -1)).toBe("2026-10-03");
    expect(shiftMonth("2026-03-31", -1)).toBe("2026-02-28");
    expect(shiftMonth("2026-12-15", 1)).toBe("2027-01-15");
    expect(shiftMonth("2026-01-31", 1)).toBe("2026-02-28");
  });
});
