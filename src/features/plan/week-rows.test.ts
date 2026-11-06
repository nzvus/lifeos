import { describe, expect, it } from "vitest";
import { dayRow } from "./week-rows";

const plain = (s: unknown) => JSON.parse(JSON.stringify(s).replace(/ /g, " "));
const model = { id: "rec", name: "Rec", from: "week" as const, targets: null };
const step = (label: string, rest = false) => ({
  cycleId: "c",
  cycle: "PLPRR",
  label,
  rest,
  late: false,
  skipped: false,
  next: null,
});

describe("Piano's week rows", () => {
  it("a past day: what was done", () => {
    expect(
      plain(
        dayRow({
          day: "2026-10-22",
          today: "2026-10-24",
          plan: { model, cycles: [] },
          sessions: ["Pull"],
          planned: 0,
          kcal: 2211,
          selected: false,
        }),
      ),
    ).toMatchObject({
      fam: "train",
      time: "gio 22",
      title: "«Rec» + Pull",
      value: "fatto",
      faded: true,
    });
  });

  it("a coming day: the model, the step, the planned, the kcal", () => {
    expect(
      plain(
        dayRow({
          day: "2026-10-25",
          today: "2026-10-24",
          plan: { model, cycles: [step("Push")] },
          sessions: [],
          planned: 2,
          kcal: 2211,
          selected: false,
        }),
      ),
    ).toMatchObject({
      title: "«Rec» + Push",
      value: "previsto",
      meta: "Push dal ciclo PLPRR · 2 previsti · 2.211 kcal",
    });
    expect(
      dayRow({
        day: "2026-10-26",
        today: "2026-10-24",
        plan: { model, cycles: [step("Riposo", true)] },
        sessions: [],
        planned: 0,
        kcal: null,
        selected: false,
      }),
    ).toMatchObject({ fam: "day", title: "«Rec» + Riposo" });
  });
});
