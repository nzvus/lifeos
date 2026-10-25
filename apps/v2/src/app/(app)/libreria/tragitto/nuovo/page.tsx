/** «Nuovo tragitto» (movement slice 1): `?torna=` back to ⊕ → Tragitto when it came from there. */
import { requireOwner } from "@/app/_server/owner";
import { RouteForm } from "@/features/library/RouteForm";
import { saveRoute } from "./actions";

export default async function NewRoutePage({
  searchParams,
}: {
  searchParams: Promise<{ torna?: string | string[] }>;
}) {
  await requireOwner();
  const { torna } = await searchParams;
  const back = typeof torna === "string" ? torna : null;
  return (
    <RouteForm
      backHref={back ?? "/libreria/tragitto"}
      action={saveRoute.bind(null, back)}
    />
  );
}
