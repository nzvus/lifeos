/** One logical day (V-01): read it for an owner, compose it with the kinds. */
import type { Db } from "../db/db";
import type { IsoDate } from "../engines/time";
import type { Owner } from "../identity/owner";
import { kindRegistry } from "../kinds";
import { readDay } from "./read";
import { composeDay, type Day } from "./timeline";

export * from "./read";
export * from "./timeline";

export async function loadDay(db: Db, owner: Owner, day: IsoDate): Promise<Day> {
  const rows = await readDay(db, owner, day);
  return composeDay(rows, kindRegistry(rows.userKinds));
}
