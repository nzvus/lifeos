/**
 * Glyph — the only way an icon is drawn (icons.md). It takes data (`of`),
 * never a name; the resolver picks the drawing. Sizes on a 4 px grid, the
 * stroke thinning as the drawing grows (icons.md §4).
 */
import { resolveGlyph, type GlyphOf } from "./glyph";
import { ICONS } from "./icons.generated";

const SIZES = {
  xs: [12, 2.2],
  s: [16, 2],
  m: [18, 2],
  l: [28, 1.75],
  xl: [64, 1.25],
  bg: [320, 1],
} as const;
export type GlyphSize = keyof typeof SIZES;

export function Glyph({
  of,
  size = "m",
  tile = false,
  decorative = true,
}: {
  of: GlyphOf;
  size?: GlyphSize;
  tile?: boolean;
  /** false when the drawing is the only label of a control. */
  decorative?: boolean;
}) {
  const r = resolveGlyph(ICONS, of);
  const [px, sw] = SIZES[size];
  const cls =
    "k-glyph g-" +
    size +
    (tile ? " tile" : "") +
    (of.fam ? " fam-" + of.fam : "") +
    (of.sub ? " sub-" + of.sub : "") +
    (of.nutrient ? " nut-" + of.nutrient : "") +
    (of.ui ? " ui" : "");
  const mark = r.mark && size !== "xs" && size !== "bg" ? r.mark : null;
  const mpx = size === "s" ? 8 : 9;
  const label = r.label + (r.mark ? ", " + r.mark.label.toLowerCase() : "");
  return (
    <span
      className={cls}
      role={decorative ? "presentation" : "img"}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative ? true : undefined}
      title={label}
    >
      <svg
        width={px}
        height={px}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={r.d} />
      </svg>
      {mark && (
        <span className="k-tool">
          <svg
            width={mpx}
            height={mpx}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d={mark.d} />
          </svg>
        </span>
      )}
    </span>
  );
}
