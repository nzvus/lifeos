/**
 * ui/button.ts — THE look of every button and button-like link (S20 design
 * pass): one place for height, padding, corners, type and focus, so a
 * button looks the same on every page and every theme restyles all of them
 * at once (tokens: --radius-control, colours).
 *
 *   primary   filled: the one main action of a screen (Save, Add)
 *   secondary outlined in ink: other real actions (Export, Add series)
 *   subtle    outlined hairline: small actions inside rows and cards (⋯, bin)
 *   quiet     no outline: header icons, Cancel next to Save
 *   danger    outlined tomato: destructive confirmations
 *
 * Sizes: md (44 px, the touch target) and sm (36 px, inside dense rows).
 * A function, not a component: <button>, <Link> and <a> all take it.
 */
export type ButtonVariant = "primary" | "secondary" | "subtle" | "quiet" | "danger";
export type ButtonSize = "md" | "sm";

const BASE =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-control font-display font-semibold whitespace-nowrap transition-colors select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50";

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-herb text-sheet hover:bg-herb-strong",
  secondary: "rule-medium border-ink text-ink hover:bg-paper",
  subtle: "rule-medium border-hairline text-ink hover:border-ink",
  quiet: "text-ink hover:bg-paper",
  danger: "rule-medium border-tomato text-tomato hover:bg-paper",
};

const SIZE: Record<ButtonSize, { text: string; icon: string }> = {
  md: { text: "h-11 px-4 text-item", icon: "h-11 w-11 text-item" },
  sm: { text: "h-9 px-3 text-meta", icon: "h-9 w-9 text-meta" },
};

export function buttonClass({
  variant = "secondary",
  size = "md",
  iconOnly = false,
  block = false,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Square: only an icon (its text goes to aria-label / sr-only). */
  iconOnly?: boolean;
  /** Full width (a form's single button on a phone, a tile). */
  block?: boolean;
} = {}): string {
  return [
    BASE,
    VARIANT[variant],
    iconOnly ? SIZE[size].icon : SIZE[size].text,
    block ? "w-full" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

/** Text links (Back, "All exercises", inline actions in a sentence). */
export const TEXT_LINK =
  "underline decoration-1 underline-offset-4 hover:decoration-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";
