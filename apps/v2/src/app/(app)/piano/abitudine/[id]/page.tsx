/**
 * Piano · an habit (`/piano/abitudine/nuova` or its id; dossiers/
 * day-templates.md slice d): its form, «In pausa» / «Riattiva».
 */
import { notFound } from "next/navigation";
import { F, NavBar, PageHeader } from "@lifeos/kit";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { readHabits } from "@/core/plans";
import { HabitForm } from "@/features/plan/HabitForm";
import { AREA_HREF } from "@/features/places";
import { pauseHabit, saveHabitForm } from "./actions";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function HabitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "nuova";
  if (!isNew && !UUID.test(id)) notFound();
  const h = isNew
    ? null
    : (await readHabits(await getDb(), await requireOwner())).find((x) => x.id === id);
  if (!isNew && !h) notFound();
  if (isNew) await requireOwner();
  const r = h?.recurrence;
  return (
    <main className="k-page has-bd">
      <PageHeader
        title={h ? h.name : "Nuova abitudine"}
        context={
          h ? (h.active ? "abitudine" : "abitudine in pausa") : "un blocco che si ripete"
        }
        back={{ label: "Modelli", href: "/piano/modelli" }}
        of={{ fam: "habit" }}
      />
      <HabitForm
        initial={
          h
            ? {
                name: h.name,
                what: h.category ? h.kind + ":" + h.category : h.kind,
                rule:
                  r!.type === "weekdays"
                    ? "weekdays"
                    : r!.type === "timesPerWeek"
                      ? "times"
                      : "daily",
                n: r!.type === "timesPerWeek" ? String(r!.n) : "3",
                at: h.atMin === null ? "" : F.time(h.atMin),
                durationMin: h.durationMin === null ? "" : String(h.durationMin),
              }
            : {}
        }
        weekdays={r?.type === "weekdays" ? r.days : [1, 2, 3, 4, 5]}
        action={saveHabitForm.bind(null, h ? h.id : null)}
      />
      {h && (
        <form action={pauseHabit.bind(null, h.id, !h.active)} className="k-section">
          <button type="submit" className="k-btn secondary">
            {h.active ? "Metti in pausa" : "Riattiva"}
          </button>
        </form>
      )}
      <div className="k-nav k-stick">
        <NavBar active="oggi" hrefs={AREA_HREF} addHref="/aggiungi" />
      </div>
    </main>
  );
}
