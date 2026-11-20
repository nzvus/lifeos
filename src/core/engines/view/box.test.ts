// PAT-30, VIS-40 (Deliver ③, `round-1.md` D1): one Box for every voce, object and obiettivo; its
// levels are the Level column of docs/spec/orca/attributes.md, and the code stays equal to it.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CATALOG_TYPES, kindRegistry } from "../../kinds";
import { BOX_PLAN, boxPlan, GOAL, instrumentOf } from "./box";

const ORCA = path.resolve(import.meta.dirname, "../../../../docs/spec/orca");

function rows(file: string): Record<string, string>[] {
  const lines = fs
    .readFileSync(path.join(ORCA, file), "utf8")
    .split("\n")
    .filter((l) => l.startsWith("|"));
  const cut = (l: string) =>
    l
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim());
  const head = cut(lines[0]!);
  return lines
    .slice(2)
    .map((l) => Object.fromEntries(cut(l).map((c, i) => [head[i]!, c])));
}

const objects = new Map(rows("objects.md").map((o) => [o.ID!, o]));
/** The rows a Box draws: voci, objects, and the obiettivo (the one reference with a card, D1). */
const boxed = rows("attributes.md").flatMap((r): Record<string, string>[] => {
  const o = objects.get(r.Object!)!;
  if (r.Object === "OBJ-58") return [{ ...r, key: GOAL }];
  return o.Form === "voce" || o.Form === "object" ? [{ ...r, key: o.Key! }] : [];
});
const planned = Object.entries(BOX_PLAN).flatMap(([key, slots]) =>
  slots.map((x) => ({ ...x, type: key })),
);

describe("the Box's plan equals orca/attributes (PAT-30, VIS-40)", () => {
  it("reads the table", () => {
    expect(boxed.length).toBeGreaterThan(40);
  });

  it("every row of a voce, object or obiettivo is a slot at its level, by its instrument", () => {
    const off = boxed.flatMap((r) => {
      const x = planned.find((p) => p.att === r.ID);
      if (!x) return [`${r.ID} missing`];
      const got = `${x.type} L${x.level} ${instrumentOf(x)} ${x.field ?? "—"}`;
      const want = `${r.key} L${r.Level} ${r.Instrument} ${r.Field}`;
      return got === want ? [] : [`${r.ID}: code ${got}, table ${want}`];
    });
    expect(off).toEqual([]);
  });

  it("no slot without its row", () => {
    const ids = new Set(boxed.map((r) => r.ID));
    expect(planned.filter((x) => !ids.has(x.att)).map((x) => x.att)).toEqual([]);
  });

  it("every plan is a registry type, or the obiettivo", () => {
    const keys = new Set([
      ...kindRegistry().all.map((k) => k.key),
      ...CATALOG_TYPES.map((t) => t.key),
      GOAL,
    ]);
    expect(Object.keys(BOX_PLAN).filter((k) => !keys.has(k))).toEqual([]);
  });
});

describe("boxPlan (PAT-30): closed, open in place, the page", () => {
  it("splits a meal by level", () => {
    const p = boxPlan("meal");
    expect(p.head.map((x) => x.key)).toEqual([
      "role",
      "time",
      "kcal",
      "macros",
      "score",
      "estimated",
    ]);
    expect(p.open.map((x) => x.key)).toEqual(["lines", "limits", "servings", "context"]);
    expect(p.page.map((x) => x.key)).toEqual(["cost", "sources"]);
  });

  it("a cibo closed says one value and its voto (ATT-61, ATT-36)", () => {
    expect(boxPlan("food").head.map((x) => instrumentOf(x))).toEqual([
      "bar",
      "skyline",
      "word",
    ]);
  });

  it("a type with no data of his has the empty plan: icon and name only (PRD-02)", () => {
    expect(boxPlan("book")).toEqual({ head: [], open: [], page: [] });
  });
});
