/**
 * app/(app)/money/movements/page.tsx — URL /money/movements[?month&q&cat],
 * every movement of a month grouped by day (ADR-0036), searchable (what,
 * where, tags; accents and case aside) and by category ("none" = without).
 */
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { ensureCategories, listMovements } from "@/core/money/repositories/money";
import { todayIn } from "@/core/shared/dates";
import { formatCents } from "@/core/shared/format";
import { normalize } from "@/core/shared/search";
import { shiftMonth } from "@/core/training/calendar";
import { MoneyNav } from "@/features/money/MoneyNav";
import { MovementList } from "@/features/money/MovementList";
import { MovementSheet } from "@/features/money/MovementSheet";
import { buttonClass } from "@/ui/button";
import { PageHeader } from "@/ui/PageHeader";
import { addMovementAction } from "../actions";
import { categoryLabels, categoryOptions, INTL, monthOf, movementRows } from "../data";

type Props = { searchParams: Promise<{ month?: string; q?: string; cat?: string }> };

export default async function MovementsPage({ searchParams }: Props) {
  const { owner, settings, t } = await requireContext();
  const m = t.money;
  const locale = settings.locale;
  const db = getDb();
  const today = todayIn(settings.timezone);
  const query = await searchParams;
  const { month, from, last } = monthOf(query.month, today);
  const [categories, all] = await Promise.all([
    ensureCategories(db, owner, locale),
    listMovements(db, owner, from, last),
  ]);
  const { byId } = categoryLabels(categories);
  const cat = query.cat ?? "";
  const q = normalize(query.q ?? "");
  const words = q.split(" ").filter(Boolean);
  const movements = all.filter((x) => {
    if (cat === "none" && x.categoryId) return false;
    if (cat && cat !== "none") {
      const c = x.categoryId ? byId.get(x.categoryId) : undefined;
      if (!c || (c.id !== cat && c.parentId !== cat)) return false;
    }
    const text = normalize([x.description, x.shop, ...x.tags].join(" "));
    return words.every((w) => text.includes(w));
  });
  const total = movements.reduce((a, x) => a + x.amountCents, 0);
  const intl = INTL[locale];
  const title = new Intl.DateTimeFormat(intl, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${month}-01T12:00:00Z`));
  const dayLabel = (d: string) =>
    new Intl.DateTimeFormat(intl, {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    }).format(new Date(`${d}T12:00:00Z`));
  const here = `/money/movements?month=${month}${cat ? `&cat=${cat}` : ""}${query.q ? `&q=${encodeURIComponent(query.q)}` : ""}`;
  const arrow = buttonClass({ variant: "quiet", iconOnly: true });
  const tops = categories.filter((c) => !c.parentId);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={m.title} quiet />
      <MoneyNav current="movements" month={month} t={m} />
      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/money/movements?month=${shiftMonth(month, -1)}`}
          aria-label={m.prevMonth}
          className={arrow}
        >
          <ChevronLeft size={24} aria-hidden="true" />
        </Link>
        <div className="flex flex-col items-center">
          <h2 className="font-heading text-section font-bold first-letter:uppercase">
            {title}
          </h2>
          <span className="text-meta text-muted tabular-nums">
            {formatCents(total, locale)}
          </span>
        </div>
        <Link
          href={`/money/movements?month=${shiftMonth(month, 1)}`}
          aria-label={m.nextMonth}
          className={arrow}
        >
          <ChevronRight size={24} aria-hidden="true" />
        </Link>
      </div>
      {/* A plain GET form: the filters are the URL. */}
      <form className="grid grid-cols-2 gap-2" action="/money/movements">
        <input type="hidden" name="month" value={month} />
        <input
          type="search"
          name="q"
          defaultValue={query.q ?? ""}
          placeholder={m.search}
          aria-label={m.search}
          className="rounded-control rule-b-medium border-ink bg-sheet px-2 py-2 text-body"
        />
        <select
          name="cat"
          defaultValue={cat}
          aria-label={m.category}
          className="rounded-control rule-b-medium border-ink bg-sheet px-2 py-2 text-body"
        >
          <option value="">{m.allCategories}</option>
          {tops.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          <option value="none">{m.noCategory}</option>
        </select>
        <button
          type="submit"
          className={`col-span-2 ${buttonClass({ variant: "secondary", size: "sm" })}`}
        >
          {m.search}
        </button>
      </form>
      <MovementList
        rows={movementRows(movements, categories, m)}
        dayLabel={dayLabel}
        hrefOf={(id) => `/money/${id}?from=${encodeURIComponent(here)}`}
        locale={locale}
        empty={m.nothing}
      />
      <MovementSheet
        action={addMovementAction}
        categories={categoryOptions(categories)}
        today={today}
        t={t}
      />
    </div>
  );
}
