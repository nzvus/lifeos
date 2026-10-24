/**
 * core/day/closure.ts — «Chiudi la giornata» (S-T28, flows.md): the person
 * says the day's food log is whole («ho segnato tutto») or not («manca
 * qualcosa»); E4 trusts a closed day's kcal by that (engines/body/filter.ts).
 * One `day_closed` decision per day, its state in the payload as v1's
 * closures were converted; reopening removes it.
 */
import { and, eq } from "drizzle-orm";
import type { Db } from "../db/db";
import { decisions } from "../db/schema";
import type { IsoDate } from "../engines/time";
import { ownedBy, type Owner } from "../identity/owner";

export type Closure = "complete" | "partial";

const thisDay = (owner: Owner, day: IsoDate) =>
  and(
    ownedBy(decisions, owner),
    eq(decisions.kind, "day_closed"),
    eq(decisions.day, day),
  );

export async function readClosure(
  db: Db,
  owner: Owner,
  day: IsoDate,
): Promise<Closure | null> {
  const [row] = await db
    .select({ payload: decisions.payload })
    .from(decisions)
    .where(thisDay(owner, day))
    .limit(1);
  if (!row) return null;
  const state = (row.payload as { state?: unknown } | null)?.state;
  return state === "partial" ? "partial" : "complete";
}

/** Closes the day as `state`, or reopens it (null). */
export async function setClosure(
  db: Db,
  owner: Owner,
  day: IsoDate,
  state: Closure | null,
): Promise<void> {
  if (state === null) {
    await db.delete(decisions).where(thisDay(owner, day));
    return;
  }
  await db
    .insert(decisions)
    .values({ userId: owner.id, kind: "day_closed", day, key: "", payload: { state } })
    .onConflictDoUpdate({
      target: [decisions.userId, decisions.kind, decisions.day, decisions.key],
      set: { payload: { state } },
    });
}
