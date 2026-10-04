/**
 * app/(app)/money/data.ts — what every Money page loads and shapes the same
 * way (ADR-0036): the asked month, the categories (the starter set on first
 * use) as form options and as labels, and a movement as a list row.
 */
import type { Category, Movement } from "@/core/money/repositories/money";
import { isMonth, shiftMonth } from "@/core/training/calendar";
import type { Messages } from "@/i18n";
import type { CategoryOption } from "@/features/money/MovementForm";
import type { MovementRow } from "@/features/money/MovementList";

export const INTL = { it: "it-IT", en: "en-GB" } as const;

/** The asked month, else today's; and the days it spans. */
export function monthOf(asked: string | undefined, today: string) {
  const month = asked && isMonth(asked) ? asked : today.slice(0, 7);
  const from = `${month}-01`;
  const to = `${shiftMonth(month, 1)}-01`;
  return { month, from, last: lastDay(to) };
}

const lastDay = (nextFirst: string) => {
  const d = new Date(`${nextFirst}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
};

/** "Casa · Luce" for a child, "Casa" for a parent. */
export function categoryLabels(categories: readonly Category[]) {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const label = (c: Category) => {
    const parent = c.parentId ? byId.get(c.parentId) : undefined;
    return parent ? `${parent.name} · ${c.name}` : c.name;
  };
  const icon = (c: Category | undefined) =>
    c ? c.icon || (c.parentId ? (byId.get(c.parentId)?.icon ?? "") : "") : "";
  return { byId, label, icon };
}

export function categoryOptions(categories: readonly Category[]): CategoryOption[] {
  const { label } = categoryLabels(categories);
  return categories.map((c) => ({ id: c.id, label: label(c), kind: c.kind }));
}

export function movementRows(
  movements: readonly Movement[],
  categories: readonly Category[],
  m: Messages["money"],
): MovementRow[] {
  const { byId, label, icon } = categoryLabels(categories);
  return movements.map((x) => {
    const c = x.categoryId ? byId.get(x.categoryId) : undefined;
    const cat = c ? label(c) : m.noCategory;
    return {
      id: x.id,
      day: x.day,
      amountCents: x.amountCents,
      title: x.description || x.shop || cat,
      detail: [
        cat,
        x.description && x.shop ? x.shop : "",
        x.method ? m.methods[x.method] : "",
        ...x.tags.map((tag) => `#${tag}`),
      ]
        .filter(Boolean)
        .join(" · "),
      icon: icon(c),
    };
  });
}
