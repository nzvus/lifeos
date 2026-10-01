/**
 * ui/ListItem.tsx — THE row of every list of foods: ingredients, meals and
 * the day's entries (rule of three, ADR-0002; a future theme slot, ADR-0010).
 *
 *   [leading] Title ………………… aside [action]
 *   children (usually ui/MacroStrip: kcal first, then macros)
 *   footer (small, muted: per 100 g · density · uses…)
 *
 * The title takes all the width it can and may wrap; `aside` never wraps
 * (a price or a cost must stay on one line); `action` should be compact
 * (an icon button, or the row's "⋯" menu), so the name is not squeezed.
 *
 * With `href` the whole row opens the record (ADR-0015 "tap opens"): the
 * title is the link and its ::after covers the row (the "stretched link"
 * pattern: one real link for screen readers, no nested interactive
 * elements). Layers: the link's cover (z-1) is above the row's content
 * (the macro strip's translucent segments would otherwise catch the tap),
 * `action` above the cover (z-2), and a row whose "⋯" is open above the
 * rows after it (z-30), so its menu is not hidden under the next row.
 */
import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  title: ReactNode;
  /** Where tapping the row goes. */
  href?: string;
  leading?: ReactNode;
  aside?: ReactNode;
  action?: ReactNode;
  footer?: ReactNode;
  /** Planned log entries (ADR-0009): translucent, dashed left edge. */
  muted?: boolean;
  children?: ReactNode;
};

export function ListItem({
  title,
  href,
  leading,
  aside,
  action,
  footer,
  muted,
  children,
}: Props) {
  return (
    <li
      className={`item relative flex flex-col gap-1 py-2 has-aria-expanded:z-30 ${href ? "hover:bg-paper" : ""} ${
        muted ? "rule-l-strong border-l-hairline border-dashed pl-2 opacity-60" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        {leading}
        <div className="min-w-0 flex-1 pt-1 font-semibold">
          {href ? (
            <Link
              href={href}
              className="underline-offset-4 after:absolute after:inset-0 after:z-1 hover:underline focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-focus"
            >
              {title}
            </Link>
          ) : (
            title
          )}
        </div>
        {aside && (
          <div className="shrink-0 pt-1 font-display text-meta whitespace-nowrap text-muted tabular-nums">
            {aside}
          </div>
        )}
        {action && <div className="relative z-2 shrink-0">{action}</div>}
      </div>
      {children}
      {footer && <div className="text-meta text-muted tabular-nums">{footer}</div>}
    </li>
  );
}
