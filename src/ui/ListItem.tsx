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
 * (an icon button), so the name is not squeezed. Presentation only.
 */
import type { ReactNode } from "react";

type Props = {
  title: ReactNode;
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
  leading,
  aside,
  action,
  footer,
  muted,
  children,
}: Props) {
  return (
    <li
      className={`flex flex-col gap-1 border-b border-hairline py-3 ${
        muted ? "rule-l-strong border-l-hairline border-dashed pl-2 opacity-60" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        {leading}
        <div className="min-w-0 flex-1 pt-1 font-semibold">{title}</div>
        {aside && (
          <div className="shrink-0 pt-1 font-display text-sm whitespace-nowrap text-muted tabular-nums">
            {aside}
          </div>
        )}
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
      {footer && <div className="text-xs text-muted tabular-nums">{footer}</div>}
    </li>
  );
}
