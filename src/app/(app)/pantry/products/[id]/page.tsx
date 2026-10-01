/**
 * app/(app)/pantry/products/[id]/page.tsx — URL /pantry/products/<id>: edit a
 * product, its purchases (price history, newest first) and a form to record
 * a new one. "⋯" in the header moves the product to the trash.
 */
import { ShoppingBag } from "lucide-react";
import { notFound } from "next/navigation";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { listIngredients } from "@/core/nutrition/repositories/ingredients";
import { getProduct, listPurchases } from "@/core/pantry/repositories/products";
import { todayIn } from "@/core/shared/dates";
import { formatCents, formatNumber } from "@/core/shared/format";
import { safeFrom } from "@/core/shared/navigation";
import { ProductForm } from "@/features/nutrition/pantry/ProductForm";
import { PurchaseForm } from "@/features/nutrition/pantry/QuickForms";
import { ListItem } from "@/ui/ListItem";
import { PageHeader } from "@/ui/PageHeader";
import { Section } from "@/ui/Section";
import { TrashMenu } from "@/ui/TrashMenu";
import {
  addPurchaseAction,
  deleteProductAction,
  deletePurchaseAction,
  restoreProductAction,
  restorePurchaseAction,
  updateProductAction,
} from "../../actions";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
};

const INTL = { it: "it-IT", en: "en-GB" } as const;

export default async function ProductPage({ params, searchParams }: Props) {
  const { owner, settings, t } = await requireContext();
  const { id } = await params;
  const from = safeFrom((await searchParams).from, "/pantry");
  const db = getDb();
  const [product, purchases, ingredients] = await Promise.all([
    getProduct(db, owner, id),
    listPurchases(db, owner, id),
    listIngredients(db, owner),
  ]);
  if (!product) notFound();
  const p = t.pantry;
  const locale = settings.locale;
  const date = new Intl.DateTimeFormat(INTL[locale], {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-8">
      <PageHeader
        title={p.editProduct}
        back={{ href: from, label: from === "/pantry" ? p.back : t.actions.back }}
        menu={
          <TrashMenu
            id={id}
            from={from}
            name={product.name}
            trash={deleteProductAction}
            restore={restoreProductAction}
            labels={t.actions}
          />
        }
      />
      <ProductForm
        id={id}
        from={from}
        action={updateProductAction.bind(null, id)}
        initial={{
          name: product.name,
          brand: product.brand,
          unit: product.unit,
          packageSize: String(Number(product.packageSize)),
          ingredientId: product.ingredientId ?? "",
          shop: product.shop,
          notes: product.notes,
        }}
        ingredients={ingredients.map(({ id: iid, name, unit }) => ({
          id: iid,
          name,
          unit,
        }))}
        t={{ pantry: p, errors: t.errors, actions: t.actions }}
      />
      <Section title={p.purchases} icon={<ShoppingBag size={20} aria-hidden="true" />}>
        <PurchaseForm
          action={addPurchaseAction.bind(null, id)}
          today={todayIn(settings.timezone)}
          t={{ pantry: p, errors: t.errors }}
        />
        {purchases.length === 0 ? (
          <p className="text-muted">{p.purchasesEmpty}</p>
        ) : (
          <ul className="flex flex-col">
            {purchases.map((x) => (
              <ListItem
                key={x.id}
                title={date.format(new Date(`${x.day}T12:00:00Z`))}
                aside={
                  x.priceCents === null
                    ? p.unknownPrice
                    : formatCents(x.priceCents, locale)
                }
                footer={[
                  `${formatNumber(x.packages, locale, 2)} × ${formatNumber(product.packageSize, locale, 0)} ${p.unitShort[product.unit]}`,
                  x.shop,
                ]
                  .filter(Boolean)
                  .join(" · ")}
                action={
                  <TrashMenu
                    id={x.id}
                    name={product.name}
                    trash={deletePurchaseAction}
                    restore={restorePurchaseAction}
                    labels={t.actions}
                  />
                }
              />
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
