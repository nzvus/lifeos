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
export { Box, type BoxAct, type BoxEntry } from "./Box";
export { PageHeader } from "./PageHeader";
export { NavBar, type Place } from "./NavBar";
export { DateNav, type DayBars } from "./DateNav";
export { useLevel, nextLevel, readLevel } from "./levels";
export { RangeNav, type RangePreset } from "./RangeNav";
export { Chart, chartGeometry, type ChartData } from "./Chart";
export { Field, type FieldOption, type FieldProps } from "./Field";
export { Nutrients, NutrientsL0 } from "./Nutrients";
export {
  nutrientsL0,
  nutrientsL1,
  heatLevel,
  HEAT_WORDS,
  type HeatLevel,
  type HeatZone,
  type LimitKey,
  type MacroKey,
  type NutrientsData,
} from "./nutrient-rows";
