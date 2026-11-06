/**
 * core/account/weights.ts — the person's weights for the scores (V-16,
 * «Come valutiamo»; E7: «the person moves weights within their range»):
 * one dated set per model in `settings.prefs.weights`, as E7's `Weights`
 * (model, version, since, values). A set for another version of the model
 * is ignored by `score` (the defaults apply). Kept in prefs: no column.
 */
import { sql } from "drizzle-orm";
import type { Db } from "../db/db";
import { settings } from "../db/schema";
import type { Weights } from "../engines/judgements";
import type { Owner } from "../identity/owner";

export type WeightBook = Readonly<Record<string, Weights>>;

/** Pure: the sets in prefs that read as weights; the rest is left out. */
export function weightsOf(prefs: Record<string, unknown>): WeightBook {
  const raw = prefs["weights"];
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, Weights> = {};
  for (const [id, w] of Object.entries(raw as Record<string, unknown>)) {
    const x = w as Partial<Weights>;
    if (
      x &&
      x.model === id &&
      typeof x.version === "number" &&
      typeof x.since === "string" &&
      x.values &&
      typeof x.values === "object" &&
      Object.values(x.values).every((v) => typeof v === "number" && Number.isFinite(v))
    )
      out[id] = x as Weights;
  }
  return out;
}

/** Keeps one model's set (null takes it out: the defaults again), leaving the rest of prefs. */
export async function saveWeights(
  db: Db,
  owner: Owner,
  model: string,
  w: Weights | null,
): Promise<void> {
  const path = `{weights,${model}}`;
  const value = w
    ? sql`jsonb_set(jsonb_set(coalesce(${settings.prefs}, '{}'::jsonb), '{weights}', coalesce(${settings.prefs}->'weights', '{}'::jsonb)), ${path}::text[], ${JSON.stringify(w)}::jsonb)`
    : sql`coalesce(${settings.prefs}, '{}'::jsonb) #- ${path}::text[]`;
  await db
    .insert(settings)
    .values({ userId: owner.id, prefs: w ? { weights: { [model]: w } } : {} })
    .onConflictDoUpdate({ target: settings.userId, set: { prefs: value } });
}
