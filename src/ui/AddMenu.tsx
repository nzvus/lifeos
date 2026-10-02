/**
 * ui/AddMenu.tsx — the "+" of every section (2026-10-02, the developer:
 * "the + on the other pages too"): a round button where the thumb is,
 * opening a centred menu of what can be added there — Training: session,
 * routine, exercise, program; Food: meal, ingredient, product; Progress:
 * weigh-in, day type. Which items show is chosen by the path (`sections`,
 * longest prefix first); none on editors, gym mode and pages without one.
 * The day page has its own "+" (features/nutrition/log/AddFab).
 *
 * Icons are chosen by NAME (the layout is a server component: names are
 * data it can pass).
 */
"use client";

import {
  CalendarClock,
  CalendarRange,
  ClipboardList,
  Dumbbell,
  Package,
  Plus,
  Scale,
  Carrot,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { buttonClass } from "./button";

const ICONS = {
  session: Dumbbell,
  routine: ClipboardList,
  exercise: Dumbbell,
  program: CalendarRange,
  meal: UtensilsCrossed,
  ingredient: Carrot,
  product: Package,
  weight: Scale,
  dayType: CalendarClock,
} satisfies Record<string, LucideIcon>;

export type AddItem = { href: string; label: string; icon: keyof typeof ICONS };

/** Editors, gym mode: they have their own actions, no "+". */
const BARE = /\/new$|\/live$|\/[0-9a-f]{8}-[0-9a-f-]{27}$/;

export function AddMenu({
  sections,
  labels,
}: {
  /** Path prefix → the items to add there. */
  sections: { prefix: string; items: AddItem[] }[];
  labels: { open: string; title: string; close: string };
}) {
  const path = usePathname();
  const menu = useRef<HTMLDialogElement>(null);
  const section = [...sections]
    .sort((a, b) => b.prefix.length - a.prefix.length)
    .find((s) => path === s.prefix || path.startsWith(`${s.prefix}/`));
  if (!section || BARE.test(path)) return null;
  const close = () => menu.current?.close();
  return (
    <>
      <button
        type="button"
        aria-label={labels.open}
        title={labels.open}
        onClick={() => menu.current?.showModal()}
        className="fixed right-4 bottom-24 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-herb text-sheet shadow-lg editing:hidden md:bottom-8"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <Plus size={28} aria-hidden="true" />
      </button>
      <dialog
        ref={menu}
        onClick={(e) => e.target === menu.current && close()}
        aria-label={labels.title}
        className="m-auto w-11/12 max-w-md rounded-surface border border-hairline bg-sheet p-0 text-ink backdrop:bg-scrim"
      >
        <div className="flex flex-col gap-1 p-3">
          <div className="flex items-center justify-between px-3 py-1">
            <span className="font-display text-section font-bold">{labels.title}</span>
            <button
              type="button"
              onClick={close}
              aria-label={labels.close}
              className={buttonClass({ variant: "quiet", iconOnly: true })}
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          {section.items.map((it) => {
            const Icon = ICONS[it.icon];
            return (
              // Plain links: a "#sheet" on the same page must fire hashchange.
              <a
                key={it.href}
                href={it.href}
                onClick={close}
                className="flex items-center gap-3 rounded-control px-3 py-3 font-display text-item font-semibold hover:bg-paper"
              >
                <Icon size={22} aria-hidden="true" className="text-herb" />
                {it.label}
              </a>
            );
          })}
        </div>
      </dialog>
    </>
  );
}
