/**
 * Obiettivi (V-09), first part: the goals in force, each in words, and its
 * progress where a tracker already counts it: the weight to reach (now vs
 * start, pace vs needed, ETA, on track), a per-day count (this week's
 * days on target) and a week's hours (study). «+ Nuovo obiettivo» opens the editor.
 */
import { Box, F, NavBar, PageHeader } from "@lifeos/kit";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { addDays, logicalDay } from "@/core/engines/time";
import {
  readGoals,
  readMinutes,
  readNumbers,
  weekDaysOnTarget,
  weightProgress,
  type Goal,
} from "@/core/goals";
import type { Db } from "@/core/db/db";
import type { Owner } from "@/core/identity/owner";
import { PLACES } from "@/features/places";
import { goalText, goalTitle } from "@/features/progress/goals";

/** The kinds whose one field a per-day goal counts, by the goal's metric. */
const COUNTS: Record<string, [kind: string, field: string]> = {
  steps: ["steps", "steps"],
};
/** The hours a per-week goal adds up, by the goal's metric: an activity's category. */
const HOURS: Record<string, [kind: string, field: string, text: string]> = {
  study: ["activity", "category", "study"],
};

type Row = { label: string; value: string };

async function progressOf(
  db: Db,
  owner: Owner,
  g: Goal,
  today: string,
): Promise<{ rows: Row[]; state: "good" | "warn" | null } | null> {
  if (g.source === "weight" && g.target === "reach" && g.value !== null) {
    const from = g.since < addDays(today, -28) ? g.since : addDays(today, -28);
    const ws = (await readNumbers(db, owner, "weigh_in", "weightKg", from, today)).map(
      (x) => ({
        day: x.day,
        kg: x.n,
      }),
    );
    const p = weightProgress(ws, { value: g.value, since: g.since, by: g.by }, today);
    if (!p)
      return {
        rows: [{ label: "Ora", value: "nessuna pesata negli ultimi 7 giorni" }],
        state: null,
      };
    const kgw = (x: number) => (x > 0 ? "+" : "") + F.num(x, "kg") + " a settimana";
    return {
      rows: [
        {
          label: "Ora",
          value:
            F.num(p.now, "kg") +
            (p.start !== null ? " (da " + F.num(p.start, "kg") + ")" : ""),
        },
        ...(p.pace !== null ? [{ label: "Ritmo", value: kgw(p.pace) }] : []),
        ...(p.needed !== null ? [{ label: "Ne serve", value: kgw(p.needed) }] : []),
        ...(p.eta ? [{ label: "Arrivo previsto", value: F.date(p.eta) }] : []),
      ],
      state: p.onTrack === null ? null : p.onTrack ? "good" : "warn",
    };
  }
  const count = COUNTS[g.source];
  if (count && g.metric["per"] === "day" && g.target === "at_least" && g.value !== null) {
    const [kind, field] = count;
    const ns = await readNumbers(db, owner, kind, field, addDays(today, -6), today);
    const w = weekDaysOnTarget(ns, g.value, today, g.metric["days"] === "weekdays");
    return {
      rows: [
        { label: "Questa settimana", value: w.hit + " giorni su " + w.of },
        ...(w.mean !== null ? [{ label: "Media", value: F.n(w.mean, 0) }] : []),
      ],
      state: w.of > 0 && w.hit === w.of ? "good" : null,
    };
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
    const min = await readMinutes(db, owner, kind, field, text, monday, today);
    return {
      rows: [
        { label: "Questa settimana", value: F.hm(min) + " di " + F.n(g.value, 0) + " h" },
      ],
      state: min >= g.value * 60 ? "good" : null,
    };
  }
  return null;
}

export default async function GoalsPage() {
  const owner = await requireOwner();
  const db = await getDb();
  const today = logicalDay(new Date(), (await ownerClock()).clock);
  const goals = await readGoals(db, owner, today);
  const shown = await Promise.all(
    goals.map(async (g) => ({ g, p: await progressOf(db, owner, g, today) })),
  );
  return (
    <main className="k-page has-bd">
      <PageHeader
        title="Obiettivi"
        back={{ label: "Andamento", href: "/andamento" }}
        of={{ place: "andamento" }}
      />
      <section className="k-section g3" aria-label="Obiettivi">
        <a className="k-btn secondary" href="/andamento/obiettivi/nuovo">
          + Nuovo obiettivo
        </a>
        {shown.length === 0 && <p className="k-help">Nessun obiettivo in corso.</p>}
        {shown.map(({ g, p }) => (
          <Box
            key={g.id}
            rail={false}
            entry={{
              fam: "day",
              title: goalTitle(g),
              meta: goalText(g),
              ...(p?.state
                ? {
                    pills: [
                      {
                        t: p.state === "good" ? "in linea" : "in ritardo",
                        state: p.state,
                      },
                    ],
                  }
                : {}),
            }}
          >
            {p ? (
              p.rows.map((r) => (
                <div key={r.label} className="k-line between">
                  <span className="k-body">{r.label}</span>
                  <span className="k-num">{r.value}</span>
                </div>
              ))
            ) : (
              <p className="k-help">Il conteggio arriva con il suo tracker.</p>
            )}
          </Box>
        ))}
      </section>
      <div className="k-nav k-stick">
        <NavBar active="progress" hrefs={PLACES} addHref="/aggiungi" />
      </div>
    </main>
  );
}
