import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { V1Export } from "../convert/context";
import { convert } from "../convert/convert";
import { BUILTIN_KINDS } from "./builtins";
import { kindSchema } from "./kind";
import { kindRegistry, mealRoleAt, subcategoryOf, type UserKindRow } from "./registry";

const fixture = (): V1Export =>
  JSON.parse(
    readFileSync(
      new URL("../convert/fixtures/v1-everything.json", import.meta.url),
      "utf8",
    ),
  ) as V1Export;

const guitar: UserKindRow = {
  key: "guitar",
  domain: "work",
  shape: "interval",
  entryMode: "timer",
  archivedAt: null,
  definition: {
    family: "habit",
    fields: [
      { key: "piece", type: "text" },
      { key: "focus", type: "scale", scale: 5 },
    ],
  },
};

describe("kinds", () => {
  it("every built-in passes the type, and keys are unique", () => {
    for (const k of BUILTIN_KINDS) expect(kindSchema.safeParse(k).success).toBe(true);
    const keys = BUILTIN_KINDS.map((k) => k.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("every entry and value the converter writes has its kind and field", () => {
    const file = convert(fixture(), new Date("2026-10-17T12:00:00Z"));
    const reg = kindRegistry();
    const kindOf = new Map(file.tables.entries.map((e) => [e.id, e.kind]));
    for (const e of file.tables.entries) expect(reg.has(e.kind), e.kind).toBe(true);
    for (const v of file.tables.entry_values) {
      const kind = reg.get(kindOf.get(v.entryId)!);
      expect(
        kind.fields.map((f) => f.key),
        `${kind.key}.${v.field}`,
      ).toContain(v.field);
    }
  });

  it("a user kind is read by the same type; a broken one is reported, not thrown", () => {
    const reg = kindRegistry([
      guitar,
      { ...guitar, key: "meal" },
      { ...guitar, key: "bad", definition: { family: "nope", fields: [] } },
      {
        ...guitar,
        key: "scale_without_top",
        definition: { family: "mind", fields: [{ key: "x", type: "scale" }] },
      },
    ]);
    expect(reg.get("guitar").fields.map((f) => f.key)).toEqual(["piece", "focus"]);
    expect(reg.get("meal").family).toBe("food");
    expect(reg.invalid.map((i) => i.key)).toEqual(["meal", "bad", "scale_without_top"]);
    expect(reg.invalid[0]!.reason).toMatch(/built-in/);
    expect(reg.has("bad")).toBe(false);
    expect(reg.get("bad")).toMatchObject({ key: "bad", family: "habit", fields: [] });
  });

  it("a meal's role: stored if it is one of the four, else from its time and the bounds", () => {
    const meal = kindRegistry().get("meal");
    const at = (h: number, m = 0) => h * 60 + m;
    expect(subcategoryOf(meal, new Map([["role", "dinner"]]), at(12))).toBe("dinner");
    expect(subcategoryOf(meal, new Map([["role", "post_workout"]]), at(12))).toBe(
      "lunch",
    );
    expect(subcategoryOf(meal, new Map(), at(9, 30))).toBe("breakfast");
    expect(subcategoryOf(meal, new Map(), null)).toBeNull();
    expect(mealRoleAt(at(1, 30))).toBe("snack");
    expect(mealRoleAt(at(18, 0))).toBe("snack");
    expect(mealRoleAt(at(18, 30))).toBe("dinner");
    expect(
      mealRoleAt(at(18, 0), {
        lunchFrom: at(11),
        snackFrom: at(15),
        dinnerFrom: at(17, 45),
      }),
    ).toBe("dinner");
  });

  it("a fixed subcategory needs no value", () => {
    const reg = kindRegistry();
    expect(subcategoryOf(reg.get("weigh_in"), new Map(), null)).toBe("weight");
    expect(subcategoryOf(reg.get("journal"), new Map(), null)).toBeNull();
  });
});
