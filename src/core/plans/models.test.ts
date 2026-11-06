import { describe, expect, it } from "vitest";
import {
  historyShares,
  inheritedTargets,
  possibleBases,
  resolveModel,
  toModels,
  type BlockRow,
  type ModelRow,
} from "./models";

const row = (
  over: Partial<BlockRow> & Pick<BlockRow, "id" | "templateId">,
): BlockRow => ({
  position: 0,
  kind: null,
  itemId: null,
  when: null,
  atMin: null,
  anchorBlockId: null,
  offsetMin: null,
  durationMin: null,
  cycleId: null,
  kcalShare: null,
  proteinShare: null,
  defaults: null,
  baseBlockId: null,
  removed: false,
  ...over,
});
const models: ModelRow[] = [
  {
    id: "rest",
    name: "Rest",
    extendsId: null,
    active: true,
    targets: { mode: "dynamic", deficitKcal: 200, proteinGPerKg: "1.8" },
  },
  {
    id: "rec",
    name: "Rec",
    extendsId: "rest",
    active: true,
    targets: { proteinGPerKg: "2.2" },
  },
  { id: "gym", name: "Gym", extendsId: "rec", active: true, targets: null },
];

describe("day models from their rows", () => {
  const rows = [
    row({
      id: "b1",
      templateId: "rest",
      position: 0,
      kind: "meal",
      when: "absolute",
      atMin: 480,
      kcalShare: "0.250",
      proteinShare: "0.200",
      defaults: { role: "breakfast" },
    }),
    row({
      id: "d1",
      templateId: "rest",
      position: 1,
      kind: "meal",
      when: "absolute",
      atMin: 1200,
      kcalShare: "0.400",
      defaults: { role: "dinner" },
    }),
    row({
      id: "x",
      templateId: "rec",
      position: 0,
      baseBlockId: "b1",
      when: "absolute",
      atMin: 450,
    }),
    row({ id: "y", templateId: "rec", position: 1, baseBlockId: "d1", removed: true }),
    row({
      id: "s",
      templateId: "rec",
      position: 2,
      kind: "session",
      when: "after_block",
      anchorBlockId: "b1",
      offsetMin: 60,
      durationMin: 60,
    }),
  ];

  it("own blocks, an inherited one changed, one hidden", () => {
    const r = resolveModel("rec", toModels(models, rows))!;
    expect(r.blocks.map((b) => [b.id, b.origin, b.when])).toEqual([
      ["b1", "changed", { type: "at", min: 450 }],
      ["s", "local", { type: "after", anchor: "b1", offsetMin: 60 }],
    ]);
    expect(r.blocks[0]!.shares).toEqual({ kcal: 0.25, protein: 0.2 });
    expect(r.blocks[0]!.defaults).toEqual({ role: "breakfast" });
    expect(r.removed.map((b) => b.id)).toEqual(["d1"]);
  });

  it("inherits targets key by key, and names its own", () => {
    const t = inheritedTargets("gym", models);
    expect(t.targets).toEqual({
      mode: "dynamic",
      deficitKcal: 200,
      proteinGPerKg: "2.2",
    });
    expect(t.own).toEqual([]);
    expect(t.from["proteinGPerKg"]).toBe("Rec");
    expect(inheritedTargets("rec", models).own).toEqual(["proteinGPerKg"]);
  });

  it("never offers a base that would make a loop", () => {
    expect(possibleBases("rest", models).map((m) => m.id)).toEqual([]);
    expect(possibleBases("gym", models).map((m) => m.id)).toEqual(["rest", "rec"]);
    expect(possibleBases(null, models)).toHaveLength(3);
  });
});

describe("meal shares from the person's days", () => {
  it("each role's mean share, scaled to the whole; short days left out", () => {
    const s = historyShares([
      { day: "a", role: "breakfast", kcal: 500, protein: 30 },
      { day: "a", role: "dinner", kcal: 1500, protein: 90 },
      { day: "b", role: "breakfast", kcal: 600, protein: 40 },
      { day: "b", role: "lunch", kcal: 600, protein: 40 },
      { day: "b", role: "dinner", kcal: 800, protein: 20 },
      { day: "c", role: "breakfast", kcal: 400, protein: 20 },
    ]);
    // breakfast (0,25 + 0,3)/2, lunch 0,3, dinner (0,75 + 0,4)/2: 0,275 + 0,3 + 0,575 = 1,15.
    expect(s["breakfast"]).toEqual({ kcal: 0.239, protein: 0.271, days: 2, atMin: null });
    expect(s["dinner"]!.days).toBe(2);
    const k = Object.values(s).reduce((a, x) => a + x.kcal, 0);
    expect(k).toBeCloseTo(1, 2);
  });

  it("each role's usual time: the median, to the quarter hour", () => {
    const s = historyShares([
      { day: "a", role: "lunch", kcal: 1200, protein: 50, minute: 775 },
      { day: "b", role: "lunch", kcal: 1200, protein: 50, minute: 800 },
      { day: "c", role: "lunch", kcal: 1200, protein: 50, minute: 790 },
    ]);
    expect(s["lunch"]!.atMin).toBe(795);
  });
});
