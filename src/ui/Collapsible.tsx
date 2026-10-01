/**
 * ui/Collapsible.tsx — a page section (the same card and heading as
 * ui/Section) whose heading opens and closes it. Closed, it shows
 * `summary` under the heading (e.g. a moment's macro strip), so a closed
 * section still says what is inside. Content stays mounted while closed
 * (`hidden`), so a half-filled form survives closing it.
 *
 * Open / closed is remembered on this device (localStorage, per `id`): a
 * viewer convenience, so a failed read just means "use the default".
 */
"use client";

import { ChevronDown } from "lucide-react";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { CARD } from "./Card";

const KEY = (id: string) => `lifeos:open:${id}`;

// The remembered states as a tiny external store: the server and the first
// render use the default (null), then React re-reads from the device.
const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
function read(id: string): string | null {
  try {
    return localStorage.getItem(KEY(id));
  } catch {
    return null; // Storage blocked (private window…): the default.
  }
}
function remember(id: string, open: boolean) {
  try {
    localStorage.setItem(KEY(id), open ? "1" : "0");
  } catch {
    // Not remembered: the section still toggles until the next load.
  }
  listeners.forEach((l) => l());
}

export function Collapsible({
  id,
  title,
  icon,
  aside,
  summary,
  defaultOpen = true,
  children,
}: {
  /** Stable, unique on the page: names the remembered state and the content. */
  id: string;
  title: ReactNode;
  /** Optional icon before the heading (decorative). */
  icon?: ReactNode;
  /** Optional summary at the right end of the heading (a count, a total). */
  aside?: ReactNode;
  /** Shown under the heading only while closed. */
  summary?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const saved = useSyncExternalStore(
    subscribe,
    () => read(id),
    () => null,
  );
  const [session, setSession] = useState<boolean | null>(null);
  const open = session ?? (saved === null ? defaultOpen : saved === "1");
  const toggle = () => {
    setSession(!open); // works even when storage is blocked
    remember(id, !open);
  };
  return (
    <section className={CARD}>
      <h2 className="font-display text-section font-bold">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-content`}
          onClick={toggle}
          className="flex w-full items-center gap-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {icon && <span className="inline-flex text-herb">{icon}</span>}
          <span className="min-w-0">{title}</span>
          {aside && (
            <span className="ml-auto font-display text-meta font-normal text-muted tabular-nums">
              {aside}
            </span>
          )}
          <ChevronDown
            size={20}
            aria-hidden="true"
            className={`shrink-0 text-muted transition-transform ${aside ? "" : "ml-auto"} ${open ? "rotate-180" : ""}`}
          />
        </button>
      </h2>
      {!open && summary}
      <div id={`${id}-content`} hidden={!open} className="flex flex-col gap-4">
        {children}
      </div>
    </section>
  );
}
