/**
 * app/(app)/money/[id]/page.tsx — URL /money/<id>[?from=…]: one movement,
 * changeable (ADR-0036); saving goes back where it came from; the bin moves
 * it to the trash with Undo.
 */
import { notFound } from "next/navigation";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { ensureCategories, getMovement } from "@/core/money/repositories/money";
import { movementLines } from "@/core/money/repositories/receipts";
import { formatCents } from "@/core/shared/format";
import { Badge } from "@/ui/Badge";
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
  const [movement, categories, lines] = await Promise.all([
    getMovement(db, owner, id),
    ensureCategories(db, owner, settings.locale),
    movementLines(db, owner, id),
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
      {lines.length > 0 && (
        <section className="flex flex-col gap-1" aria-label={t.money.receiptLines}>
          <h2 className="font-display text-item font-semibold">{t.money.receiptLines}</h2>
          <ul className="flex flex-col">
            {lines.map((l, i) => (
              <li
                key={i}
                className="flex items-baseline justify-between gap-2 rule-b-medium border-hairline py-2"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate">{l.description}</span>
                  {l.productName && (
                    <span className="text-meta text-muted">
                      {l.productName} {l.inPantry && <Badge>{t.money.inPantry}</Badge>}
                    </span>
                  )}
                </span>
                <span className="font-display tabular-nums">
                  {formatCents(l.amountCents, settings.locale)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
