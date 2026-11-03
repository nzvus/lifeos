/** «Nuova assunzione» (FOOD-44): `/aggiungi/assunzione/nuova`. */
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { IntakeForm } from "@/features/food/IntakeForm";
import { addContext } from "../../kinds";
import { newIntake } from "../actions";

export default async function NewIntakePage({
  searchParams,
}: {
  searchParams: Promise<{ giorno?: string | string[] }>;
}) {
  const { day } = await addContext(
    await getDb(),
    await requireOwner(),
    (await searchParams).giorno,
  );
  const back = "/aggiungi/assunzione?giorno=" + day;
  return <IntakeForm backHref={back} action={newIntake.bind(null, back)} />;
}
