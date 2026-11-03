/**
 * core/account/not-twins.ts — the pairs he said are not duplicates («Sono
 * diversi», ADR-0060 slice f), kept in the settings' prefs so the review
 * list never asks again. A pair is its two ids sorted, joined by «|».
 */
import { eq, sql } from "drizzle-orm";
import type { Db } from "../db/db";
import { settings } from "../db/schema";
import type { Owner } from "../identity/owner";

export const pairKey = (a: string, b: string) => [a, b].sort().join("|");

export async function readNotTwins(db: Db, owner: Owner): Promise<Set<string>> {
  const [row] = await db
    .select({ prefs: settings.prefs })
    .from(settings)
    .where(eq(settings.userId, owner.id));
  const list = (row?.prefs as Record<string, unknown> | undefined)?.["notTwins"];
  return new Set(
    Array.isArray(list) ? list.filter((x): x is string => typeof x === "string") : [],
  );
}

export async function addNotTwins(
  db: Db,
  owner: Owner,
  a: string,
  b: string,
): Promise<void> {
  const key = pairKey(a, b);
  const value = sql`jsonb_set(coalesce(${settings.prefs}, '{}'::jsonb), '{notTwins}', coalesce(${settings.prefs}->'notTwins', '[]'::jsonb) || ${JSON.stringify([key])}::jsonb)`;
  await db
    .insert(settings)
    .values({ userId: owner.id, prefs: { notTwins: [key] } })
    .onConflictDoUpdate({ target: settings.userId, set: { prefs: value } });
}
