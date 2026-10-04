/**
 * app/(app)/money/[id]/page.tsx — URL /money/<id>[?from=…]: one movement,
 * changeable (ADR-0036); saving goes back where it came from; the bin moves
 * it to the trash with Undo.
 */
import { notFound } from "next/navigation";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { ensureCategories, getMovement } from "@/core/money/repositories/money";
import { safeFrom } from "@/core/shared/navigation";
import { MovementDelete } from "@/features/money/MovementDelete";
import { MovementForm } from "@/features/money/MovementForm";
import { PageHeader } from "@/ui/PageHeader";
import {
  deleteMovementAction,
  restoreMovementAction,
  updateMovementAction,
} from "../actions";
import { categoryOptions } from "../data";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
};

export default async function MovementPage({ params, searchParams }: Props) {
  const { owner, settings, t } = await requireContext();
  const { id } = await params;
  const db = getDb();
  const [movement, categories] = await Promise.all([
    getMovement(db, owner, id),
    ensureCategories(db, owner, settings.locale),
  ]);
  if (!movement) notFound();
  const back = safeFrom((await searchParams).from, "/money");
  const cents = Math.abs(movement.amountCents);
  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6">
      <PageHeader
        title={t.money.edit}
        back={{ href: back, label: t.money.back }}
        menu={
          <MovementDelete
            id={movement.id}
            back={back}
            trash={deleteMovementAction}
            restore={restoreMovementAction}
            t={t}
          />
        }
      />
      <MovementForm
        action={updateMovementAction.bind(null, movement.id, back)}
        categories={categoryOptions(categories)}
        initial={{
          kind: movement.amountCents < 0 ? "expense" : "income",
          amount: `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`,
          day: movement.day,
          categoryId: movement.categoryId ?? "",
          description: movement.description,
          shop: movement.shop,
          method: movement.method ?? "",
          tags: movement.tags.join(", "),
        }}
        submitLabel={t.actions.save}
        t={t}
      />
    </div>
  );
}
