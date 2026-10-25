/**
 * core/movement/routes.ts — routes and trips (dossiers/movement.md, slice 1;
 * the agent's decisions while the developer was away: distances typed, no
 * routing service yet). A route is a catalog item (`route`) with its mode,
 * km, usual minutes, metres on foot and an optional Maps link; a trip is an
 * entry of kind `trip` «of» its route, with its own start and end and the
 * route's values copied (a snapshot, ADR-0007). Owned by the owner.
 */
import { and, count, eq, gte, inArray, isNull } from "drizzle-orm";
import type { Db } from "../db/db";
import { catalogItems, catalogValues, entries, entryValues } from "../db/schema";
import type { IsoDate } from "../engines/time";
import { ownedBy, type Owner } from "../identity/owner";

export const MODES = ["walk", "run", "bike", "bus", "train", "car", "mixed"] as const;
export type Mode = (typeof MODES)[number];

export type Route = {
  id: string;
  name: string;
  mode: Mode;
  distanceKm: number | null;
  durationMin: number | null;
  walkingM: number | null;
  mapsUrl: string | null;
  /** Trips along it in the last 90 days. */
  uses: number;
};

export type RouteInput = {
  name: string;
  mode: string;
  distanceKm: string;
  durationMin: string;
  walkingM: string;
  mapsUrl: string;
};

export type RouteError =
  "name" | "mode" | "distanceKm" | "durationMin" | "walkingM" | "mapsUrl";

const num = (s: string) => {
  const t = s.trim().replace(",", ".");
  return t === "" ? null : /^\d+(\.\d+)?$/.test(t) ? Number(t) : NaN;
};

/** Pure: the typed route checked; a Maps link only from Google Maps. */
export function checkRoute(
  i: RouteInput,
): { ok: true; route: Omit<Route, "id" | "uses"> } | { ok: false; errors: RouteError[] } {
  const errors: RouteError[] = [];
  const name = i.name.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 60) errors.push("name");
  const mode = (MODES as readonly string[]).includes(i.mode) ? (i.mode as Mode) : null;
  if (!mode) errors.push("mode");
  const km = num(i.distanceKm);
  if (Number.isNaN(km) || (km !== null && km > 1000)) errors.push("distanceKm");
  const min = num(i.durationMin);
  if (Number.isNaN(min) || (min !== null && min > 1440)) errors.push("durationMin");
  const walk = num(i.walkingM);
  if (Number.isNaN(walk) || (walk !== null && walk > 100000)) errors.push("walkingM");
  const url = i.mapsUrl.trim();
  if (
    url &&
    !/^https:\/\/(www\.)?(google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps)/.test(
      url,
    )
  )
    errors.push("mapsUrl");
  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    route: {
      name,
      mode: mode!,
      distanceKm: km,
      durationMin: min,
      // On foot, the whole route is walked unless said otherwise.
      walkingM:
        walk ?? ((mode === "walk" || mode === "run") && km !== null ? km * 1000 : null),
      mapsUrl: url || null,
    },
  };
}

export async function createRoute(
  db: Db,
  owner: Owner,
  r: Omit<Route, "id" | "uses">,
): Promise<string | "taken"> {
  return db.transaction(async (tx) => {
    // A live route of the same name is refused by the catalog's unique name: «taken».
    const [row] = await tx
      .insert(catalogItems)
      .values({ userId: owner.id, catalog: "route", name: r.name })
      .onConflictDoNothing()
      .returning({ id: catalogItems.id });
    if (!row) return "taken" as const;
    const vals: { field: string; num?: string; text?: string }[] = [
      { field: "mode", text: r.mode },
    ];
    if (r.distanceKm !== null)
      vals.push({ field: "distanceKm", num: String(r.distanceKm) });
    if (r.durationMin !== null)
      vals.push({ field: "durationMin", num: String(r.durationMin) });
    if (r.walkingM !== null)
      vals.push({ field: "walkingM", num: String(Math.round(r.walkingM)) });
    if (r.mapsUrl) vals.push({ field: "mapsUrl", text: r.mapsUrl });
    await tx.insert(catalogValues).values(
      vals.map((v) => ({
        userId: owner.id,
        itemId: row.id,
        field: v.field,
        num: v.num ?? null,
        text: v.text ?? null,
      })),
    );
    return row.id;
  });
}

/** The owner's live routes, most used in the last 90 days first. */
export async function readRoutes(db: Db, owner: Owner, since: IsoDate): Promise<Route[]> {
  const items = await db
    .select({ id: catalogItems.id, name: catalogItems.name })
    .from(catalogItems)
    .where(
      and(
        ownedBy(catalogItems, owner),
        eq(catalogItems.catalog, "route"),
        isNull(catalogItems.deletedAt),
        isNull(catalogItems.archivedAt),
      ),
    );
  if (items.length === 0) return [];
  const ids = items.map((i) => i.id);
  const [vals, uses] = await Promise.all([
    db
      .select({
        itemId: catalogValues.itemId,
        field: catalogValues.field,
        num: catalogValues.num,
        text: catalogValues.text,
      })
      .from(catalogValues)
      .where(and(ownedBy(catalogValues, owner), inArray(catalogValues.itemId, ids))),
    db
      .select({ itemId: entries.itemId, n: count() })
      .from(entries)
      .where(
        and(
          ownedBy(entries, owner),
          eq(entries.kind, "trip"),
          isNull(entries.deletedAt),
          gte(entries.day, since),
          inArray(entries.itemId, ids),
        ),
      )
      .groupBy(entries.itemId),
  ]);
  const v = (id: string, f: string) => vals.find((x) => x.itemId === id && x.field === f);
  const n = (id: string, f: string) => {
    const x = v(id, f)?.num;
    return x == null ? null : Number(x);
  };
  return items
    .map((i) => ({
      id: i.id,
      name: i.name,
      mode: ((v(i.id, "mode")?.text as Mode | undefined) ?? "mixed") as Mode,
      distanceKm: n(i.id, "distanceKm"),
      durationMin: n(i.id, "durationMin"),
      walkingM: n(i.id, "walkingM"),
      mapsUrl: v(i.id, "mapsUrl")?.text ?? null,
      uses: uses.find((u) => u.itemId === i.id)?.n ?? 0,
    }))
    .sort((a, b) => b.uses - a.uses || a.name.localeCompare(b.name, "it"));
}

/** Logs a trip along a route, ending at `end` and lasting `minutes`; its id. */
export async function logTrip(
  db: Db,
  owner: Owner,
  route: Route,
  day: IsoDate,
  end: Date,
  minutes: number,
): Promise<string> {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(entries)
      .values({
        userId: owner.id,
        kind: "trip",
        day,
        status: "done",
        startAt: new Date(end.getTime() - minutes * 60_000),
        endAt: end,
        itemId: route.id,
        source: "typed",
      })
      .returning({ id: entries.id });
    const vals: { field: string; num?: string; text?: string }[] = [
      { field: "mode", text: route.mode },
    ];
    if (route.distanceKm !== null)
      vals.push({ field: "distanceKm", num: String(route.distanceKm) });
    if (route.walkingM !== null)
      vals.push({ field: "walkingM", num: String(route.walkingM) });
    await tx.insert(entryValues).values(
      vals.map((x) => ({
        userId: owner.id,
        entryId: row!.id,
        field: x.field,
        num: x.num ?? null,
        text: x.text ?? null,
      })),
    );
    return row!.id;
  });
}
