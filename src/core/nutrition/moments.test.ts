/** Tests for core/nutrition/moments.ts (ADR-0011). */
import { describe, expect, it } from "vitest";
import { entryMoment, groupByMoment, isMoment, momentAt, suggestMoment } from "./moments";

const at = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h! * 60 + m!;
};

describe("moments", () => {
  it("places a time in its moment, with the default bounds", () => {
    expect(momentAt(at("07:30"))).toBe("breakfast");
    expect(momentAt(at("11:00"))).toBe("lunch");
    expect(momentAt(at("16:00"))).toBe("snack");
    expect(momentAt(at("18:30"))).toBe("dinner");
    expect(momentAt(at("01:00"))).toBe("snack"); // a late snack
  });

  it("uses other bounds when given", () => {
    expect(
      momentAt(at("11:30"), {
        lunch: at("12:00"),
        snack: at("15:00"),
        dinner: at("19:00"),
      }),
    ).toBe("breakfast");
  });

  it("suggests the meal's category first, then the time, then now", () => {
    expect(suggestMoment("snack", "13:00", at("08:00"))).toBe("snack");
    expect(suggestMoment(null, "13:00", at("08:00"))).toBe("lunch");
    expect(suggestMoment(null, null, at("20:15"))).toBe("dinner");
  });

  it("reads an entry's moment: stored, else from its time, else none", () => {
    expect(entryMoment("dinner", "08:00")).toBe("dinner");
    expect(entryMoment(null, "08:00")).toBe("breakfast");
    expect(entryMoment(null, null)).toBeNull();
  });

  it("recognises the closed list", () => {
    expect(isMoment("lunch")).toBe(true);
    expect(isMoment("brunch")).toBe(false);
  });
});

describe("groupByMoment", () => {
  const e = (
    moment: "lunch" | null,
    at: string | null,
    kcal: string,
    status: "planned" | "eaten" = "eaten",
  ) => ({
    moment,
    at,
    status,
    totals: { nutrients: { kcal } },
  });

  it("groups in day order, derives from the time, sums eaten kcal, 'not set' last", () => {
    const groups = groupByMoment(
      [
        e(null, null, "50"),
        e("lunch", null, "600"),
        e(null, "2026-09-30T05:30:00Z", "300"), // 07:30 Rome -> breakfast
        e("lunch", null, "200", "planned"),
      ],
      "Europe/Rome",
    );
    expect(groups.map((g) => [g.moment, g.entries.length, g.eatenKcal])).toEqual([
      ["breakfast", 1, "300"],
      ["lunch", 2, "600"],
      [null, 1, "50"],
    ]);
  });
});
