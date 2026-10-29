/**
 * ⊕ → «Attività» (dossiers/activity.md §6): a run, a ride, a row already
 * done, over the page it came from. `?es=` picks the activity (from ⊕'s
 * search or a cardio exercise); else «Corsa» when the person has one.
 */
import { F } from "@lifeos/kit";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { localParts } from "@/core/engines/time";
import { readExercises } from "@/core/training";
import { ActivitySheet } from "@/features/training/ActivitySheet";
import { addContext } from "../kinds";
import { saveActivity } from "./actions";
import { isCardio } from "./cardio";

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ giorno?: string | string[]; es?: string | string[] }>;
}) {
  const owner = await requireOwner();
  const db = await getDb();
  const asked = await searchParams;
  const { day, today, clock } = await addContext(db, owner, asked.giorno);
  const choices = (await readExercises(db, owner)).filter(isCardio);
  const first =
    choices.find((c) => c.id === asked.es) ??
    choices.find((c) => c.name.toLowerCase() === "corsa") ??
    choices[0];
  const now = F.time(localParts(new Date(), clock.timeZone).minute);
  const back = "/aggiungi?giorno=" + day;
  return (
    <main className="k-page">
      <ActivitySheet
        day={day}
        dayLabel={day === today ? "oggi" : F.Day(day)}
        choices={[
          ...(first ? [first] : []),
          ...choices.filter((c) => c.id !== first?.id),
        ].map((c) => ({ id: c.id, name: c.name }))}
        initial={{
          exercise: first?.id ?? "",
          end: day === today ? now : "",
          minutes: "30",
        }}
        closeHref={back}
        action={saveActivity}
      />
    </main>
  );
}
