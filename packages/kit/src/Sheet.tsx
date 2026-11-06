"use client";
/**
 * Sheet (PAT-23): the one bottom sheet — «⋯ Altro», a confirm, a «Perché?». The dim area and
 * Esc close it; the title names it for screen readers; a foot holds its buttons. It renders in a
 * portal on <body> once mounted, so a sheet opened from inside a paragraph or a row never nests
 * in it (the «Perché?» inside a <p> broke hydration, 6 Nov); tests render it in place.
 */
import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { WORDS } from "./words";

/** True renders sheets in place (server-markup tests): no portal, no wait for the mount. */
export const SheetInline = createContext(false);

const noop = () => () => {};
/** False on the server and while hydrating, true after: the portal never mismatches the HTML. */
const useMounted = () =>
  useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

export function Sheet({
  open,
  title,
  meta,
  onClose,
  children,
  foot,
}: {
  open: boolean;
  title: string;
  meta?: string;
  onClose: () => void;
  children?: ReactNode;
  foot?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, onClose]);
  const inline = useContext(SheetInline);
  const mounted = useMounted();
  if (!open || (!inline && !mounted)) return null;
  const sheet = (
    <div className="k-sheet-wrap k-screen">
      <button
        type="button"
        className="k-dim"
        aria-label={WORDS.close}
        onClick={onClose}
      />
      <section className="k-sheet" role="dialog" aria-modal="true" aria-label={title}>
        <span className="handle" />
        <div className="k-sh">
          <h2>{title}</h2>
          {meta && <span className="k-meta">{meta}</span>}
        </div>
        {children && <div className="k-sbody">{children}</div>}
        {foot && <div className="foot">{foot}</div>}
      </section>
    </div>
  );
  return inline ? sheet : createPortal(sheet, document.body);
}
