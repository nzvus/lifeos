/**
 * features/money/CategoryBars.tsx — where the month's money went (or came
 * from), by top-level category, largest first: icon, name, euros, share,
 * and a thin bar of that share; the children named underneath. One colour
 * (ink): the bars show magnitude, the names say which (colour = state).
 * Each row opens the movements of that category.
 */
import Link from "next/link";
import type { CategoryTotal } from "@/core/money/summary";
import { formatCents } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { MoneyIcon } from "./MoneyIcon";

export function CategoryBars({
  rows,
  hrefOf,
  locale,
  empty,
}: {
  rows: CategoryTotal[];
  /** The movements of a category (null = without one). */
  hrefOf: (id: string | null) => string;
  locale: Locale;
  empty: string;
}) {
  if (rows.length === 0) return <p className="text-meta text-muted">{empty}</p>;
  return (
    <ul className="flex flex-col gap-1">
      {rows.map((r) => (
        <li key={r.id ?? "none"}>
          <Link
            href={hrefOf(r.id)}
            className="flex flex-col gap-1 rounded-control px-1 py-2 hover:bg-paper"
          >
            <span className="flex items-center gap-2">
              <span className="text-muted">
                <MoneyIcon icon={r.icon} />
              </span>
              <span className="min-w-0 flex-1 truncate font-semibold">{r.name}</span>
              <span className="font-display tabular-nums">
                {formatCents(r.cents, locale)}
              </span>
              <span className="w-10 text-right text-meta text-muted tabular-nums">
                {`${Math.round(r.share * 100)}%`}
              </span>
            </span>
            <span className="block h-1.5 w-full overflow-hidden rounded-full bg-paper">
              <span
                className="block h-full rounded-full bg-ink"
                style={{ width: `${Math.max(2, r.share * 100)}%` }}
              />
            </span>
            {r.children.length > 0 && (
              <span className="truncate text-meta text-muted">
                {r.children
                  .slice(0, 3)
                  .map((c) => `${c.name} ${formatCents(c.cents, locale)}`)
                  .join(" · ")}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
