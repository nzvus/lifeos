/**
 * V-01, Oggi (screens.md): one logical day, `/oggi` for today and
 * `/oggi/2026-10-15` for any other. The server reads and composes the day
 * (core/day), presents each item as a kit Box (features/day) and hands the
 * client plain rows and the row actions (./actions.ts); the client holds the
 * filters, the rail's mode and the toast.
 * So far: the day as a Box (Nutrients L1 against the targets in force),
 * water with +250/+500 ml, the filters by domain and state, the timeline and
 * the untimed items. The
 * day's scores and the add sheet come with their slices.
 */
import { notFound } from "next/navigation";
import { DateNav, Box, F, NavBar, Nutrients, PageHeader } from "@lifeos/kit";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { dayMinute, loadDay, readDayTargets, readMicroTargets } from "@/core/day";
import { logicalDay } from "@/core/engines/time";
import { readFoodEstimates } from "@/core/food/catalog";
import { foodIds, presentDay } from "@/features/day/nutrients";
import { present } from "@/features/day/present";
import { DayView } from "@/features/day/DayView";
import { addWater, bringBack, changeStatus, removeEntry } from "./actions";
import { PLACES } from "@/features/places";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export default async function OggiPage({
  params,
}: {
  params: Promise<{ day?: string[] }>;
}) {
  const owner = await requireOwner();
  const db = await getDb();
  const { day: segments = [] } = await params;
  if (segments.length > 1 || (segments[0] !== undefined && !ISO.test(segments[0])))
    notFound();
  const known = await ownerClock();
  const { clock } = known;
  const now = new Date();
  const today = logicalDay(now, clock);
  const date = segments[0] ?? today;
  const [day, targets, micros] = await Promise.all([
    loadDay(db, owner, date, known),
    readDayTargets(db, owner, date),
    readMicroTargets(db, owner, date),
  ]);
  const kinds = await readFoodEstimates(db, owner, foodIds(day));
  const whole = presentDay(day, targets, kinds, micros);
  const rows = day.timed.map((i) => ({
    ...present(i),
    id: i.id,
    status: i.status,
    minute: i.minute!,
  }));
  const untimed = day.untimed.map((i) => ({ ...present(i), id: i.id, status: i.status }));
  const nowMinute = date === today ? dayMinute(now, date, clock) : null;
  const empty = rows.length === 0 && untimed.length === 0;
  const water = [...day.timed, ...day.untimed]
    .filter((i) => i.kind.key === "water" && i.status === "done")
    .reduce((ml, i) => ml + Number(i.values["ml"] ?? 0), 0);

  return (
    <main className="k-page has-bd">
      <PageHeader title="Oggi" of={{ place: "oggi" }} />
      <section className="k-block g3">
        <DateNav day={date} today={today} hrefBase="/oggi/" />
      </section>
      {whole && (
        <section className="k-block g3" aria-label="Il giorno">
          <Box entry={whole.entry} rail={false}>
            <Nutrients data={whole.nutrients} />
          </Box>
        </section>
      )}
      {date <= today && (
        <section className="k-block g3" aria-label="Acqua">
          <div className="k-line between">
            <span className="k-body">
              Acqua <span className="k-num">{F.num(water / 1000, "l")}</span>
            </span>
            <div className="k-chips">
              <form action={addWater.bind(null, date, 250)}>
                <button type="submit" className="k-chip">
                  +250 ml
                </button>
              </form>
              <form action={addWater.bind(null, date, 500)}>
                <button type="submit" className="k-chip">
                  +500 ml
                </button>
              </form>
            </div>
          </div>
        </section>
      )}
      <section className="k-section g3" aria-label="La giornata">
        {empty ? (
          <p className="k-empty k-meta">Niente in questa giornata.</p>
        ) : (
          <DayView
            actions={{ changeStatus, removeEntry, bringBack }}
            rows={rows}
            untimed={untimed}
            now={
              nowMinute === null ? null : { minute: nowMinute, label: F.time(nowMinute) }
            }
          />
        )}
      </section>
      <div className="k-nav k-stick">
        <NavBar active="today" hrefs={PLACES} addHref={"/aggiungi?giorno=" + date} />
      </div>
    </main>
  );
}
