"use client";
/**
 * A row that must be one line (VIS-108, his 21 Nov §152): when its room cannot hold it, everything
 * in it — type, icons, gaps — is drawn smaller together (`zoom`), down to 80 %; past that it wraps.
 * It measures itself on every resize of its room.
 */
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { fitScale } from "./fit";

export function FitLine({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const room = el?.parentElement;
    if (!el || !room) return;
    const measure = () => {
      el.style.setProperty("--fit", "1");
      el.removeAttribute("data-wrap");
      const { scale, wrap } = fitScale(room.clientWidth, el.scrollWidth);
      el.style.setProperty("--fit", String(scale));
      if (wrap) el.setAttribute("data-wrap", "");
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(room);
    return () => ro.disconnect();
  }, []);
  return (
    <span ref={ref} className={className + " k-fit"}>
      {children}
    </span>
  );
}
