/**
 * glyph.ts — the icon resolver (icons.md §2), the same order as the boards'
 * Glyph: a control's role › a nutrient › a section › a tag › the item's own
 * icon › its movement › its dish › its food group › its kind in the domain ›
 * the domain › the place. Pages pass data, never icon names.
 */
type Named = readonly [label: string, glyph: string];

export type IconRegistry = {
  places: Record<string, Named>;
  domains: Record<string, { label: string; glyph: string; kinds: Record<string, Named> }>;
  foodGroups: Record<string, readonly [string, string, Record<string, string>?]>;
  movements: Record<string, string>;
  marks: { equipment: Record<string, Named>; state: Record<string, Named> };
  tags: Record<string, Named>;
  dishes: Record<string, Named>;
  movementLabels: Record<string, string>;
  nutrients: Record<string, Named>;
  controls: Record<string, Named>;
  sections: Record<string, Named>;
  /** Drawing name → one SVG path on a 24 × 24 grid. */
  g: Record<string, string>;
  customNames: readonly string[];
};

/** What a page knows about the thing to draw. */
export type GlyphOf = {
  ui?: string;
  nutrient?: string;
  section?: string;
  tag?: string;
  icon?: string;
  title?: string;
  pattern?: string;
  dish?: string;
  group?: string;
  fine?: string;
  fam?: string;
  kind?: string;
  sub?: string;
  place?: string;
  equipment?: string;
  state?: string;
};

export type Resolved = {
  /** The drawing's path, or "" when nothing matches. */
  d: string;
  label: string;
  /** The corner mark (equipment, state), if any. */
  mark: { d: string; label: string } | null;
};

export function resolveGlyph(reg: IconRegistry, o: GlyphOf): Resolved {
  const pick = (): [string, string] => {
    const named = (t: Record<string, Named>, k: string | undefined) =>
      k !== undefined && t[k] ? ([t[k][1], t[k][0]] as [string, string]) : null;
    const hit =
      named(reg.controls, o.ui) ??
      named(reg.nutrients, o.nutrient) ??
      named(reg.sections, o.section) ??
      named(reg.tags, o.tag);
    if (hit) return hit;
    if (o.icon && reg.g[o.icon]) return [o.icon, o.title ?? o.icon];
    if (o.pattern && reg.movements[o.pattern])
      return [reg.movements[o.pattern]!, o.title ?? o.pattern];
    const dish = named(reg.dishes, o.dish);
    if (dish) return dish;
    const fg = o.group ? reg.foodGroups[o.group] : undefined;
    if (fg) return [(o.fine && fg[2]?.[o.fine]) || fg[1], fg[0]];
    const dom = o.fam ? reg.domains[o.fam] : undefined;
    if (dom) {
      // The subcategory is the more specific datum: a lunch is a meal, drawn as a lunch.
      const k = (o.sub && dom.kinds[o.sub]) || (o.kind && dom.kinds[o.kind]);
      return k ? [k[1], k[0]] : [dom.glyph, dom.label];
    }
    return named(reg.places, o.place) ?? ["", ""];
  };
  const [name, label] = pick();
  const mk =
    (o.equipment && reg.marks.equipment[o.equipment]) ||
    (o.state && reg.marks.state[o.state]) ||
    null;
  return {
    d: reg.g[name] ?? "",
    label,
    mark: mk && reg.g[mk[1]] ? { d: reg.g[mk[1]]!, label: mk[0] } : null,
  };
}
