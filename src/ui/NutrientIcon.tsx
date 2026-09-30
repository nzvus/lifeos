/**
 * ui/NutrientIcon.tsx — the icon and colour of each nutrient, in ONE place,
 * so every screen shows protein with the same symbol and colour.
 *
 * Keys are plain strings matching core's nutrient keys ("kcal", "protein"…);
 * ui/ may not import core types (ADR-0002), and an unknown key simply gets no
 * icon. Colours are the --color-macro-* tokens (design/theme.css).
 */
import {
  Beef,
  Candy,
  Diamond,
  Droplet,
  Droplets,
  Flame,
  Leaf,
  Wheat,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  kcal: Flame,
  protein: Beef,
  carbs: Wheat,
  sugars: Candy,
  fat: Droplet,
  saturatedFat: Droplets, // the denser fat
  fiber: Leaf,
  salt: Diamond, // a salt crystal; salt has no colour of its own (ink)
};

/** CSS variable of each nutrient's own colour (for ui/targetTone, charts). */
export const NUTRIENT_VAR: Record<string, string> = {
  kcal: "--color-kcal",
  protein: "--color-macro-protein",
  carbs: "--color-macro-carbs",
  sugars: "--color-macro-carbs",
  fat: "--color-macro-fat",
  saturatedFat: "--color-macro-fat",
  fiber: "--color-macro-fiber",
  salt: "--color-muted",
};

/** Text colour class per nutrient (for icons and legends). */
export const NUTRIENT_TEXT: Record<string, string> = {
  protein: "text-macro-protein",
  carbs: "text-macro-carbs",
  sugars: "text-macro-carbs",
  fat: "text-macro-fat",
  saturatedFat: "text-macro-fat",
  fiber: "text-macro-fiber",
  kcal: "text-kcal",
};

/** Background colour class per nutrient (for bars). */
export const NUTRIENT_BG: Record<string, string> = {
  protein: "bg-macro-protein",
  carbs: "bg-macro-carbs",
  sugars: "bg-macro-carbs",
  fat: "bg-macro-fat",
  saturatedFat: "bg-macro-fat",
  fiber: "bg-macro-fiber",
  kcal: "bg-kcal",
};

export function NutrientIcon({ name, size = 16 }: { name: string; size?: number }) {
  const Icon = ICONS[name];
  if (!Icon) return null;
  return <Icon size={size} aria-hidden="true" className={NUTRIENT_TEXT[name] ?? ""} />;
}
