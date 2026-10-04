/**
 * features/money/MovementList.tsx — movements grouped by day, newest
 * first, as a banking app lists them: the day and its total, then each
 * movement with its category icon, what it was, where and how, and the
 * amount (income in green with "+", spending in ink). A row opens it.
 */
import Link from "next/link";
import { formatCents } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { MoneyIcon } from "./MoneyIcon";

export type MovementRow = {
  id: string;
  day: string;
  amountCents: number;
  title: string;
  /** "Casa · Luce · Enel · carta · #bollette". */
  detail: string;
  icon: string;
};

export function MovementList({
  rows,
  dayLabel,
  hrefOf,
  locale,
  empty,
}: {
  rows: MovementRow[];
  dayLabel: (day: string) => string;
  hrefOf: (id: string) => string;
  locale: Locale;
  empty: string;
}) {
  if (rows.length === 0) return <p className="text-meta text-muted">{empty}</p>;
  const days = [...new Set(rows.map((r) => r.day))];
  const money = (c: number) =>
    c > 0 ? `+${formatCents(c, locale)}` : formatCents(c, locale);
  return (
    <div className="flex flex-col gap-4">
      {days.map((day) => {
        const items = rows.filter((r) => r.day === day);
        const total = items.reduce((a, r) => a + r.amountCents, 0);
        return (
          <section key={day} aria-label={dayLabel(day)} className="flex flex-col">
            <h3 className="flex items-baseline justify-between rule-b-medium border-hairline pb-1 text-meta">
              <span className="font-semibold first-letter:uppercase">
                {dayLabel(day)}
              </span>
              <span className="text-muted tabular-nums">{money(total)}</span>
            </h3>
            <ul className="flex flex-col">
              {items.map((r) => (
                <li key={r.id}>
                  <Link
                    href={hrefOf(r.id)}
                    className="flex min-h-14 items-center gap-3 rounded-control px-1 py-2 hover:bg-paper"
                  >
                    <span className="tile flex size-9 shrink-0 items-center justify-center rounded-full text-muted">
                      <MoneyIcon icon={r.icon} />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-semibold">{r.title}</span>
                      {r.detail && (
                        <span className="truncate text-meta text-muted">{r.detail}</span>
                      )}
                    </span>
                    <span
                      className={`font-display font-semibold tabular-nums ${
                        r.amountCents > 0 ? "text-herb" : ""
                      }`}
                    >
                      {money(r.amountCents)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
