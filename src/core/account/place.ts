/**
 * core/account/place.ts — the person's city (E11: «the home city»), for the
 * weather on Oggi: kept in `settings.prefs.place` (name and coordinates, as
 * the geocoder gave them), so it needs no column of its own.
 */
import { sql } from "drizzle-orm";
import type { Db } from "../db/db";
import { settings } from "../db/schema";
import { ownedBy, type Owner } from "../identity/owner";

export type Place = { name: string; latitude: number; longitude: number };

const isPlace = (p: unknown): p is Place =>
  !!p &&
  typeof (p as Place).name === "string" &&
  typeof (p as Place).latitude === "number" &&
  typeof (p as Place).longitude === "number";

export async function readPlace(db: Db, owner: Owner): Promise<Place | null> {
  const [row] = await db
    .select({ prefs: settings.prefs })
    .from(settings)
    .where(ownedBy(settings, owner));
  const p = (row?.prefs ?? {})["place"];
  return isPlace(p) ? p : null;
}

/** Sets the city (null takes it out), leaving the other prefs as they are. */
export async function savePlace(
  db: Db,
  owner: Owner,
  place: Place | null,
): Promise<void> {
  const value = place
    ? sql`jsonb_set(coalesce(${settings.prefs}, '{}'::jsonb), '{place}', ${JSON.stringify(place)}::jsonb)`
    : sql`coalesce(${settings.prefs}, '{}'::jsonb) - 'place'`;
  await db
    .insert(settings)
    .values({ userId: owner.id, prefs: place ? { place } : {} })
    .onConflictDoUpdate({ target: settings.userId, set: { prefs: value } });
}
