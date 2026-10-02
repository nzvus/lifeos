/**
 * ui/Menu.tsx — the "⋯" of a page or an item (ADR-0015): actions that are
 * not the main one (duplicate, make default…) live here, away from Save.
 * Also a choice among a few (a program day's routine), with its own button.
 * Opens a centred dialog of big rows; closes on a choice, Escape or a tap
 * outside.
 */
"use client";

import { MoreVertical, X } from "lucide-react";
import Link from "next/link";
import { useRef, type ReactNode } from "react";
import { buttonClass } from "./button";

export type MenuItem = {
  label: string;
  icon?: ReactNode;
  /** A link, or an action. */
  href?: string;
  onSelect?: () => void;
  tone?: "danger";
};

export function Menu({
  label,
  items,
  closeLabel = label,
  trigger,
}: {
  label: string;
  items: readonly MenuItem[];
  closeLabel?: string;
  /** The button, when not the "⋯": an icon and a short text (e.g. "Change"). */
  trigger?: { icon: ReactNode; text: string };
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = () => dialog.current?.close();
  const row = (tone?: "danger") =>
    `flex w-full items-center gap-3 rounded-control px-3 py-3 text-left font-semibold hover:bg-paper ${tone === "danger" ? "text-tomato" : ""}`;
  return (
    <>
      <button
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}
        className={buttonClass({
          variant: "subtle",
          size: trigger ? "sm" : undefined,
          iconOnly: !trigger,
        })}
      >
        {trigger ? (
          <>
            {trigger.icon}
            {trigger.text}
          </>
        ) : (
          <MoreVertical size={20} aria-hidden="true" />
        )}
      </button>
      {/* A centred dialog like every other (2026-10-02: the small drop-down
          was cut by its card and hard to tap). Escape or a tap outside close it. */}
      <dialog
        ref={dialog}
        aria-label={label}
        onClick={(e) => e.target === dialog.current && close()}
        className="m-auto w-11/12 max-w-sm rounded-surface border border-hairline bg-sheet p-0 text-ink backdrop:bg-scrim"
      >
        <div className="flex flex-col gap-1 p-3">
          <div className="flex items-center justify-between px-3 py-1">
            <span className="font-display text-section font-bold">{label}</span>
            <button
              type="button"
              onClick={close}
              aria-label={closeLabel}
              className={buttonClass({ variant: "quiet", iconOnly: true })}
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          {items.map((it) =>
            it.href ? (
              <Link
                key={it.label}
                href={it.href}
                onClick={close}
                className={row(it.tone)}
              >
                {it.icon}
                {it.label}
              </Link>
            ) : (
              <button
                key={it.label}
                type="button"
                onClick={() => {
                  close();
                  it.onSelect?.();
                }}
                className={row(it.tone)}
              >
                {it.icon}
                {it.label}
              </button>
            ),
          )}
        </div>
      </dialog>
    </>
  );
}
