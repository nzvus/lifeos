/**
 * Visual study, round 2 of «gli orari» (ledger UI-77, CONTRA-02, dossiers/
 * visual.md §3.4). The developer, 30 Oct: «una combinazione della versione
 * attuale con 2 e 3»: the coloured rail with its animation stays; the parts
 * of the day are full-width headers that cut the rail and one closes the day,
 * so what has no time sits below it without a rail and still aligned; empty
 * time is a thin dashed grey bar that can be filled with a tap; headers and
 * empty bars only where that time has passed or something is planned;
 * «coerente con le preimpostazioni di aggiunta»: the parts are the person's
 * own meal-role bounds, and a gap offers what ⊕ would offer at that hour.
 * Local study only.
 */
import type { ReactNode } from "react";
import { Box, F, type BoxEntry } from "@lifeos/kit";
import type { Db } from "@/core/db/db";
import type { Owner } from "@/core/identity/owner";
import { loadDays, readClock, type DayItem } from "@/core/day";
import { mealRoleAt } from "@/core/kinds/registry";
import { clockMin } from "@/core/engines/planning";
import { present } from "@/features/day/present";
import { MEAL_ROLE_WORDS } from "@/features/day/words";

const DAY = "2026-10-29";
const GAP = 120;
type Known = Awaited<ReturnType<typeof readClock>>;

export const TIMES_CSS = `
.st-tl{display:flex;flex-direction:column;gap:8px}
.st-ph{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:8px;margin:8px -12px 0;padding:6px 12px;background:color-mix(in srgb,var(--ink) 6%,var(--paper));font-family:var(--font-display);font-size:var(--fs-b2);font-weight:700}
.st-ph .r{height:1px;background:var(--hairline)}
.st-ph .t{font-family:var(--font-body);font-weight:400;font-size:var(--fs-b3);color:var(--muted);font-variant-numeric:tabular-nums}
.st-ph.end{color:var(--muted)}
.st-gap{display:grid;grid-template-columns:20px minmax(0,1fr);column-gap:8px;align-items:center}
.st-gap .bar{justify-self:start;width:0;height:100%;min-height:28px;border-left:2px dashed color-mix(in srgb,var(--muted) 55%,transparent)}
.st-gap a{display:flex;align-items:center;gap:8px;min-height:var(--touch);padding:0 12px;border:1px dashed var(--hairline);border-radius:var(--r-row);color:var(--muted);text-decoration:none;font-size:var(--fs-b2)}
.st-gap a b{margin-left:auto;font-family:var(--font-display);color:var(--herb);font-weight:600}
.st-off{padding-left:28px}
`;

type Row = { i: DayItem; at: number; e: BoxEntry };

