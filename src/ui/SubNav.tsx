/**
 * ui/SubNav.tsx — the sections inside one tab, as segments of links
 * (design review S2/S5, 2026-10-02): Food = Meals | Ingredients | Pantry,
 * Progress = Trends | Weight | Coming days. A convention of well-made apps
 * (Cronometer's Foods, MacroFactor's Strategy): one tab, a few views.
 * Links, not buttons: every view has its URL. The page says which is
 * current (works in server components).
 */
import Link from "next/link";
import type { ReactNode } from "react";

export function SubNav({
  label,
  current,
  items,
}: {
  label: string;
  /** The `key` of the current item. */
  current: string;
  items: { key: string; href: string; label: string; icon?: ReactNode }[];
}) {
  return (
    <nav aria-label={label} className="tile flex gap-1 rounded-control p-1">
      {items.map((it) => {
        const on = it.key === current;
        return (
          <Link
            key={it.key}
            href={it.href}
            aria-current={on ? "page" : undefined}
            className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-control px-2 py-2 font-display text-item font-semibold ${
              on ? "bg-sheet text-herb shadow-sm" : "text-muted hover:text-ink"
            }`}
          >
            {it.icon}
            <span className="truncate">{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
