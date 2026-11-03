"use client";
/**
 * Swipe — a sideways swipe on what it wraps goes to the page before or after
 * (ledger UI-76: no ‹ › arrows on the phone; the developer, 30 Oct: «le frecce
 * di navigazione rompono tutto»). Links, not state: it only changes the page.
 *
 * On a computer (ledger UI-98, his 3 Nov «da pc come si scorre tra le
 * settimane, mesi?») the same move has three more ways: two small arrows on
 * the sides, shown only where there is a mouse (`hover: hover` and `pointer:
 * fine`, kit.css `.k-side`), the keys ← → (`keys`, one per page) and a
 * sideways scroll of the touchpad.
 */
import { useEffect, useRef, type ReactNode } from "react";

const DRAG = 48;
const WHEEL = 120;

/** The pointer and wheel handlers of a strip that moves to `prev` / `next`. */
export function useSideMove(
  prev: string | null,
  next: string | null,
  keys = false,
  onGo?: () => void,
) {
  const x0 = useRef<number | null>(null);
  const wheel = useRef({ sum: 0, at: 0 });
  const go = (to: string | null) => {
    if (!to) return;
    onGo?.();
    window.location.href = to;
  };
  useEffect(() => {
    if (!keys) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)))
        return;
      if (e.key === "ArrowLeft" && prev) go(prev);
      if (e.key === "ArrowRight" && next) go(next);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [keys, prev, next]);
  return {
    onPointerDown: (e: { clientX: number }) => {
      x0.current = e.clientX;
    },
    onPointerUp: (e: { clientX: number }) => {
      const dx = x0.current === null ? 0 : e.clientX - x0.current;
      x0.current = null;
      if (Math.abs(dx) > DRAG) go(dx < 0 ? next : prev);
    },
    onWheel: (e: { deltaX: number; deltaY: number; timeStamp: number }) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      const w = wheel.current;
      if (e.timeStamp - w.at > 400) w.sum = 0;
      w.at = e.timeStamp;
      w.sum += e.deltaX;
      if (Math.abs(w.sum) > WHEEL) {
        const to = w.sum > 0 ? next : prev;
        w.sum = 0;
        go(to);
      }
    },
  };
}

/** The two arrows a mouse gets; hidden on a touch screen (kit.css `.k-side`). */
export function SideArrows({
  prev,
  next,
  prevLabel,
  nextLabel,
  onGo,
}: {
  prev: string | null;
  next: string | null;
  prevLabel: string;
  nextLabel: string;
  onGo?: () => void;
}) {
  return (
    <>
      {prev && (
        <a className="k-side prev" href={prev} aria-label={prevLabel} onClick={onGo}>
          ‹
        </a>
      )}
      {next && (
        <a className="k-side next" href={next} aria-label={nextLabel} onClick={onGo}>
          ›
        </a>
      )}
    </>
  );
}

export function Swipe({
  prev,
  next,
  label,
  keys = false,
  prevLabel = "Prima",
  nextLabel = "Dopo",
  onGo,
  children,
}: {
  prev: string | null;
  next: string | null;
  label: string;
  /** ← → move it too: only the page's main strip. */
  keys?: boolean;
  prevLabel?: string;
  nextLabel?: string;
  /** Before it goes (DateNav keeps its month open). */
  onGo?: () => void;
  children: ReactNode;
}) {
  const move = useSideMove(prev, next, keys, onGo);
  return (
    <div className="k-swipe" aria-label={label} {...move}>
      {children}
      <SideArrows
        prev={prev}
        next={next}
        prevLabel={prevLabel}
        nextLabel={nextLabel}
        {...(onGo ? { onGo } : {})}
      />
    </div>
  );
}