export async function TimesStudio({
  db,
  owner,
  known,
}: {
  db: Db;
  owner: Owner;
  known: Known;
}) {
  const [d] = await loadDays(db, owner, DAY, DAY, known);
  if (!d) return null;
  const b = known.clock.boundaryMin;
  const rb = known.roleBounds;
  const rows: Row[] = d.timed
    .filter((i) => i.kind.key !== "water" && i.minute !== null)
    .map((i) => ({ i, at: i.minute!, e: { ...present(i), time: F.time(i.minute!) } }));
  const untimed = d.untimed
    .filter((i) => i.kind.key !== "water")
    .map((i) => ({ id: i.id, e: present(i) as BoxEntry }));
  // The parts of the day are the person's meal-role bounds (the same that name a
  // meal by its time and that ⊕ uses): mattina from the day's start, then
  // mezzogiorno, pomeriggio, sera, notte from midnight to the day's end.
  const parts = [
    { name: "Mattina", from: b, to: rb.lunchFrom },
    { name: "Mezzogiorno", from: rb.lunchFrom, to: rb.snackFrom },
    { name: "Pomeriggio", from: rb.snackFrom, to: rb.dinnerFrom },
    { name: "Sera", from: rb.dinnerFrom, to: 1440 },
    { name: "Notte", from: 1440, to: 1440 + b },
  ];
  const roles = new Set(
    d.timed
      .filter((i) => i.kind.key === "meal")
      .map((i) => String(i.values["role"] ?? "")),
  );
  const gapLink = (from: number, to: number, past: boolean) => {
    const mid = from + Math.round((to - from) / 2);
    const role = mealRoleAt(clockMin(mid), rb);
    const st = past ? "prima" : "previsto";
    return !roles.has(role)
      ? {
          href: `/aggiungi/pasto?giorno=${DAY}&ruolo=${role}&ora=${F.time(mid)}&stato=${st}`,
          what: "+ " + MEAL_ROLE_WORDS[role],
        }
      : { href: `/aggiungi?giorno=${DAY}&stato=${st}`, what: "+ aggiungi" };
  };
  const timeline = (now: number | null) => {
    const shown =
      now === null ? rows : rows.filter((r) => r.at <= now || r.i.status === "planned");
    const out: ReactNode[] = [];
    let last: number | null = null;
    parts.forEach((p) => {
      const mine = shown.filter((r) => r.at >= p.from && r.at < p.to);
      // A part shows when its time has started (or the day is over), or it holds something.
      const started = now === null || now >= p.from;
      if (!started && mine.length === 0) return;
      out.push(
        <div key={"h" + p.name} className={"st-ph" + (mine.length === 0 ? " end" : "")}>
          <span>{p.name}</span>
          <span className="r" />
          <span className="t">
            {mine.length === 0 ? "niente · " : ""}dalle {F.time(p.from)}
          </span>
        </div>,
      );
      mine.forEach((r) => {
        if (last !== null && r.at - last >= GAP) {
          const g = gapLink(last, r.at, now === null || r.at <= now);
          out.push(
            <div key={"g" + r.i.id} className="st-gap">
              <span className="bar" style={{ height: Math.min(72, (r.at - last) / 4) }} />
              <a href={g.href}>
                {F.hm(r.at - last)} senza niente <b>{g.what}</b>
              </a>
            </div>,
          );
        }
        out.push(<Box key={r.i.id} entry={r.e} />);
        last = r.at;
      });
      // Time already passed at the end of a part with nothing since the last thing.
      const end = Math.min(p.to, now ?? p.to);
      if (
        now !== null &&
        now < p.to &&
        now >= p.from &&
        last !== null &&
        end - last >= GAP
      ) {
        const g = gapLink(last, end, true);
        out.push(
          <div key={"gn" + p.name} className="st-gap">
            <span className="bar" style={{ height: Math.min(72, (end - last) / 4) }} />
            <a href={g.href}>
              {F.hm(end - last)} senza niente <b>{g.what}</b>
            </a>
          </div>,
        );
      }
      if (now !== null && now >= p.from && now < p.to)
        out.push(
          <div key="now" className="k-now" aria-label={"Adesso, " + F.time(now)}>
            <span className="t">{F.time(now)}</span>
            <span className="line" />
          </div>,
        );
    });
    if (now === null) {
      out.push(
        <div key="end" className="st-ph end">
          <span>Fine giornata</span>
          <span className="r" />
          <span className="t">alle {F.time(1440 + b)}</span>
        </div>,
      );
      out.push(
        <div key="off" className="st-off k-stack g2">
          <span className="k-meta">Senza orario</span>
          {untimed.map((u) => (
            <Box key={u.id} entry={u.e} rail={false} />
          ))}
        </div>,
      );
    }
    return <div className="st-tl">{out}</div>;
  };
  return (
    <main className="k-page">
      <style>{TIMES_CSS}</style>
      <section className="k-section g2" aria-label="Com’è oggi">
        <h2>Gli orari, secondo giro — la tua giornata del 29 ottobre</h2>
        <p className="k-help">
          Hai scritto: «una combinazione della versione attuale con 2 e 3», il tempo vuoto
          come «una barra grigia sottile tratteggiata… se toccata può essere riempita», le
          parti del giorno come intestazioni larghe che tagliano la fascia e chiudono la
          giornata. Prima com’è oggi (le prime sei righe):
        </p>
        <div className="k-stack g2">
          {rows.slice(0, 6).map((r) => (
            <Box key={r.i.id} entry={r.e} />
          ))}
        </div>
      </section>
      <section className="k-section g2" aria-label="La proposta, giornata finita">
        <h2>La proposta · la giornata finita</h2>
        <p className="k-help">
          La fascia colorata resta, con l’ora in verticale e l’animazione. Le parti sono i
          tuoi orari dei pasti (gli stessi che danno il nome a un pasto e che usa ⊕):
          mattina, mezzogiorno, pomeriggio, sera, notte. Dove passano più di 2 ore senza
          niente, una barra tratteggiata: toccandola aggiungi, e propone il pasto che a
          quell’ora manca. «Fine giornata» chiude: sotto, le cose senza orario, allineate
          senza fascia.
        </p>
        {timeline(null)}
      </section>
      <section className="k-section g2" aria-label="La proposta, alle 13:10">
        <h2>La proposta · come la vedevi alle 13:10</h2>
        <p className="k-help">
          Le parti non ancora cominciate non si disegnano, a meno che dentro ci sia
          qualcosa di previsto; il tempo vuoto solo fino ad adesso.
        </p>
        {timeline(13 * 60 + 10)}
      </section>
    </main>
  );
}
