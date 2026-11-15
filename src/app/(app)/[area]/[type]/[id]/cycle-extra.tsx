/**
 * A ciclo's own sections on the generic ObjectPage (PAT-30; PL-30…33; change 2026-11-07-piano):
 * «Cambia i passi» (its Composer, PAT-62 + «+ Riposo»), its steps in order with the one due
 * today, and «Andamento»: the sessions of the last two weeks that counted for it. Its rules
 * (advance, on skip, start) are its values, edited in place; paused = Archivia (PL-70).
 */
import { Box, F, List, type BoxEntry } from "@lifeos/kit";
import { ownerClock } from "@/app/_server/clock";
import { addDays, logicalDay } from "@/core/engines/time";
import { readCycleBook, readDayPlans, readSessionKeys } from "@/core/plans";
import { plan } from "@/i18n/plan";
import type { Build } from "./extras";
import { ThisTime } from "@/features/plan/ThisTime";
import { chooseStep, skipStep } from "../../../oggi/[[...day]]/plan-actions";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

const w = plan.cycle;
const HISTORY_DAYS = 14;

export const cycleExtra: Build = async (db, owner, id, query) => {
  const today = logicalDay(new Date(), (await ownerClock()).clock);
  const [book, plans, done] = await Promise.all([
    readCycleBook(db, owner),
    readDayPlans(db, owner, today, today, today),
    readSessionKeys(db, owner, addDays(today, -HISTORY_DAYS)),
  ]);
  const c = book.cycles.find((x) => x.id === id);
  if (!c) return null;
  const due = plans.get(today)?.cycles.find((x) => x.cycleId === id) ?? null;
  const nameOf = (s: (typeof c.steps)[number]) =>
    s.label || s.items.map((i) => i.name).join(" + ") || w.rest;
  const rows: BoxEntry[] = c.steps.map((s, i) => {
    const rest = s.items.length === 0;
    const scheda = s.items[0];
    return {
      fam: rest ? "day" : "train",
      ...(rest ? {} : { sub: "strength" }),
      title: i + 1 + " · " + nameOf(s),
      // A step is a giornata tipo (proposal §31): its righe, not «scheda».
      meta: rest ? w.restMeta : s.items.map((x) => x.name).join(" · "),
      ...(due && due.label === nameOf(s) ? { value: w.today } : {}),
      // An older step holding its scheda directly opens it; a riga's own page is not his to see.
      ...(scheda && !scheda.inCycle ? { href: "/corpo/scheda/" + scheda.id } : {}),
    };
  });
  // The sessions that counted: one of the schede its steps hold.
  const stepOf = new Map(
    c.steps.flatMap((s) => s.items.map((i) => [i.id, nameOf(s)] as const)),
  );
  const history: BoxEntry[] = done
    .flatMap((o) => {
      const step = o.keys.map((k) => stepOf.get(k)).find(Boolean);
      return step ? [{ day: o.day, step }] : [];
    })
    .sort((a, b) => b.day.localeCompare(a.day))
    .map((h) => ({
      fam: "train",
      sub: "strength",
      title: h.step,
      time: F.date(h.day),
      value: w.done,
    }));
  // Reached from a line's tag on a day (proposal §32, slice 2): «Questa volta» for that day.
  const day = query["giorno"] && ISO.test(query["giorno"]) ? query["giorno"] : null;
  const that = day
    ? (await readDayPlans(db, owner, day, day, today))
        .get(day)
        ?.cycles.find((x) => x.cycleId === id)
    : undefined;
  const thisTime =
    day && that ? (
      <section className="k-stack g2" aria-label="Questa volta">
        <h3 className="k-label">{"Questa volta · " + F.Day(day)}</h3>
        <ThisTime
          steps={c.steps.map((s) => ({ label: nameOf(s), position: s.position }))}
          current={that.position}
          custom
          skipped={that.skipped}
          choose={chooseStep.bind(null, day, id)}
          skip={skipStep.bind(null, day, id)}
        />
      </section>
    ) : null;
  return {
    meta: w.meta(c.steps.length, due),
    // The steps first, its rules folded (his 15 Nov: «fatti male»; proposal §31–§32).
    ...(thisTime ? { first: thisTime } : {}),
    fold: w.rules,
    parts: [
      {
        title: w.steps,
        node: (
          <>
            {rows.length === 0 ? (
              <p className="k-meta">{w.empty}</p>
            ) : (
              <List label={w.steps}>
                {rows.map((r, i) => (
                  <Box key={i} density="row" rail={false} entry={r} />
                ))}
              </List>
            )}
            <a className="k-btn secondary" href={"/oggi/ciclo/" + id + "/componi"}>
              {w.compose}
            </a>
          </>
        ),
      },
    ],
    progress: (
      <section className="k-stack g2" aria-label={w.history(HISTORY_DAYS)}>
        <h3 className="k-label">{w.history(HISTORY_DAYS)}</h3>
        {history.length === 0 ? (
          <p className="k-meta">{w.noHistory}</p>
        ) : (
          history.map((h, i) => <Box key={i} entry={h} density="row" mode="times" />)
        )}
      </section>
    ),
  };
};
