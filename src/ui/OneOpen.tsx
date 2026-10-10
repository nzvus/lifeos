/**
 * ui/OneOpen.tsx — rows of which one at a time is open (ADR-0050: an entry
 * of the day is edited in place, and opening another closes the first).
 * The row's head is always shown with a toggle; its body only while open.
 * Server components pass the head and the body as children; the state of
 * which row is open lives here, in the browser.
 */
"use client";

import { ChevronDown } from "lucide-react";
import { createContext, useContext, useState, type ReactNode } from "react";

const Open = createContext<{ open: string | null; set: (id: string | null) => void }>({
  open: null,
  set: () => {},
});

export function OneOpen({ children }: { children: ReactNode }) {
  const [open, set] = useState<string | null>(null);
  return <Open.Provider value={{ open, set }}>{children}</Open.Provider>;
}

export function OpenRow({
  id,
  leading,
  head,
  label,
  children,
}: {
  id: string;
  /** Before the head, outside the toggle (e.g. the entry's tick). */
  leading?: ReactNode;
  head: ReactNode;
  /** What the toggle says to a screen reader ("Details of …"). */
  label: string;
  children: ReactNode;
}) {
  const { open, set } = useContext(Open);
  const isOpen = open === id;
  return (
    <div
      className={`flex flex-col rounded-control bg-sheet ${
        isOpen ? "rule-strong border-ink" : "rule-medium border-hairline"
      }`}
    >
      <div className="flex min-h-14 items-center gap-2 p-1.5">
        {leading}
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={`row-${id}`}
          aria-label={label}
          onClick={() => set(isOpen ? null : id)}
          className="flex min-h-11 min-w-0 flex-1 items-center gap-2 text-left"
        >
          <span className="min-w-0 flex-1">{head}</span>
          <ChevronDown
            size={18}
            aria-hidden="true"
            className={`shrink-0 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
      </div>
      {isOpen && (
        <div id={`row-${id}`} className="flex flex-col gap-3 px-2.5 pb-3">
          {children}
        </div>
      )}
    </div>
  );
}
