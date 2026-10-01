/**
 * ui/Menu.tsx — the "⋯" of a page or an item (ADR-0015): actions that are
 * not the main one (duplicate, delete) live here, away from Save. Opens a
 * small list under the button; closes on a choice, Escape or a tap outside.
 */
"use client";

import { MoreVertical } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { buttonClass } from "./button";

export type MenuItem = {
  label: string;
  icon?: ReactNode;
  /** A link, or an action. */
  href?: string;
  onSelect?: () => void;
  tone?: "danger";
};

export function Menu({ label, items }: { label: string; items: readonly MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (
        e instanceof KeyboardEvent
          ? e.key === "Escape"
          : !box.current?.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);
  const row = (tone?: "danger") =>
    `flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-paper ${tone === "danger" ? "text-tomato" : ""}`;
  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={buttonClass({ variant: "subtle", iconOnly: true })}
      >
        <MoreVertical size={20} aria-hidden="true" />
      </button>
      {open && (
        <ul
          role="menu"
          className="panel absolute right-0 z-40 mt-1 flex min-w-48 flex-col overflow-hidden py-1"
        >
          {items.map((it) => (
            <li key={it.label} role="none">
              {it.href ? (
                <Link role="menuitem" href={it.href} className={row(it.tone)}>
                  {it.icon}
                  {it.label}
                </Link>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    it.onSelect?.();
                  }}
                  className={row(it.tone)}
                >
                  {it.icon}
                  {it.label}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
