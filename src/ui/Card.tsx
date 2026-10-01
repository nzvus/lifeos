/**
 * ui/Card.tsx — the page's one surface: a panel with the same padding on
 * every side (design/theme.css `panel`). ui/Section is a Card with a
 * heading; use Card alone for a group that needs no title (the day header).
 */
import type { ReactNode } from "react";

export const CARD = "@container panel flex min-w-0 flex-col gap-4 p-4";

export function Card({
  children,
  as: Tag = "div",
  label,
}: {
  children: ReactNode;
  as?: "div" | "section";
  /** Accessible name when `as="section"`. */
  label?: string;
}) {
  return (
    <Tag aria-label={label} className={CARD}>
      {children}
    </Tag>
  );
}
