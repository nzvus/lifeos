/**
 * ui/QualityIcons.tsx — the icons and badges of ADR-0012, in one place:
 * NOVA level, origin, fibre types and free tags. Keys are plain strings
 * (ui/ may not import core types); unknown keys get a neutral icon.
 *
 * NOVA colours reuse the target tones: 1 herb (unprocessed) → 4 tomato
 * (ultra-processed), 2 neutral, 3 warn.
 */
import {
  Apple,
  Bean,
  Beef,
  Blend,
  Droplets,
  Flame,
  Heart,
  Layers,
  Leaf,
  Milk,
  MilkOff,
  Package,
  ShoppingCart,
  Snowflake,
  Sprout,
  Star,
  Store,
  Tag,
  Wheat,
  WheatOff,
  type LucideIcon,
} from "lucide-react";

const ORIGIN: Record<string, LucideIcon> = { plant: Leaf, animal: Beef, mixed: Blend };
const FIBER: Record<string, LucideIcon> = {
  inulin_fos: Sprout,
  beta_glucan: Wheat,
  resistant_starch: Bean,
  pectin: Apple,
  psyllium: Droplets,
  insoluble: Layers,
  gos: Milk,
};
/** The free-tag icon set (keys = core/nutrition/quality.ts TAG_ICONS). */
export const TAG_ICON: Record<string, LucideIcon> = {
  tag: Tag,
  store: Store,
  "shopping-cart": ShoppingCart,
  leaf: Leaf,
  sprout: Sprout,
  star: Star,
  heart: Heart,
  flame: Flame,
  snowflake: Snowflake,
  package: Package,
  "wheat-off": WheatOff,
  "milk-off": MilkOff,
};
const NOVA_TONE: Record<number, string> = {
  1: "border-herb text-herb",
  2: "border-hairline text-ink",
  3: "border-warn text-warn",
  4: "border-tomato text-tomato",
};

export function OriginIcon({ origin, size = 14 }: { origin: string; size?: number }) {
  const Icon = ORIGIN[origin] ?? Blend;
  return <Icon size={size} aria-hidden="true" />;
}
export function FiberTypeIcon({ type, size = 14 }: { type: string; size?: number }) {
  const Icon = FIBER[type] ?? Sprout;
  return <Icon size={size} aria-hidden="true" />;
}
export function TagIcon({ icon, size = 14 }: { icon: string; size?: number }) {
  const Icon = TAG_ICON[icon] ?? Tag;
  return <Icon size={size} aria-hidden="true" />;
}

const CHIP = "inline-flex items-center gap-1 rounded-control border px-1.5 text-meta";

/**
 * A row of small chips: NOVA level, origin, fibre types, free tags. Labels
 * arrive translated; each chip's text is also its accessible name.
 */
export function QualityBadges({
  nova,
  origin,
  fiberTypes,
  tags,
  labels,
}: {
  nova: number | null;
  origin: string | null;
  fiberTypes: readonly string[];
  tags: readonly { name: string; icon: string }[];
  labels: {
    nova: (level: number) => string;
    origin: (origin: string) => string;
    fiber: (type: string) => string;
  };
}) {
  if (nova === null && origin === null && fiberTypes.length === 0 && tags.length === 0)
    return null;
  return (
    <ul className="flex flex-wrap gap-1">
      {nova !== null && (
        <li className={`${CHIP} font-semibold ${NOVA_TONE[nova] ?? ""}`}>
          {labels.nova(nova)}
        </li>
      )}
      {origin !== null && (
        <li className={`${CHIP} border-hairline text-muted`}>
          <OriginIcon origin={origin} />
          {labels.origin(origin)}
        </li>
      )}
      {fiberTypes.map((f) => (
        <li key={f} className={`${CHIP} border-hairline text-macro-fiber`}>
          <FiberTypeIcon type={f} />
          {labels.fiber(f)}
        </li>
      ))}
      {tags.map((t) => (
        <li key={t.name} className={`${CHIP} border-hairline bg-paper text-muted`}>
          <TagIcon icon={t.icon} />
          {t.name}
        </li>
      ))}
    </ul>
  );
}
