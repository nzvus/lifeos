/** One logical day (V-01): read it for an owner, compose it with the kinds. */
import type { Db } from "../db/db";
import type { IsoDate } from "../engines/time";
import type { Owner } from "../identity/owner";
import { kindRegistry } from "../kinds";
import { readDay, readDays } from "./read";
import { composeDay, type Day } from "./timeline";

export * from "./read";
export * from "./timeline";
export * from "./targets";

export async function loadDay(db: Db, owner: Owner, day: IsoDate): Promise<Day> {
  const rows = await readDay(db, owner, day);
  return composeDay(rows, kindRegistry(rows.userKinds));
}

/** Every day of a range composed, from one set of queries (`readDays`). */
export async function loadDays(
  db: Db,
  owner: Owner,
  from: IsoDate,
  to: IsoDate,
): Promise<Day[]> {
  const all = await readDays(db, owner, from, to);
  const registry = kindRegistry(all[0]?.userKinds ?? []);
  return all.map((rows) => composeDay(rows, registry));
}
