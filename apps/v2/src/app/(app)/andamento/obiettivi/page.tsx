/**
 * Obiettivi (V-09; the board Goals): the goals in force, each a row as the
 * board draws it (features/progress/goal-rows): the weight to reach (now →
 * target, by when, the pace it needs and the one of the last weeks, the
 * arrival, how far along, what today asks), a per-day count (this week's
 * days coloured), a week's hours (study); a goal nothing counts yet faded.
 * «+ Nuovo obiettivo» opens the editor.
 */
import { Box, F, NavBar, PageHeader } from "@lifeos/kit";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { readDayTargets } from "@/core/day";
import { addDays, logicalDay } from "@/core/engines/time";
import {
  readGoals,
  readMinutes,
  readNumbers,
  weightProgress,
  type Goal,
} from "@/core/goals";
import type { Db } from "@/core/db/db";
import type { Owner } from "@/core/identity/owner";
import { readDayModel } from "@/core/plans";
import { AREA_HREF } from "@/features/places";
import { goalRow, weekDays, type GoalProgress } from "@/features/progress/goal-rows";

/** The kinds whose one field a per-day goal counts, by the goal's metric. */
const COUNTS: Record<string, [kind: string, field: string]> = {
  steps: ["steps", "steps"],
};
/** The hours a per-week goal adds up, by the goal's metric: an activity's category. */
const HOURS: Record<string, [kind: string, field: string, text: string]> = {
  study: ["activity", "category", "study"],
};

async function progressOf(
  db: Db,
  owner: Owner,
  g: Goal,
  today: string,
): Promise<GoalProgress> {
  if (g.source === "weight" && g.target === "reach" && g.value !== null) {
    const from = g.since < addDays(today, -28) ? g.since : addDays(today, -28);
    const ws = (await readNumbers(db, owner, "weigh_in", "weightKg", from, today)).map(
      (x) => ({
        day: x.day,
        kg: x.n,
      }),
    );
    return {
      type: "weight",
      p: weightProgress(ws, { value: g.value, since: g.since, by: g.by }, today),
    };
  }
  const count = COUNTS[g.source];
  if (count && g.metric["per"] === "day" && g.target === "at_least" && g.value !== null) {
    const [kind, field] = count;
    const ns = await readNumbers(db, owner, kind, field, addDays(today, -6), today);
    return { type: "days", days: weekDays(ns, today, g.metric["days"] === "weekdays") };
  }
  const hours = HOURS[g.source];
  if (
    hours &&
    g.metric["per"] === "week" &&
    g.target === "at_least" &&
    g.value !== null
  ) {
    const [kind, field, text] = hours;
    const t = new Date(today + "T00:00:00Z").getUTCDay();
    const monday = addDays(today, -((t + 6) % 7));
    return {
      type: "hours",
      minutes: await readMinutes(db, owner, kind, field, text, monday, today),
    };
  }
  return null;
}

export default async function GoalsPage() {
  const owner = await requireOwner();
  const db = await getDb();
  const today = logicalDay(new Date(), (await ownerClock()).clock);
  const goals = await readGoals(db, owner, today);
  const weight = goals.some((g) => g.source === "weight");
  const [shown, targets] = await Promise.all([
    Promise.all(
      goals.map(async (g) => ({ g, p: await progressOf(db, owner, g, today) })),
    ),
    // What today asks, for the weight goal's «da qui»: the day's model and the week.
    weight
      ? readDayModel(db, owner, today).then((m) => readDayTargets(db, owner, today, m))
      : null,
  ]);
  const silent = shown.filter((s) => s.p === null).length;
  return (
    <main className="k-page has-bd">
      <PageHeader
        title="Obiettivi"
        context={
          F.plural(goals.length, "obiettivo", "obiettivi") +
          (silent ? " · " + F.plural(silent, "senza dati", "senza dati") : "")
        }
        back={{ label: "Andamento", href: "/oggi/andamento" }}
        of={{ fam: "goal" }}
      />
      <section className="k-section g3" aria-label="I tuoi obiettivi">
        {shown.length === 0 && <p className="k-help">Nessun obiettivo in corso.</p>}
        {shown.map(({ g, p }) => (
          <Box
            key={g.id}
            density="row"
            rail={false}
            entry={goalRow(
              g,
              p,
              targets ? { kcal: targets.kcal, protein: targets.protein } : null,
            )}
          />
        ))}
        <a className="k-btn secondary" href="/andamento/obiettivi/nuovo">
          + Nuovo obiettivo
        </a>
      </section>
      <div className="k-nav k-stick">
        <NavBar active="oggi" hrefs={AREA_HREF} addHref="/aggiungi" />
      </div>
    </main>
  );
}
