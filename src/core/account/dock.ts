/**
 * core/account/dock.ts — the dock he edits (PAT-99, his O5 «dovrei essere in grado di
 * personalizzarla»): the «assunzioni» he pinned to «Al volo», in his order, kept in the
 * settings' prefs (`dock`). The app's guesses fill what is left of the row.
 */
import { eq, sql } from "drizzle-orm";
import type { Db } from "../db/db";
import { settings } from "../db/schema";
import type { Owner } from "../identity/owner";

/** More than this is a list, not a dock. */
export const DOCK_MAX = 8;
/** The row's length while he pinned fewer: the guesses fill it up to here. */
export const DOCK_ROW = 4;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Pure: what was stored or sent, as pins — ids only, once each, at most `DOCK_MAX`. */
export function cleanPins(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const ids = raw.filter((x): x is string => typeof x === "string" && UUID.test(x));
  return [...new Set(ids)].slice(0, DOCK_MAX);
}

/**
 * Pure: the row. His pins first, in his order, skipping one that is no longer an «assunzione»
 * (archived, deleted); then the guesses he did not pin, until the row has `DOCK_ROW` chips.
 */
export function dockRow(
  pins: readonly string[],
  guesses: readonly string[],
  known: ReadonlySet<string>,
): string[] {
  const mine = pins.filter((id) => known.has(id));
  const rest = guesses.filter((id) => known.has(id) && !mine.includes(id));
  return [...mine, ...rest.slice(0, Math.max(0, DOCK_ROW - mine.length))];
}

export async function readDock(db: Db, owner: Owner): Promise<string[]> {
  const [row] = await db
    .select({ prefs: settings.prefs })
    .from(settings)
    .where(eq(settings.userId, owner.id));
  return cleanPins((row?.prefs as Record<string, unknown> | undefined)?.["dock"]);
}

export async function saveDock(db: Db, owner: Owner, pins: unknown): Promise<string[]> {
  const clean = cleanPins(pins);
  const json = JSON.stringify(clean);
  const value = sql`jsonb_set(coalesce(${settings.prefs}, '{}'::jsonb), '{dock}', ${json}::jsonb)`;
  await db
    .insert(settings)
    .values({ userId: owner.id, prefs: { dock: clean } })
    .onConflictDoUpdate({ target: settings.userId, set: { prefs: value } });
  return clean;
}
