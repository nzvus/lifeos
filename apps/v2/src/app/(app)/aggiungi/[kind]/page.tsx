/**
 * The entry sheet of one kind (V-03) for a day: `/aggiungi/water?giorno=…`.
 * The server finds the kind among those ⊕ offers and generates its form;
 * the client sheet posts it to `saveEntry`.
 */
import { notFound } from "next/navigation";
import { F } from "@lifeos/kit";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { localParts } from "@/core/engines/time";
import { EntrySheet } from "@/features/day/EntrySheet";
import { entryForm } from "@/features/day/entry-form";
import { addContext } from "../kinds";
import { saveEntry } from "./actions";

export default async function EntryPage({
  params,
  searchParams,
}: {
  params: Promise<{ kind: string }>;
  searchParams: Promise<{ giorno?: string | string[] }>;
}) {
  const owner = await requireOwner();
  const { kind: key } = await params;
  const { kinds, clock, day, today } = await addContext(
    await getDb(),
    owner,
    (await searchParams).giorno,
  );
  const kind = kinds.find((k) => k.key === key);
  if (!kind) notFound();
  const form = entryForm(kind);
  const now = F.time(localParts(new Date(), clock.timeZone).minute);
  const initial: Record<string, string> = {
    status: day > today ? "planned" : "done",
    ...(day === today ? { [form.times.end ? "end" : "start"]: now } : {}),
  };
  return (
    <EntrySheet
      form={form}
      day={day}
      dayLabel={day === today ? "oggi" : F.Day(day)}
      initial={initial}
      closeHref={`/aggiungi?giorno=${day}`}
      action={saveEntry}
    />
  );
}
