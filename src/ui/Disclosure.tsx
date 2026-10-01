/**
 * ui/Disclosure.tsx — a small "▸ more" that opens in place: a native
 * <details> (no JavaScript), muted summary, content under it. Used for
 * secondary forms inside a card (count, add a reminder, cook in portions).
 * Sits above a row's tap cover (ui/ListItem), like FoodDetails.
 */
import type { ReactNode } from "react";

export function Disclosure({
  summary,
  children,
}: {
  summary: string;
  children: ReactNode;
}) {
  return (
    <details className="relative z-2 text-meta">
      <summary className="cursor-pointer text-muted">{summary}</summary>
      <div className="pt-3">{children}</div>
    </details>
  );
}
