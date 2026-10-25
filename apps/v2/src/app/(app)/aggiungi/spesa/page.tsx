/**
 * «Spesa» (V-11): ⊕ → Spesa, for the day it came from (`?giorno=`); the
 * categories as the person has them (v1's, in Italian), grouped under their
 * parent, the incomes apart.
 */
import { F } from "@lifeos/kit";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { localParts } from "@/core/engines/time";
import { readCategories } from "@/core/money";
import { MovementForm } from "@/features/money/MovementForm";
import { categoryName } from "@/features/money/words";
import { addContext } from "../kinds";
import { saveMovement } from "./actions";

export default async function MovementPage({
  searchParams,
}: {
  searchParams: Promise<{ giorno?: string | string[] }>;
}) {
  const owner = await requireOwner();
  const db = await getDb();
  const { day, today, clock } = await addContext(db, owner, (await searchParams).giorno);
  const cats = await readCategories(db, owner);
  const byId = new Map(cats.map((c) => [c.id, c]));
  const options = cats
    .map((c) => {
      const top = c.parentId ? byId.get(c.parentId) : c;
      return {
        id: c.id,
        name: categoryName(c.name),
        group: c.kind === "income" ? "Entrate" : categoryName(top?.name ?? c.name),
        kind: c.kind,
      };
    })
    .sort(
      (a, b) =>
        a.group.localeCompare(b.group, "it") || a.name.localeCompare(b.name, "it"),
    );
  return (
    <MovementForm
      categories={options}
      initial={{
        day,
        direction: "out",
        method: "card",
        ...(day === today
          ? { start: F.time(localParts(new Date(), clock.timeZone).minute) }
          : {}),
      }}
      backHref={"/aggiungi?giorno=" + day}
      action={saveMovement}
    />
  );
}
