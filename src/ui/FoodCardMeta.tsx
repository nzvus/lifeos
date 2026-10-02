/**
 * ui/FoodCardMeta.tsx — the second line of a food card: energy on the left
 * (with what it refers to: "per 100 g", "per serving"), usage on the right,
 * with its own icon so it never reads as a price (the price sits above it,
 * with a different icon, in the card's aside).
 */
import { History } from "lucide-react";

export function FoodCardMeta({
  energy,
  basis,
  uses,
}: {
  /** "617 kcal" */
  energy: string;
  /** "per 100 g" / "per serving" */
  basis: string;
  /** "2× in 60 days", or "never used". */
  uses: string;
}) {
  return (
    // Wraps instead of squeezing: a large energy figure on a narrow line
    // overlapped its basis (design review B5).
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-meta">
      <span className="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
        <span className="font-display text-body font-bold tabular-nums">{energy}</span>
        <span className="text-muted">{basis}</span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 text-muted tabular-nums">
        <History size={14} aria-hidden="true" />
        {uses}
      </span>
    </div>
  );
}
