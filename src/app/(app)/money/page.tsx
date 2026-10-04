/**
 * app/(app)/money/page.tsx — URL /money[?month=YYYY-MM], the Money tab's
 * overview (ADR-0036), as a banking app shows a month: what was spent and
 * earned, the pace against last month, where the money went (categories,
 * shops), food spent vs food eaten, and the latest movements. The numbers
 * are core/money/summary.ts; this page loads and composes.
 */
import {
  ChevronLeft,
  ChevronRight,
  Store,
  Tags,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { ensureCategories, listMovements } from "@/core/money/repositories/money";
import { monthSummary } from "@/core/money/summary";
import { getHistory } from "@/core/nutrition/repositories/history";
import { todayIn } from "@/core/shared/dates";
import { formatCents } from "@/core/shared/format";
import { shiftMonth } from "@/core/training/calendar";
import { CategoryBars } from "@/features/money/CategoryBars";
import { MoneyNav } from "@/features/money/MoneyNav";
import { MovementList } from "@/features/money/MovementList";
import { MovementSheet } from "@/features/money/MovementSheet";
import { PaceChart } from "@/features/money/PaceChart";
import { fill } from "@/i18n";
import { buttonClass, TEXT_LINK } from "@/ui/button";
import { PageHeader } from "@/ui/PageHeader";
import { Section } from "@/ui/Section";
import { StatTiles } from "@/ui/StatTiles";
import { addMovementAction } from "./actions";
import { categoryOptions, INTL, monthOf, movementRows } from "./data";

type Props = { searchParams: Promise<{ month?: string }> };

export default async function MoneyPage({ searchParams }: Props) {
  const { owner, settings, t } = await requireContext();
  const m = t.money;
  const locale = settings.locale;
  const db = getDb();
  const today = todayIn(settings.timezone);
  const { month, from, last } = monthOf((await searchParams).month, today);
  const prev = monthOf(shiftMonth(month, -1), today);
  const [categories, movements, lastMonth, food] = await Promise.all([
    ensureCategories(db, owner, locale),
    listMovements(db, owner, from, last),
    listMovements(db, owner, prev.from, prev.last),
    getHistory(db, owner, from, last < today ? last : today),
  ]);
  const s = monthSummary({
    month,
    today,
    movements,
    lastMonth,
    categories,
    none: m.noCategory,
  });
  const euros = (c: number) => formatCents(c, locale);
  const intl = INTL[locale];
  const monthName = (mm: string) =>
    new Intl.DateTimeFormat(intl, { month: "long", timeZone: "UTC" }).format(
      new Date(`${mm}-01T12:00:00Z`),
    );
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
  // Spent by the same day: +12 % / −5 % against last month.
  const pace =
    s.lastMonthSameDayCents === null || s.lastMonthSameDayCents === 0
      ? m.vsLastNone
      : fill(m.vsLast, {
          v: `${s.spentCents >= s.lastMonthSameDayCents ? "+" : "−"}${Math.abs(
            Math.round((s.spentCents / s.lastMonthSameDayCents - 1) * 100),
          )}%`,
        });
  const eatenCents = food.reduce((a, d) => a + d.totals.costCents, 0);
  const movesHref = (q: string) => `/money/movements?month=${month}${q}`;
  const arrow = buttonClass({ variant: "quiet", iconOnly: true });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={m.title} quiet />
      <MoneyNav current="overview" month={month} t={m} />
      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/money?month=${shiftMonth(month, -1)}`}
          aria-label={m.prevMonth}
          className={arrow}
        >
          <ChevronLeft size={24} aria-hidden="true" />
        </Link>
        <h2 className="font-heading text-section font-bold first-letter:uppercase">
          {title}
        </h2>
        <Link
          href={`/money?month=${shiftMonth(month, 1)}`}
          aria-label={m.nextMonth}
          className={arrow}
        >
          <ChevronRight size={24} aria-hidden="true" />
        </Link>
      </div>
      <StatTiles
        stats={[
          { label: m.spent, value: euros(s.spentCents), note: pace },
          { label: m.earned, value: euros(s.incomeCents) },
          { label: m.balance, value: euros(s.balanceCents) },
          {
            label: m.perDay,
            value: s.days ? euros(Math.round(s.spentCents / s.days)) : "—",
            note:
              s.projectedCents === null
                ? undefined
                : fill(m.projected, { v: euros(s.projectedCents) }),
          },
        ]}
      />
      {movements.length === 0 ? (
        <p className="text-muted">{m.nothing}</p>
      ) : (
        <>
          <Section title={m.pace} icon={<Wallet size={20} aria-hidden="true" />}>
            <PaceChart
              cumulative={s.cumulative}
              lastCumulative={lastMonth.length ? s.lastCumulative : []}
              daysInMonth={s.daysInMonth}
              monthLabel={monthName(month)}
              lastLabel={monthName(prev.month)}
              locale={locale}
              t={m}
            />
          </Section>
          <Section title={m.byCategory} icon={<Tags size={20} aria-hidden="true" />}>
            <CategoryBars
              rows={s.expenses}
              hrefOf={(id) => movesHref(`&cat=${id ?? "none"}`)}
              locale={locale}
              empty={m.nothing}
            />
            {s.income.length > 0 && (
              <>
                <h3 className="pt-2 font-display text-item font-semibold">
                  {m.incomeByCategory}
                </h3>
                <CategoryBars
                  rows={s.income}
                  hrefOf={(id) => movesHref(`&cat=${id ?? "none"}`)}
                  locale={locale}
                  empty={m.nothing}
                />
              </>
            )}
          </Section>
          {s.shops.length > 0 && (
            <Section title={m.shops} icon={<Store size={20} aria-hidden="true" />}>
              <ul className="flex flex-col">
                {s.shops.map((x) => (
                  <li
                    key={x.shop}
                    className="flex items-baseline justify-between gap-2 rule-b-medium border-hairline py-2"
                  >
                    <span className="truncate font-semibold">{x.shop}</span>
                    <span className="text-meta text-muted tabular-nums">
                      {fill(m.shopCount, { n: String(x.count) })}
                    </span>
                    <span className="font-display tabular-nums">{euros(x.cents)}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}
          <Section title={m.recent} icon={<Wallet size={20} aria-hidden="true" />}>
            <MovementList
              rows={movementRows(movements.slice(0, 6), categories, m)}
              dayLabel={dayLabel}
              hrefOf={(id) =>
                `/money/${id}?from=${encodeURIComponent(`/money?month=${month}`)}`
              }
              locale={locale}
              empty={m.nothing}
            />
            <Link href={movesHref("")} className={`self-start text-meta ${TEXT_LINK}`}>
              {m.all}
            </Link>
          </Section>
        </>
      )}
      {/* Food bought vs food eaten (ADR-0036): never added together. */}
      <Section title={m.food} icon={<UtensilsCrossed size={20} aria-hidden="true" />}>
        <StatTiles
          stats={[
            {
              label: m.foodSpent,
              value: euros(s.food.groceriesCents + s.food.eatingOutCents),
            },
            { label: m.foodEaten, value: euros(eatenCents) },
          ]}
        />
        <p className="text-meta text-muted">{m.foodHint}</p>
      </Section>
      <MovementSheet
        action={addMovementAction}
        categories={categoryOptions(categories)}
        today={today}
        t={t}
      />
    </div>
  );
}
