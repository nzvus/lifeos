/**
 * core/kinds/registry.ts — one lookup for built-in and user-made kinds.
 *
 * Built-ins are checked once, when the module loads: a broken definition
 * fails every test, not a page. A user kind is checked when it is read; one
 * that fails, or that reuses a built-in key, is reported, never thrown, and
 * its entries still show under a plain fallback kind: data is never hidden
 * because its definition is wrong.
 */
import { BUILTIN_KINDS, type MealRole } from "./builtins";
import { kindSchema, type Kind } from "./kind";

const BUILTINS: ReadonlyMap<string, Kind> = new Map(
  BUILTIN_KINDS.map((k) => {
    const parsed = kindSchema.parse(k);
    return [parsed.key, parsed];
  }),
);

/** A user kind as stored: the row's columns and its `definition`. */
export type UserKindRow = {
  key: string;
  domain: string;
  shape: string;
  entryMode: string;
  definition: unknown;
  archivedAt: Date | null;
};

export type KindRegistry = {
  get(key: string): Kind;
  has(key: string): boolean;
  all: readonly Kind[];
  /** User kinds that were refused, with why. */
  invalid: readonly { key: string; reason: string }[];
};

/** The kind an entry falls back to when its kind is unknown or broken. */
export function fallbackKind(key: string): Kind {
  return kindSchema.parse({
    key: /^[a-z][a-z0-9_]*$/.test(key) ? key : "unknown",
    family: "habit",
    domain: "home",
    shape: "instant",
    entry: "form",
    fields: [],
  });
}

export function kindRegistry(userRows: readonly UserKindRow[] = []): KindRegistry {
  const map = new Map(BUILTINS);
  const invalid: { key: string; reason: string }[] = [];
  for (const row of userRows) {
    if (BUILTINS.has(row.key)) {
      invalid.push({ key: row.key, reason: "the key of a built-in kind" });
      continue;
    }
    const def =
      typeof row.definition === "object" && row.definition ? row.definition : {};
    const parsed = kindSchema.safeParse({
      ...def,
      key: row.key,
      domain: row.domain,
      shape: row.shape,
      entry: row.entryMode,
    });
    if (!parsed.success) {
      invalid.push({
        key: row.key,
        reason: parsed.error.issues.map((i) => i.message).join("; "),
      });
      continue;
    }
    map.set(row.key, parsed.data);
  }
  return {
    get: (key) => map.get(key) ?? fallbackKind(key),
    has: (key) => map.has(key),
    all: [...map.values()],
    invalid,
  };
}

/** Where lunch, the afternoon snack and dinner start, in clock minutes (v1 ADR-0011; a setting). */
export type RoleBounds = { lunchFrom: number; snackFrom: number; dinnerFrom: number };
export const DEFAULT_ROLE_BOUNDS: RoleBounds = {
  lunchFrom: 11 * 60,
  snackFrom: 15 * 60,
  dinnerFrom: 18 * 60 + 30,
};

/**
 * The role a meal's time gives it (v1 ADR-0011): before 05:00 a late snack,
 * then breakfast, lunch, snack and dinner from the person's bounds.
 * `minute` is the local clock minute.
 */
export function mealRoleAt(
  minute: number,
  bounds: RoleBounds = DEFAULT_ROLE_BOUNDS,
): MealRole {
  if (minute < 5 * 60) return "snack";
  if (minute < bounds.lunchFrom) return "breakfast";
  if (minute < bounds.snackFrom) return "lunch";
  if (minute < bounds.dinnerFrom) return "snack";
  return "dinner";
}

/**
 * An entry's subcategory: fixed by its kind, or the value of the kind's
 * field when that value is one of the field's choices. A meal with no role
 * (or v1's pre/post-workout) takes the role of its time; with no time, none.
 */
export function subcategoryOf(
  kind: Kind,
  values: ReadonlyMap<string, unknown>,
  clockMinute: number | null,
  bounds: RoleBounds = DEFAULT_ROLE_BOUNDS,
): string | null {
  const s = kind.subcategory;
  if (s === undefined) return null;
  if (typeof s === "string") return s;
  const v = values.get(s.field);
  const field = kind.fields.find((f) => f.key === s.field);
  if (typeof v === "string" && (field?.choices ?? []).includes(v)) return v;
  if (kind.key === "meal" && clockMinute !== null) return mealRoleAt(clockMinute, bounds);
  return null;
}
