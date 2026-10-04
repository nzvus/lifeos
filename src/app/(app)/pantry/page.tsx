/**
 * app/(app)/pantry/page.tsx — URL /pantry: what is at home (ADR-0013/0017).
 * Reminders (derived + by hand), the shopping list, the stock derived from
 * events with a count per item, batches with their portions, and products.
 */
import { Bell, CookingPot, Package, ShoppingCart, Tag } from "lucide-react";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { listBatches } from "@/core/nutrition/repositories/batches";
import { listMeals } from "@/core/nutrition/repositories/meals";
import { listProducts } from "@/core/pantry/repositories/products";
import { derivedReminders, listReminders } from "@/core/pantry/repositories/reminders";
import {
  getPantry,
  shoppingList,
  type PantryItem,
} from "@/core/pantry/repositories/stock";
import { formatNumber } from "@/core/shared/format";
import {
  CookForm,
  CountForm,
  ReminderForm,
} from "@/features/nutrition/pantry/QuickForms";
import { fill } from "@/i18n";
import { Badge } from "@/ui/Badge";
import { Disclosure } from "@/ui/Disclosure";
import { ListItem } from "@/ui/ListItem";
import { PageHeader } from "@/ui/PageHeader";
import { Sheet } from "@/ui/Sheet";
import { FoodNav } from "@/features/nutrition/nav/FoodNav";
import { Section } from "@/ui/Section";
import { TrashMenu } from "@/ui/TrashMenu";
import {
  addCountAction,
  completeReminderAction,
  cookBatchAction,
  createReminderAction,
  deleteBatchAction,
  deleteProductAction,
  deleteReminderAction,
  eatPortionAction,
  restoreBatchAction,
  restoreProductAction,
  restoreReminderAction,
} from "./actions";

const INTL = { it: "it-IT", en: "en-GB" } as const;

