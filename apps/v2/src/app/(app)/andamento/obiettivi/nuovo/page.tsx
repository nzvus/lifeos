/** «Nuovo obiettivo» (V-09): `/andamento/obiettivi/nuovo`, with today's weight for the pace it asks. */
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { readClock } from "@/core/day";
import { addDays, logicalDay } from "@/core/engines/time";
import { readNumbers } from "@/core/goals";
import { GoalForm } from "@/features/progress/GoalForm";
import { saveGoal } from "./actions";

export default async function NewGoalPage() {
  const owner = await requireOwner();
  const db = await getDb();
  const today = logicalDay(new Date(), (await readClock(db, owner)).clock);
  const ws = await readNumbers(
    db,
    owner,
    "weigh_in",
    "weightKg",
    addDays(today, -6),
    today,
  );
  const nowKg = ws.length === 0 ? null : ws.reduce((a, w) => a + w.n, 0) / ws.length;
  return <GoalForm nowKg={nowKg} today={today} action={saveGoal} />;
}
