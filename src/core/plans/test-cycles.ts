/**
 * core/plans/test-cycles.ts — cicli for the tests (as `core/db/test-db.ts`): one made as the
 * app makes it (MOD-36: `core/verbs` create, its rules as values), a step added at the end
 * through `setCycleSteps`. Never used by the app.
 */
import type { Db } from "../db/db";
import type { Owner } from "../identity/owner";
import { act } from "../verbs";
import { readCycleBook, setCycleSteps } from "./cycles-repo";

/** A new ciclo by occurrence, a skipped step lost, from `start`; its id. */
export async function createCycle(
  db: Db,
  owner: Owner,
  name: string,
  start: string,
): Promise<string> {
  const r = await act(db, owner, "create", "cycle", null, {
    name,
    values: { advance: "occurrence", onSkip: "lose", start },
  });
  if (!r.ok) throw new Error("ciclo not made: " + r.refused);
  return r.id;
}

/** A step at the end: a scheda's session, or a rest (null). False when not his. */
export async function addStep(
  db: Db,
  owner: Owner,
  cycleId: string,
  routineId: string | null,
): Promise<boolean> {
  const c = (await readCycleBook(db, owner)).cycles.find((x) => x.id === cycleId);
  if (!c) return false;
  const order = [
    ...c.steps.map((s) => ({ step: s.id })),
    routineId ? { item: routineId } : { rest: true as const },
  ];
  return (await setCycleSteps(db, owner, cycleId, order)) === "ok";
}
