/**
 * core/kinds/catalog.ts — the catalog types of the registry (MOD-01, MOD-02; model.md §3).
 * A catalog type is a thing he reuses (cibo, pasto, esercizio…), declared once with the shape of
 * MOD-01 so pages, forms, lists and the verbs of `core/verbs` (PAT-24) read it instead of
 * comparing type keys. Declaration only in phase 3: screens move onto it type by type in phase 4.
 *
 * `fields` lists only the generic values `core/verbs` may edit; the values a specialisation
 * owns (a food's ~40 nutrients, an exercise's sets) stay in its folder (model.md §8), named in
 * `specialisation`.
 */
import { z } from "zod";
import { FAMILIES, fieldSchema } from "./kind";

export const AREAS = ["Corpo", "Cibo", "Oggi", "Mente", "Soldi"] as const;
export type Area = (typeof AREAS)[number];

/** The verbs of patterns.md §2 as `core/verbs` names them. */
export const VERBS = [
  "create",
  "startFrom",
  "variant",
  "edit",
  "merge",
  "archive",
  "restore",
  "trash",
  "delete",
  "saveAs",
  "undo",
] as const;
export type Verb = (typeof VERBS)[number];

const key = z.string().regex(/^[a-z][a-z0-9_]*$/, "lower_snake_case");

export const catalogTypeSchema = z
  .object({
    key,
    /** His word (product.md §3). */
    name: z.string().min(1),
    area: z.enum(AREAS),
    /** Hue, drawing and silhouette of the kit (visual.md). */
    hue: z.enum(FAMILIES),
    /** Where its rows live: `catalog_items` with this `catalog` (and a true flag field), or `kinds`. */
    storage: z.union([
      z.object({
        table: z.literal("catalog_items"),
        catalog: key,
        flag: z.string().optional(),
      }),
      z.object({ table: z.literal("kinds") }),
    ]),
    /** MOD-21: what `parentId` means for it, declared, never inferred. */
    family: z.discriminatedUnion("rule", [
      z.object({ rule: z.literal("levels"), parent: key.nullable() }),
      z.object({ rule: z.literal("variants") }),
      z.object({ rule: z.literal("none") }),
    ]),
    fields: z.array(fieldSchema).default([]),
    /** Its parts: another catalog type with a quantity (a pasto's foods, a scheda's exercises). */
    lines: z.object({ type: key }).optional(),
    capture: z.enum(["quick", "form", "composer", "timer"]),
    verbs: z.array(z.enum(VERBS)).min(1),
    list: z.object({
      sort: z.array(z.string()).min(1),
      search: z.array(z.string()).min(1),
    }),
    /** MOD-14: the voce kind whose «Salva come …» makes one of these, and how its parts are read. */
    savedFrom: z.object({ kind: key, parts: z.enum(["lines", "children"]) }).optional(),
    /** The folder that owns its specialised values (model.md §8). */
    specialisation: z.string().optional(),
  })
  .refine(
    (t) => t.family.rule === "variants" || !t.verbs.includes("variant"),
    "«Variante» needs the variants rule",
  )
  .refine((t) => !t.savedFrom || t.lines !== undefined, "«Salva come» needs lines");

export type CatalogTypeInput = z.input<typeof catalogTypeSchema>;
export type CatalogType = z.output<typeof catalogTypeSchema>;

/** core/movement/routes.ts MODES (that module reads the database; catalog.test.ts keeps both equal). */
export const ROUTE_MODES = [
  "walk",
  "run",
  "bike",
  "bus",
  "train",
  "car",
  "mixed",
] as const;

/** Every object verb (PAT-16…22); a type leaves out what makes no sense for it. */
const ALL: Verb[] = [
  "create",
  "startFrom",
  "edit",
  "merge",
  "archive",
  "restore",
  "delete",
  "undo",
];
const NAME = { sort: ["use", "name"], search: ["name", "aliases"] };

