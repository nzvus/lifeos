/**
 * ui/Sheet.tsx — a centred panel for a short task
 * (2026-10-02, the developer: "show those widgets only when needed"):
 * add food, training, a night, the day's movement. The page stays about
 * what happened; the forms come when asked. Centred, on a dark veil (the
 * developer's choice over a bottom sheet, 2026-10-02).
 *
 * Opened by a link to `#<id>` (the day page's "+", a chip), on load and on
 * every hash change; closing (✕, Escape, a tap outside) drops the hash so
 * the same link opens it again. A real modal <dialog>: opaque, focus kept
 * inside. Children stay mounted while closed, so a half-filled form
 * survives closing it. Rendered into <body> (a portal): inside a closed
 * section the open modal was invisible and froze the page (2026-10-02).
 */
"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
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
  // In the browser only (the server has no <body> to portal into).
  const client = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
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
  }, [id, client]);
  const close = () => dialog.current?.close();
  if (!client) return null;
  return createPortal(
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
      className="m-auto w-11/12 max-w-xl rounded-surface border border-hairline bg-paper p-0 text-ink backdrop:bg-scrim"
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
    </dialog>,
    document.body,
  );
}
