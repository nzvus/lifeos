"use client";
/**
 * Swipe — a sideways swipe on what it wraps goes to the page before or after
 * (ledger UI-76: no ‹ › arrows; the developer, 30 Oct: «le frecce di
 * navigazione rompono tutto»). Links, not state: it only changes the page.
 */
import { useRef, type ReactNode } from "react";

export function Swipe({
  prev,
  next,
  label,
  children,
}: {
  prev: string | null;
  next: string | null;
  label: string;
  children: ReactNode;
}) {
  const x0 = useRef<number | null>(null);
  return (
    <div
      className="k-swipe"
      aria-label={label}
      onPointerDown={(e) => {
        x0.current = e.clientX;
      }}
      onPointerUp={(e) => {
        const dx = x0.current === null ? 0 : e.clientX - x0.current;
        x0.current = null;
        const to = Math.abs(dx) > 48 ? (dx < 0 ? next : prev) : null;
        if (to) window.location.href = to;
      }}
    >
      {children}
    </div>
  );
}
