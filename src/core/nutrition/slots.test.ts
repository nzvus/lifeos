/** A day's food against its program's slots (ADR-0044). */
import { describe, expect, it } from "vitest";
import { groupByMoment, type Moment } from "./moments";
import { STARTERS } from "./programs";
import {
  groupAt,
  moveWithSession,
  suggestForSlot,
  withoutTraining,
  withSlots,
} from "./slots";

// Times are UTC; Rome is UTC+2 in October.
const e = (moment: Moment, at: string, kcal: string, protein: string) => ({
  moment,
  at: `2026-10-10T${at}:00Z`,
  status: "eaten" as const,
  totals: { nutrients: { kcal, protein } },
});

describe("withSlots", () => {
  const day = { kcal: 2400, protein: 160, kg: 76 };

  it("matches groups to slots, keeps the rest, and places empty slots at their time", () => {
    const groups = groupByMoment(
      [
        e("breakfast", "06:10", "500", "30"), // 08:10
        e("lunch", "11:00", "700", "40"), // 13:00
        e("snack", "08:30", "150", "5"), // 10:30: no snack slot in the program
      ],
      "Europe/Rome",
    );
    const items = withSlots(groups, STARTERS.gymEvening.slots, day);
    expect(
      items.map((x) =>
        x.type === "group" ? `${x.group.moment}${x.slot ? "*" : ""}` : `(${x.moment})`,
      ),
    ).toEqual([
      "breakfast*",
      "snack",
      "lunch*",
      "(pre_workout)",
      "(post_workout)",
      "(pre_sleep)",
    ]);
    const breakfast = items[0]!;
    // 20 % of 2,400 kcal and 20 % of 160 g; 30 g eaten.
    expect(
      breakfast.type === "group" && [breakfast.slot?.target, breakfast.eatenProtein],
    ).toEqual([{ kcal: 480, protein: 32 }, 30]);
  });

  it("hints carbs before training and protein after it and before sleep, by weight", () => {
    const items = withSlots([], STARTERS.gymEvening.slots, day);
    expect(items.map((x) => x.slot?.hint)).toEqual([
      null,
      null,
      { kind: "pre_workout", carbsLow: 38, carbsHigh: 76 },
      { kind: "post_workout", protein: 30 },
      { kind: "pre_sleep", protein: 30 },
    ]);
  });

  it("a snack slot takes the snack closest in time, within 2 hours", () => {
    const groups = groupByMoment(
      // 09:00 and 16:15, with lunch between them (else they are one group).
      [
        e("snack", "07:00", "100", "5"),
        e("lunch", "11:00", "700", "40"),
        e("snack", "14:15", "200", "10"),
      ],
      "Europe/Rome",
    );
    const items = withSlots(groups, STARTERS.rest.slots, day); // a snack slot at 16:30
    const snack = items.find(
      (x) => x.type === "group" && x.group.moment === "snack" && x.slot !== null,
    );
    expect(snack?.type === "group" && snack.group.minutes).toBe(16 * 60 + 15);
  });

  it("without a program, the groups as they are", () => {
    const groups = groupByMoment([e("lunch", "11:00", "700", "40")], "Europe/Rome");
    expect(withSlots(groups, [], day)).toEqual([
      { type: "group", group: groups[0], slot: null, eatenProtein: 40 },
    ]);
  });
});

describe("moveWithSession", () => {
  it("moves the slots around training with the session's real start", () => {
    // Planned at 18:00, started at 19:30: +90 minutes.
    const moved = moveWithSession(STARTERS.gymEvening.slots, 18 * 60, 19 * 60 + 30);
    expect(moved.map((s) => [s.kind, s.at])).toEqual([
      ["breakfast", 8 * 60],
      ["lunch", 13 * 60],
      ["pre_workout", 18 * 60], // 16:30 → 18:00
      ["post_workout", 21 * 60 + 15], // 19:45 → 21:15
      ["pre_sleep", 22 * 60 + 30],
    ]);
  });
  it("leaves them without a planned time or a start", () => {
    expect(moveWithSession(STARTERS.gymEvening.slots, null, 19 * 60)).toEqual(
      STARTERS.gymEvening.slots,
    );
    expect(moveWithSession(STARTERS.gymEvening.slots, 18 * 60, null)).toEqual(
      STARTERS.gymEvening.slots,
    );
  });
});

describe("suggestForSlot", () => {
  const meal = (
    name: string,
    kcal: number,
    protein: number,
    carbs: number,
    fat: number,
    uses = 1,
  ) => ({
    name,
    uses,
    values: {
      kcal: String(kcal),
      protein: String(protein),
      carbs: String(carbs),
      fat: String(fat),
    },
  });
  const meals = [
    meal("Gallette e marmellata", 210, 4, 46, 1),
    meal("Banana e caffè", 120, 1, 27, 0, 5),
    meal("Pasta al tonno", 720, 38, 96, 21),
    meal("Shake proteico", 180, 32, 8, 2),
    meal("Skyr e noci", 320, 22, 12, 18),
    meal("Burger", 1100, 55, 80, 60),
  ];
  const names = (xs: { name: string }[]) => xs.map((x) => x.name);

  it("before training: carbs-heavy, light, low in fat", () => {
    expect(names(suggestForSlot("pre_workout", meals))).toEqual([
      "Banana e caffè",
      "Gallette e marmellata",
      "Shake proteico",
    ]);
  });
  it("after training: protein first", () => {
    expect(names(suggestForSlot("post_workout", meals))[0]).toBe("Shake proteico");
  });
  it("before sleep: protein, not too much energy", () => {
    expect(names(suggestForSlot("pre_sleep", meals))).toEqual([
      "Shake proteico",
      "Skyr e noci",
    ]);
  });
  it("other slots suggest nothing", () => {
    expect(suggestForSlot("lunch", meals)).toEqual([]);
  });
});

describe("groupAt and withoutTraining (2026-10-11)", () => {
  it("a lunch eaten late sits at its own time, not the slot's", () => {
    const groups = groupByMoment([e("lunch", "13:36", "700", "40")], "Europe/Rome"); // 15:36
    const lunch = withSlots(groups, STARTERS.gymEvening.slots, {
      kcal: 2400,
      protein: 160,
      kg: 76,
    }).find((x) => x.type === "group")!;
    expect(lunch.type === "group" && lunch.slot !== null).toBe(true);
    expect(lunch.type === "group" && groupAt(lunch)).toBe(15 * 60 + 36);
  });

  it("without training, pre/post-workout slots are snacks", () => {
    const kinds = withoutTraining(STARTERS.gymEvening.slots).map((s) => s.kind);
    expect(kinds).not.toContain("pre_workout");
    expect(kinds).not.toContain("post_workout");
    expect(kinds).toContain("snack");
  });
});
