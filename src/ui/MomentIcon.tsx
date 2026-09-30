/**
 * ui/MomentIcon.tsx — the icon of each moment of the day (ADR-0011), in one
 * place. Keys are plain strings (ui/ may not import core types); an unknown
 * key, or none ("not set"), gets a neutral clock.
 */
import { Apple, Clock, Coffee, Sandwich, Soup, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  breakfast: Coffee,
  lunch: Sandwich,
  snack: Apple,
  dinner: Soup,
};

export function MomentIcon({
  moment,
  size = 16,
}: {
  moment: string | null;
  size?: number;
}) {
  const Icon = (moment && ICONS[moment]) || Clock;
  return <Icon size={size} aria-hidden="true" />;
}
