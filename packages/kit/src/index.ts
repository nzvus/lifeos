/**
 * @lifeos/kit — one stylesheet (`styles/kit.css` + `styles/tokens.css`),
 * one icon registry, one formatter and the components every v2 screen is
 * made of (docs/spec/patterns.md). It mirrors the design boards one to one.
 */
export { F, MET, PART, type Level, type State } from "./format";
export { addDays, monthOf, weekOf } from "./calendar";
export { resolveGlyph, type GlyphOf, type IconRegistry } from "./glyph";
export { ICONS } from "./icons.generated";
export { Glyph, type GlyphSize } from "./Glyph";
export { Box, type BoxAct, type BoxEntry } from "./Box";
export { PageHeader } from "./PageHeader";
export { NavBar, AreaTabs, AREAS, TABS, type Area, type Tab } from "./NavBar";
export { DateNav, type DayBars, type Rhythm } from "./DateNav";
export { useLevel, nextLevel, readLevel } from "./levels";
export { DayPart, EmptyTime, type DayPartName } from "./DayPart";
export { RangeNav, type RangePreset } from "./RangeNav";
export { Swipe } from "./Swipe";
export { List } from "./List";
export { listWindow, LIST_WINDOW } from "./list";
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
export { WORDS } from "./words";
export { fold, find, matchScore, distance, usesAtHour, type Findable } from "./find";
export { Find, type FindItem } from "./Find";
export { TOAST_MS, toastReducer, type ToastData } from "./toast";
export { Toast, useToast } from "./Toast";
export { Sheet, SheetInline } from "./Sheet";
export { Confirm } from "./Confirm";
export { EmptyState } from "./EmptyState";
export { Banner } from "./Banner";
export { SortChips } from "./SortChips";
export { splitActions, type ObjectVerb } from "./actions";
export { ObjectActions } from "./ObjectActions";
export { ObjectPage } from "./ObjectPage";
export { EntryHeader, type EntryStatus } from "./EntryHeader";
export { formFields, readForm, type FormFieldSpec, type FormValue } from "./form";
export { ObjectForm } from "./ObjectForm";
export { whySections, isUnknown, unknownWords, type WhyDeclaration } from "./why";
export { Why } from "./Why";
export { Unknown } from "./Unknown";
