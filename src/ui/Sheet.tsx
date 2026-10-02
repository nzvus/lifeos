/**
 * ui/Sheet.tsx — a panel that slides up from the bottom for a short task
 * (2026-10-02, the developer: "show those widgets only when needed"):
 * add food, training, a night, the day's movement. The page stays about
 * what happened; the forms come when asked. The convention of phone apps
 * (bottom sheets); a centred dialog on wide screens.
 *
 * Opened by a link to `#<id>` (the day page's "+", a chip), on load and on
 * every hash change; closing (✕, Escape, a tap outside) drops the hash so
 * the same link opens it again. A real modal <dialog>: opaque, focus kept
 * inside. Children stay mounted while closed, so a half-filled form
 * survives closing it.
 */
"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { buttonClass } from "./button";

export function Sheet({
  id,
  title,
  icon,
  closeLabel,
  children,
}: {
  id: string;
  title: ReactNode;
  icon?: ReactNode;
  closeLabel: string;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const check = () => {
      const d = dialog.current;
      if (!d) return;
      if (window.location.hash === `#${id}`) {
        if (!d.open) d.showModal();
      } else if (d.open) d.close();
    };
    check();
    window.addEventListener("hashchange", check);
    return () => window.removeEventListener("hashchange", check);
  }, [id]);
  const close = () => dialog.current?.close();
  return (
    <dialog
      ref={dialog}
      id={id}
      aria-labelledby={`${id}-title`}
      // Closing in any way drops the hash, so the same link opens it again.
      onClose={() => {
        if (window.location.hash === `#${id}`)
          history.replaceState(
            null,
            "",
            window.location.pathname + window.location.search,
          );
      }}
      onClick={(e) => e.target === dialog.current && close()}
      className="mx-auto mt-auto mb-0 w-full max-w-xl rounded-t-surface border border-hairline bg-paper p-0 text-ink backdrop:bg-ink/50 md:mb-auto md:rounded-surface"
      style={{ maxHeight: "88dvh" }}
    >
      <div
        className="@container flex flex-col gap-4 p-4"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
      >
        <div className="flex items-center gap-2">
          {icon && <span className="section-icon">{icon}</span>}
          <h2
            id={`${id}-title`}
            className="min-w-0 flex-1 font-display text-section font-bold"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label={closeLabel}
            title={closeLabel}
            className={buttonClass({ variant: "quiet", iconOnly: true })}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