const DECLARED: CatalogTypeInput[] = [
  {
    key: "food",
    name: "cibo",
    area: "Cibo",
    hue: "food",
    storage: { table: "catalog_items", catalog: "food" },
    family: { rule: "levels", parent: null },
    capture: "form",
    verbs: ALL,
    list: NAME,
    specialisation: "core/food",
  },
  {
    key: "product",
    name: "prodotto",
    area: "Cibo",
    hue: "food",
    storage: { table: "catalog_items", catalog: "product" },
    family: { rule: "levels", parent: "food" },
    capture: "form",
    verbs: ALL,
    list: { sort: ["use", "name"], search: ["name", "brand", "barcode"] },
    specialisation: "core/food",
  },
  {
    key: "format",
    name: "formato",
    area: "Cibo",
    hue: "food",
    storage: { table: "catalog_items", catalog: "format" },
    family: { rule: "levels", parent: "product" },
    capture: "form",
    verbs: ["create", "edit", "archive", "restore", "delete", "undo"],
    list: { sort: ["name"], search: ["name", "barcode"] },
    specialisation: "core/food",
  },
  {
    key: "recipe",
    name: "pasto",
    area: "Cibo",
    hue: "food",
    storage: { table: "catalog_items", catalog: "recipe" },
    family: { rule: "variants" },
    lines: { type: "food" },
    capture: "composer",
    verbs: [...ALL, "variant", "saveAs"],
    list: NAME,
    savedFrom: { kind: "meal", parts: "lines" },
    specialisation: "core/food",
  },
  {
    key: "intake_item",
    name: "assunzione",
    area: "Cibo",
    hue: "drink",
    storage: { table: "catalog_items", catalog: "food", flag: "intake" },
    family: { rule: "none" },
    capture: "quick",
    verbs: ALL,
    list: NAME,
    specialisation: "core/food",
  },
  {
    key: "exercise",
    name: "esercizio",
    area: "Corpo",
    hue: "train",
    storage: { table: "catalog_items", catalog: "exercise" },
    family: { rule: "variants" },
    fields: [{ key: "guide", type: "text" }],
    capture: "form",
    verbs: [...ALL, "variant"],
    list: NAME,
    specialisation: "core/training",
  },
  {
    key: "routine",
    name: "scheda",
    area: "Corpo",
    hue: "train",
    storage: { table: "catalog_items", catalog: "routine" },
    family: { rule: "variants" },
    lines: { type: "exercise" },
    capture: "composer",
    verbs: [...ALL, "variant", "saveAs"],
    list: { sort: ["use", "name"], search: ["name"] },
    savedFrom: { kind: "session", parts: "children" },
    specialisation: "core/training",
  },
  {
    key: "route",
    name: "tragitto",
    area: "Corpo",
    hue: "train",
    storage: { table: "catalog_items", catalog: "route" },
    family: { rule: "none" },
    fields: [
      { key: "mode", type: "choice", choices: [...ROUTE_MODES], required: true },
      { key: "distanceKm", type: "number", unit: "km", min: 0 },
      { key: "durationMin", type: "number", unit: "min", min: 0 },
      { key: "walkingM", type: "integer", unit: "m", min: 0 },
      { key: "mapsUrl", type: "text" },
    ],
    capture: "form",
    verbs: ALL,
    list: { sort: ["use", "name"], search: ["name"] },
  },
  {
    key: "tracker",
    name: "tracker",
    area: "Oggi",
    hue: "habit",
    storage: { table: "kinds" },
    family: { rule: "none" },
    capture: "form",
    verbs: ["create", "startFrom", "edit", "archive", "restore", "undo"],
    list: { sort: ["use", "name"], search: ["name"] },
    specialisation: "core/kinds/user",
  },
  {
    key: "money_category",
    name: "categoria di spesa",
    area: "Soldi",
    hue: "money",
    storage: { table: "catalog_items", catalog: "money_category" },
    family: { rule: "levels", parent: "money_category" },
    capture: "form",
    verbs: ALL,
    list: { sort: ["name"], search: ["name"] },
    specialisation: "core/money",
  },
];

/** The catalog types, checked when the module loads: a broken one fails every test. */
export const CATALOG_TYPES: readonly CatalogType[] = DECLARED.map((t) =>
  catalogTypeSchema.parse(t),
);
const BY_KEY = new Map(CATALOG_TYPES.map((t) => [t.key, t]));

/** The address segment of a type (PAT-04): its word, lower case, spaces as dashes. */
export const typeSlug = (t: CatalogType) => t.name.toLowerCase().replace(/\s+/g, "-");

/** The address segment of its area (`/cibo`, `/corpo`…). */
export const areaSlug = (t: CatalogType) => t.area.toLowerCase();

/** The catalog type at `/{area}/{type}/…` (PAT-04), or null. */
export function typeAtSlug(slug: string): CatalogType | null {
  return CATALOG_TYPES.find((t) => typeSlug(t) === slug) ?? null;
}

export function catalogType(key: string): CatalogType | undefined {
  return BY_KEY.get(key);
}

/** The catalog type of a stored item: its `catalog`, and the flag a specialised type adds. */
export function typeOfItem(
  catalog: string,
  flags: ReadonlySet<string> = new Set(),
): CatalogType | undefined {
  const own = CATALOG_TYPES.filter(
    (t) => t.storage.table === "catalog_items" && t.storage.catalog === catalog,
  );
  return (
    own.find(
      (t) =>
        t.storage.table === "catalog_items" &&
        t.storage.flag &&
        flags.has(t.storage.flag),
    ) ?? own.find((t) => t.storage.table === "catalog_items" && !t.storage.flag)
  );
}

/** A type's editable values as one zod object (PAT-24: every verb validates its payload). */
export function valuesSchema(t: CatalogType) {
  const shape: Record<string, z.ZodType> = {};
  for (const f of t.fields) {
    let s: z.ZodType;
    if (
      f.type === "number" ||
      f.type === "integer" ||
      f.type === "duration" ||
      f.type === "scale"
    ) {
      let n = f.type === "number" ? z.number() : z.number().int();
      if (f.min !== undefined) n = n.min(f.min);
      if (f.max !== undefined) n = n.max(f.max);
      if (f.scale !== undefined) n = n.min(1).max(f.scale);
      s = n;
    } else if (f.type === "boolean") s = z.boolean();
    else if (f.type === "choice") s = z.enum(f.choices as [string, ...string[]]);
    else s = z.string().max(2000);
    shape[f.key] = s.nullable().optional();
  }
  return z.object(shape).strict();
}