export default async function PantryPage() {
  const { owner, settings, t } = await requireContext();
  const db = getDb();
  const [pantry, batchList, manual, products, meals] = await Promise.all([
    getPantry(db, owner),
    listBatches(db, owner),
    listReminders(db, owner),
    listProducts(db, owner),
    listMeals(db, owner),
  ]);
  const p = t.pantry;
  const locale = settings.locale;
  const date = new Intl.DateTimeFormat(INTL[locale], {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  const dayText = (d: string) => date.format(new Date(`${d}T12:00:00Z`));
  const qty = (i: { quantity: string; unit: "g" | "ml" | "piece" }) =>
    `${formatNumber(i.quantity, locale, 0)} ${p.unitShort[i.unit]}`;
  const left = (i: PantryItem) =>
    i.daysLeft === null ? p.noUse : fill(p.daysLeft, { n: String(i.daysLeft) });
  const derived = derivedReminders(pantry, batchList);
  const shopping = shoppingList(pantry);
  const words = (d: (typeof derived)[number]) =>
    d.kind === "gone"
      ? fill(p.gone, { name: d.name })
      : d.kind === "runOut"
        ? d.daysLeft === 0
          ? fill(p.runOutToday, { name: d.name })
          : fill(p.runOut, { name: d.name, n: String(d.daysLeft) })
        : fill(p.lastPortion, { name: d.name });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t.nav.food} quiet />
      <FoodNav current="pantry" t={t} />
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-4">
          <Section title={p.reminders} icon={<Bell size={20} aria-hidden="true" />}>
            {derived.length === 0 && manual.length === 0 ? (
              <p className="text-muted">{p.remindersEmpty}</p>
            ) : (
              <ul className="flex flex-col">
                {derived.map((d) => (
                  <ListItem key={`${d.kind}-${d.id}`} title={words(d)} muted={false} />
                ))}
                {manual.map((r) => (
                  <ListItem
                    key={r.id}
                    title={r.text}
                    aside={
                      r.dueDay ? fill(p.due, { date: dayText(r.dueDay) }) : undefined
                    }
                    footer={
                      r.repeatDays
                        ? fill(p.every, { n: String(r.repeatDays) })
                        : undefined
                    }
                    action={
                      <TrashMenu
                        id={r.id}
                        name={r.text}
                        trash={deleteReminderAction}
                        restore={restoreReminderAction}
                        actions={[
                          {
                            label: p.done,
                            run: completeReminderAction,
                            done: fill(p.doneToast, { name: r.text }),
                          },
                        ]}
                        labels={t.actions}
                      />
                    }
                  />
                ))}
              </ul>
            )}
          </Section>
          <Section
            title={p.shopping}
            icon={<ShoppingCart size={20} aria-hidden="true" />}
          >
            {shopping.length === 0 ? (
              <p className="text-muted">{p.shoppingEmpty}</p>
            ) : (
              <ul className="flex flex-col">
                {shopping.map((i) => (
                  <ListItem
                    key={`${i.kind}-${i.id}`}
                    title={i.name}
                    aside={qty(i)}
                    footer={left(i)}
                  />
                ))}
              </ul>
            )}
          </Section>
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <Section title={p.stock} icon={<Package size={20} aria-hidden="true" />}>
            {pantry.length === 0 ? (
              <p className="text-muted">{p.stockEmpty}</p>
            ) : (
              <ul className="flex flex-col">
                {pantry.map((i) => (
                  <ListItem key={`${i.kind}-${i.id}`} title={i.name} aside={qty(i)}>
                    <p className="text-meta text-muted">{left(i)}</p>
                    <Disclosure summary={p.count}>
                      <CountForm
                        action={addCountAction.bind(null, {
                          ingredientId: i.kind === "ingredient" ? i.id : null,
                          productId: i.kind === "product" ? i.id : null,
                        })}
                        unit={p.unitShort[i.unit]}
                        t={{ pantry: p, errors: t.errors }}
                      />
                    </Disclosure>
                  </ListItem>
                ))}
              </ul>
            )}
          </Section>
          <Section title={p.batches} icon={<CookingPot size={20} aria-hidden="true" />}>
            {batchList.length === 0 ? (
              <p className="text-muted">{p.batchesEmpty}</p>
            ) : (
              <ul className="flex flex-col">
                {batchList.map((b) => (
                  <ListItem
                    key={b.id}
                    title={b.label}
                    aside={
                      <Badge tone={Number(b.portionsLeft) > 0 ? "done" : "neutral"}>
                        {fill(p.portionsLeft, {
                          n: formatNumber(b.portionsLeft, locale, 0),
                        })}
                      </Badge>
                    }
                    footer={dayText(b.day)}
                    action={
                      <TrashMenu
                        id={b.id}
                        name={b.label}
                        trash={deleteBatchAction}
                        restore={restoreBatchAction}
                        actions={[
                          {
                            label: p.eatPortion,
                            run: eatPortionAction,
                            done: fill(p.portionLogged, { name: b.label }),
                          },
                        ]}
                        labels={t.actions}
                      />
                    }
                  />
                ))}
              </ul>
            )}
          </Section>
          <Section title={p.products} icon={<Tag size={20} aria-hidden="true" />}>
            {products.length === 0 ? (
              <p className="text-muted">{p.productsEmpty}</p>
            ) : (
              <ul className="flex flex-col">
                {products.map((pr) => (
                  <ListItem
                    key={pr.id}
                    href={`/pantry/products/${pr.id}?from=/pantry`}
                    title={pr.name}
                    aside={`${formatNumber(pr.packageSize, locale, 0)} ${p.unitShort[pr.unit]}`}
                    footer={
                      [pr.brand, pr.ingredientName].filter(Boolean).join(" · ") ||
                      undefined
                    }
                    action={
                      <TrashMenu
                        id={pr.id}
                        name={pr.name}
                        trash={deleteProductAction}
                        restore={restoreProductAction}
                        labels={t.actions}
                      />
                    }
                  />
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>
      {/* Adding happens from the "+" (2026-10-02): a reminder, a batch. */}
      <Sheet
        id="new-reminder"
        title={p.reminderText}
        icon={<Bell size={20} aria-hidden="true" />}
        closeLabel={t.actions.close}
      >
        <ReminderForm action={createReminderAction} t={{ pantry: p, errors: t.errors }} />
      </Sheet>
      <Sheet
        id="new-batch"
        title={p.cookTitle}
        icon={<CookingPot size={20} aria-hidden="true" />}
        closeLabel={t.actions.close}
      >
        {meals.length > 0 ? (
          <CookForm
            action={cookBatchAction}
            meals={meals.map((m) => ({ id: m.id, name: m.name }))}
            t={{ pantry: p, errors: t.errors }}
          />
        ) : (
          <p className="text-muted">{t.meals.needIngredients}</p>
        )}
      </Sheet>
    </div>
  );
}
