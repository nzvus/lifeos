/** Tests for core/nutrition/moments.ts (ADR-0011). */
import { describe, expect, it } from "vitest";
import {
  entryMoment,
  groupByMoment,
  isMoment,
  momentAt,
  snackPart,
  suggestMoment,
} from "./moments";
import type { Moment } from "./moments";

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
    moment: Moment | null,
    at: string | null,
    kcal: string,
    status: "planned" | "eaten" = "eaten",
  ) => ({
    moment,
    at,
    status,
    totals: { nutrients: { kcal } },
  });

  it("places the moments around training and sleep by their time (ADR-0044)", () => {
    const groups = groupByMoment(
      [
        e("dinner", "2026-10-10T18:30:00Z", "700"), // 20:30
        e("post_workout", "2026-10-10T17:00:00Z", "300"), // 19:00
        e("pre_workout", null, "150"), // no time: 17:00
        e("lunch", "2026-10-10T11:00:00Z", "600"), // 13:00
        e("pre_sleep", "2026-10-10T21:30:00Z", "200"), // 23:30
      ],
      "Europe/Rome",
    );
    expect(groups.map((g) => g.moment)).toEqual([
      "lunch",
      "pre_workout",
      "post_workout",
      "dinner",
      "pre_sleep",
    ]);
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

  // Times are UTC; Rome is UTC+2 in October.
  it("places snacks by their time: before lunch, after dinner, apart (2026-10-07)", () => {
    const groups = groupByMoment(
      [
        e("breakfast", "2026-10-07T05:52:00Z", "450"), // 07:52
        e("snack", "2026-10-07T10:19:00Z", "677"), // 12:19, before lunch
        e("snack", "2026-10-07T10:19:00Z", "120"),
        e("lunch", "2026-10-07T10:28:00Z", "376"), // 12:28
        e("snack", "2026-10-07T14:37:00Z", "48"), // 16:37
        e("snack", "2026-10-07T16:04:00Z", "117"), // 18:04
        e("dinner", "2026-10-07T16:21:00Z", "274"), // 18:21
        e("snack", "2026-10-07T21:00:00Z", "306"), // 23:00, after dinner
      ],
      "Europe/Rome",
    );
    expect(groups.map((g) => [g.key, g.part, g.entries.length, g.eatenKcal])).toEqual([
      ["breakfast", null, 1, "450"],
      ["snack-0", "morning", 2, "797"],
      ["lunch", null, 1, "376"],
      ["snack-1", "afternoon", 2, "165"],
      ["dinner", null, 1, "274"],
      ["snack-2", "evening", 1, "306"],
    ]);
  });

  it("keeps an untimed snack between lunch and dinner, as before", () => {
    const groups = groupByMoment(
      [
        e("dinner", "2026-10-07T18:00:00Z", "500"),
        e("snack", null, "100"),
        e("lunch", null, "600"),
      ],
      "Europe/Rome",
    );
    expect(groups.map((g) => g.key)).toEqual(["lunch", "snack-0", "dinner"]);
  });

  it("names a snack by its part of the day", () => {
    expect(snackPart(at("01:30"))).toBe("night");
    expect(snackPart(at("10:30"))).toBe("morning");
    expect(snackPart(at("16:00"))).toBe("afternoon");
    expect(snackPart(at("22:00"))).toBe("evening");
    expect(snackPart(at("12:19"), "breakfast")).toBe("morning"); // before lunch
    expect(snackPart(at("17:00"), "dinner")).toBe("evening");
  });
});
