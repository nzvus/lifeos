/**
 * app/(app)/money/receipts/new/page.tsx — URL /money/receipts/new: a
 * receipt from its text or a photo, reviewed line by line, then saved as
 * one movement with its lines (ADR-0036).
 */
import { env } from "@/app/_server/env";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { ensureCategories } from "@/core/money/repositories/money";
import { receiptAliasMap } from "@/core/money/repositories/receipts";
import { listProducts } from "@/core/pantry/repositories/products";
import { todayIn } from "@/core/shared/dates";
import { ReceiptEditor } from "@/features/money/ReceiptEditor";
import { PageHeader } from "@/ui/PageHeader";
import { readReceiptAction, saveReceiptAction } from "../../actions";
import { categoryOptions } from "../../data";

export default async function NewReceiptPage() {
  const { owner, settings, t } = await requireContext();
  const db = getDb();
  const [categories, products, aliases] = await Promise.all([
    ensureCategories(db, owner, settings.locale),
    listProducts(db, owner),
    receiptAliasMap(db, owner),
  ]);
  // A receipt is groceries unless said otherwise: its supermarket child, else it.
  const groceries = categories.find((c) => c.key === "groceries");
  const supermarket = categories.find((c) => c.parentId === groceries?.id);
  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6">
      <PageHeader
        title={t.money.newReceipt}
        back={{ href: "/money/receipts", label: t.money.back }}
      />
      <ReceiptEditor
        save={saveReceiptAction}
        read={env().ASSISTANT_ENABLED === "true" ? readReceiptAction : undefined}
        categories={categoryOptions(categories)}
        products={products.map((p) => ({ id: p.id, name: p.name }))}
        aliases={aliases}
        defaultCategoryId={supermarket?.id ?? groceries?.id ?? ""}
        today={todayIn(settings.timezone)}
        locale={settings.locale}
        t={t}
      />
    </div>
  );
}
