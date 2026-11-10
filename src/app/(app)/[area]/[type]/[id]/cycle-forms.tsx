/**
 * A ciclo's forms (PAT-04, PAT-11, PAT-62; change 2026-11-07-piano): `/oggi/ciclo/nuovo` — its
 * name and rules (the generated form, `NewObjectForm`), then on to its steps — and
 * `/oggi/ciclo/<id>/componi`, its steps on the kit `Composer` with «+ Riposo» (Q-16 (a)).
 */
import { notFound } from "next/navigation";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { catalogType } from "@/core/kinds/catalog";
import { localParts, logicalDay } from "@/core/engines/time";
import { readCycleBook } from "@/core/plans";
import { NewObjectForm } from "@/features/objects/NewObjectForm";
import { newFields } from "@/features/objects/present";
import { CycleComposer } from "@/features/plan/CycleComposer";
import { plan } from "@/i18n/plan";
import { objectCreate } from "./actions";
import { saveCycleSteps } from "./cycle-actions";
import type { NewFormRender } from "./new-forms";

export const newCycle: NewFormRender = async (back) => {
  const today = logicalDay(new Date(), (await ownerClock()).clock);
  return (
    <NewObjectForm
      title={plan.cycle.newTitle}
      back={back}
      fam="day"
      fields={newFields(catalogType("cycle")!)}
      initial={{ advance: "occurrence", onSkip: "lose", start: today }}
      action={objectCreate.bind(null, "cycle", "componi")}
    />
  );
};

export const composeCycle = async (id: string) => {
  const owner = await requireOwner();
  const db = await getDb();
  const { clock } = await ownerClock();
  const book = await readCycleBook(db, owner);
  const c = book.cycles.find((x) => x.id === id);
  if (!c) notFound();
  return (
    <CycleComposer
      title={c.name}
      back={{ label: c.name, href: "/oggi/ciclo/" + c.id }}
      schede={book.routines}
      initial={c.steps.map((s) => ({
        key: s.id,
        itemId: s.items[0]?.id ?? null,
        label: s.items[0]?.name ?? (s.label || plan.cycle.rest),
      }))}
      hour={Math.floor(localParts(new Date(), clock.timeZone).minute / 60)}
      action={saveCycleSteps.bind(null, c.id)}
    />
  );
};
