/**
 * ui/Badge.tsx — THE small label next to a name: a status (Done / Planned),
 * a kind of value (estimate, auto), a count. One shape everywhere (S20), so
 * the eye learns it once; the tone says what it means.
 */
import type { ReactNode } from "react";

const TONE = {
  neutral: "border-hairline text-muted",
  done: "border-herb text-herb",
  planned: "border-dashed border-muted text-muted",
  warn: "border-warn text-warn",
} as const;

export function Badge({
  tone = "neutral",
  title,
  children,
}: {
  tone?: keyof typeof TONE;
  /** Tooltip: what the badge means, when it is not obvious. */
  title?: string;
  children: ReactNode;
}) {
  return (
    <span
      title={title}
      className={`inline-flex shrink-0 items-center rounded-badge border px-1.5 py-0.5 font-display text-meta leading-none font-medium whitespace-nowrap ${TONE[tone]}`}
    >
      {children}
    </span>
  );
}
