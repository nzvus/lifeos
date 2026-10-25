/**
 * core/kinds/user.ts — the person's own trackers (V-14 «Nuovo tracker»,
 * concepts §2): what the form says (a name, a family, at a moment or with a
 * duration, up to six fields with their words and units) made into a kind
 * the same schema checks as the built-ins, so ⊕, Oggi and the entry sheet
 * treat it as one of theirs. Keys come from the words (a name «Mal di
 * testa» is `mal_di_testa`, a field «Intensità» is `intensita`), never
 * a built-in's or another of the person's. `buildUserKind` is pure; the
 * repository writes and reads the `kinds` rows.
 */
import { and, eq } from "drizzle-orm";
import type { Db } from "../db/db";
import { kinds } from "../db/schema";
import { ownedBy, type Owner } from "../identity/owner";
import { kindSchema, type Family, type Kind } from "./kind";

export const USER_FAMILIES = ["habit", "mind", "body", "sleep", "drink", "food"] as const;
export const USER_FIELD_TYPES = [
  "number",
  "integer",
  "scale",
  "boolean",
  "choice",
  "text",
  "duration",
] as const;
export type UserFieldType = (typeof USER_FIELD_TYPES)[number];
export const MAX_FIELDS = 6;

const DOMAIN: Record<(typeof USER_FAMILIES)[number], Kind["domain"]> = {
  habit: "home",
  mind: "mind",
  body: "body",
  sleep: "sleep",
  drink: "food",
  food: "food",
};

export type UserKindInput = {
  name: string;
  family: string;
  shape: string;
  fields: { label: string; type: string; unit?: string; choices?: string }[];
};
export type UserKindError =
  | "name"
  | "family"
  | "shape"
  | "fields"
  | { field: number; error: "label" | "type" | "choices" | "same" };

const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** «Mal di testa» → `mal_di_testa`; a leading digit gets a letter before it. */
export function kindKey(name: string): string {
  const k = fold(name).replace(/ /g, "_").slice(0, 40);
  return /^[a-z]/.test(k) ? k : "t_" + k;
}

/** «Ore di schermo» → `oreDiSchermo`. */
export function fieldKey(label: string): string {
  const [first = "", ...rest] = fold(label).split(" ");
  const k = first + rest.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
  return (/^[a-z]/.test(k) ? k : "f" + k).slice(0, 40);
}

/** Pure: the row to write, or what is wrong; `taken` holds the keys in use (built-ins and the person's). */
export function buildUserKind(
  input: UserKindInput,
  taken: ReadonlySet<string>,
):
  | {
      ok: true;
      row: {
        key: string;
        name: string;
        domain: string;
        shape: string;
        entryMode: string;
        definition: Record<string, unknown>;
      };
    }
  | { ok: false; errors: UserKindError[] } {
  const errors: UserKindError[] = [];
  const name = input.name.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 40 || fold(name) === "") errors.push("name");
  const family = (USER_FAMILIES as readonly string[]).includes(input.family)
    ? (input.family as Family)
    : null;
  if (!family) errors.push("family");
  const shape =
    input.shape === "interval"
      ? "interval"
      : input.shape === "instant"
        ? "instant"
        : null;
  if (!shape) errors.push("shape");
  if (input.fields.length > MAX_FIELDS) errors.push("fields");
  const keys = new Set<string>();
  const fields = input.fields.flatMap((f, i) => {
    const label = f.label.trim();
    const type = (USER_FIELD_TYPES as readonly string[]).includes(f.type)
      ? (f.type as UserFieldType)
      : null;
    if (label === "" || label.length > 40 || fold(label) === "")
      errors.push({ field: i, error: "label" });
    if (!type) errors.push({ field: i, error: "type" });
    const choices = (f.choices ?? "")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    if (
      type === "choice" &&
      (choices.length < 2 || new Set(choices).size !== choices.length)
    )
      errors.push({ field: i, error: "choices" });
    const key = fieldKey(label);
    if (label !== "" && keys.has(key)) errors.push({ field: i, error: "same" });
    keys.add(key);
    if (!type) return [];
    const unit = (f.unit ?? "").trim().slice(0, 12);
    return [
      {
        key,
        label,
        type,
        ...((type === "number" || type === "integer") && unit ? { unit } : {}),
        ...(type === "duration" ? { unit: "min" } : {}),
        ...(type === "scale" ? { scale: 5 } : {}),
        ...(type === "choice" ? { choices } : {}),
        ...(type === "number" || type === "integer" || type === "duration"
          ? { min: 0 }
          : {}),
      },
    ];
  });
  if (errors.length > 0) return { ok: false, errors };
  let key = kindKey(name);
  for (let n = 2; taken.has(key); n++) key = kindKey(name) + "_" + n;
  const definition = { family: family!, fields };
  const checked = kindSchema.safeParse({
    ...definition,
    key,
    name,
    domain: DOMAIN[family as (typeof USER_FAMILIES)[number]],
    shape,
    entry: fields.length === 0 ? "quick" : "form",
  });
  if (!checked.success) return { ok: false, errors: ["fields"] };
  return {
    ok: true,
    row: {
      key,
      name,
      domain: checked.data.domain,
      shape: checked.data.shape,
      entryMode: checked.data.entry,
      definition,
    },
  };
}

export type UserKindListed = {
  id: string;
  key: string;
  name: string;
  family: string;
  shape: string;
  fields: number;
  archived: boolean;
};

export async function listUserKinds(db: Db, owner: Owner): Promise<UserKindListed[]> {
  const rows = await db
    .select({
      id: kinds.id,
      key: kinds.key,
      name: kinds.name,
      shape: kinds.shape,
      definition: kinds.definition,
      archivedAt: kinds.archivedAt,
    })
    .from(kinds)
    .where(ownedBy(kinds, owner));
  return rows
    .map((r) => {
      const d = (r.definition ?? {}) as { family?: string; fields?: unknown[] };
      return {
        id: r.id,
        key: r.key,
        name: r.name,
        family: d.family ?? "habit",
        shape: r.shape,
        fields: Array.isArray(d.fields) ? d.fields.length : 0,
        archived: r.archivedAt !== null,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "it"));
}

/** Writes a built kind for the owner; its key. */
export async function createUserKind(
  db: Db,
  owner: Owner,
  row: {
    key: string;
    name: string;
    domain: string;
    shape: string;
    entryMode: string;
    definition: Record<string, unknown>;
  },
): Promise<string> {
  await db.insert(kinds).values({
    userId: owner.id,
    key: row.key,
    name: row.name,
    domain: row.domain,
    shape: row.shape as "instant" | "interval",
    entryMode: row.entryMode,
    definition: row.definition,
  });
  return row.key;
}

/** Archives (or brings back) one of the owner's kinds: out of ⊕, its entries kept. */
export async function setUserKindArchived(
  db: Db,
  owner: Owner,
  id: string,
  archived: boolean,
): Promise<boolean> {
  const done = await db
    .update(kinds)
    .set({ archivedAt: archived ? new Date() : null })
    .where(and(ownedBy(kinds, owner), eq(kinds.id, id)))
    .returning({ id: kinds.id });
  return done.length > 0;
}

/** The keys in use for the owner, archived ones too (a key is the owner's once). */
export async function takenKindKeys(db: Db, owner: Owner): Promise<Set<string>> {
  const rows = await db
    .select({ key: kinds.key })
    .from(kinds)
    .where(ownedBy(kinds, owner));
  return new Set(rows.map((r) => r.key));
}
