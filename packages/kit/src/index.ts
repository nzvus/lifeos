/**
 * @lifeos/kit — one stylesheet (`styles/kit.css` + `styles/tokens.css`),
 * one icon registry, one formatter and the components every v2 screen is
 * made of (docs/spec/v2/kit.md). It mirrors the design boards one to one.
 */
export { F, MET, PART, type Level, type State } from "./format";
export { addDays, monthOf, weekOf } from "./calendar";
export { resolveGlyph, type GlyphOf, type IconRegistry } from "./glyph";
export { ICONS } from "./icons.generated";
export { Glyph, type GlyphSize } from "./Glyph";
export { Box, type BoxEntry } from "./Box";
export { PageHeader } from "./PageHeader";
export { NavBar, type Place } from "./NavBar";
export { DateNav } from "./DateNav";
