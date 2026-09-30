/**
 * ui/MomentIcon.tsx — the icon of each moment of the day (ADR-0011), in one
 * place, in the moment's own colour (--color-moment-*, design/theme.css).
 * Keys are plain strings (ui/ may not import core types); an unknown key, or
 * none ("not set"), gets a neutral clock in the surrounding text colour.
 */
import { Apple, Clock, Coffee, Sandwich, Soup, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  breakfast: Coffee,
  lunch: Sandwich,
  snack: Apple,
  dinner: Soup,
};

/** Text colour class per moment, for its icon and its name in headings. */
export const MOMENT_TEXT: Record<string, string> = {
  breakfast: "text-moment-breakfast",
  lunch: "text-moment-lunch",
  snack: "text-moment-snack",
  dinner: "text-moment-dinner",
};

export function MomentIcon({
  moment,
  size = 16,
}: {
  moment: string | null;
  size?: number;
}) {
  const Icon = (moment && ICONS[moment]) || Clock;
  const colour = (moment && MOMENT_TEXT[moment]) || "";
  return <Icon size={size} aria-hidden="true" className={colour} />;
}
