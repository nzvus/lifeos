/**
 * ui/InfoTip.tsx — the ⓘ of a widget (ADR-0038: icons first, one legend per
 * widget): what the widget's marks mean, or how a number is computed, shown
 * only when asked. A native <details>: no script, keyboard and screen
 * readers for free; the text opens in a small card under the icon.
 */
import { Info } from "lucide-react";
import type { ReactNode } from "react";

export function InfoTip({
  label,
  children,
  align = "end",
}: {
  /** Names the icon for screen readers and as tooltip ("How it is computed"). */
  label: string;
  children: ReactNode;
  /** Which edge the card hangs from. */
  align?: "start" | "end";
}) {
  return (
    <details className="group relative inline-block">
      <summary
        aria-label={label}
        title={label}
        className="inline-flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-control text-muted hover:bg-paper hover:text-ink [&::-webkit-details-marker]:hidden"
      >
        <Info size={16} aria-hidden="true" />
      </summary>
      <div
        data-popover
        className={`popover-card absolute top-full z-20 mt-1 hidden rounded-control group-open:block border border-hairline bg-sheet p-3 text-meta font-normal text-ink shadow-lg ${
          align === "end" ? "right-0" : "left-0"
        }`}
      >
        {children}
      </div>
    </details>
  );
}
