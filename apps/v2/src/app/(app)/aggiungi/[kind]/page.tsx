/**
 * The entry sheet of one kind (V-03) for a day: `/aggiungi/water?giorno=…`.
 * The server finds the kind among those ⊕ offers and generates its form;
 * the client sheet posts it to `saveEntry`.
 */
import { notFound } from "next/navigation";
import { F } from "@lifeos/kit";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { dayMinute } from "@/core/day";
import { localParts } from "@/core/engines/time";
import { EntrySheet } from "@/features/day/EntrySheet";
import { VALUE, entryForm } from "@/features/day/entry-form";
import { addContext } from "../kinds";
import { saveEntry } from "./actions";

export default async function EntryPage({
  params,
  searchParams,
}: {
  params: Promise<{ kind: string }>;
  /** From a habit on Oggi: the activity's category and the habit's time. */
  searchParams: Promise<{
    giorno?: string | string[];
    categoria?: string | string[];
    ora?: string | string[];
    /** From ⊕'s switch: planned, or done earlier (the time to say). */
    stato?: string | string[];
  }>;
}) {
  const owner = await requireOwner();
  const { kind: key } = await params;
  const asked = await searchParams;
  const { kinds, clock, day, today } = await addContext(
    await getDb(),
    owner,
    asked.giorno,
  );
  const kind = kinds.find((k) => k.key === key);
  if (!kind) notFound();
  const form = entryForm(kind);
  const now = F.time(localParts(new Date(), clock.timeZone).minute);
  const at =
    typeof asked.ora === "string" && /^\d{2}:\d{2}$/.test(asked.ora) ? asked.ora : null;
  const category = kind.fields
    .find((f) => f.key === "category")
    ?.choices?.find((c) => c === asked.categoria);
  const when = asked.stato === "previsto" || asked.stato === "prima" ? asked.stato : null;
  const initial: Record<string, string> = {
    status:
      when === "previsto" ||
      (when === null && (day > today || (at !== null && day === today && at > now)))
        ? "planned"
        : "done",
    ...(at !== null
      ? { start: at }
      : day === today && when === null
        ? { [form.times.end ? "end" : "start"]: now }
        : {}),
    ...(category ? { [VALUE + "category"]: category } : {}),
  };
  return (
    <EntrySheet
      form={form}
      day={day}
      dayLabel={day === today ? "oggi" : F.Day(day)}
      initial={initial}
      closeHref={`/aggiungi?giorno=${day}`}
      action={saveEntry}
      boundaryMin={clock.boundaryMin}
      nowMin={day === today ? dayMinute(new Date(), day, clock) : null}
    />
  );
}
