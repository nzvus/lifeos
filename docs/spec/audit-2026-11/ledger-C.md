# Ledger audit C — UI (103 lines). Spot-checked by grep, not line-by-line read; kit has only 12 components (Box, Chart, DateNav, DayPart, Field, Glyph, List, NavBar, Nutrients, PageHeader, RangeNav, Swipe).
| ID | ledger status | scope | verdict | evidence | duplicate / recurring |
|---|---|---|---|---|---|
| UI-01 | D | screen | partial | Box/Nutrients exist; coffee/creatine pills in QuickIntakes.tsx; week-strip bar in day-page.tsx not kit | UI-05, UI-02 |
| UI-02 | D | pattern | partial | Nutrients kit L0-L2; options/skylines not unified | UI-68, UI-55 |
| UI-03 | D | pattern | partial | picks round1/2 (bars, score, week, weather, meals); skyline lives in features/day/score.ts, not kit | UI-75..80 |
| UI-04 | S | screen | superseded | boards rejected; ideas redone by UI-91 (Al volo/water) | UI-91 |
| UI-05 | v2 | screen | built | Box.tsx, Nutrients.tsx, QuickIntakes.tsx | UI-01 |
| UI-06 | D | pattern | partial | register P1-S20; tokens.css/kit.css exist, citation index only | UI-35 |
| UI-07 | D | pattern | partial | Find is not a kit component (no Find.tsx); Library.tsx has own search/typo helpers | UI-12, UI-26 |
| UI-08 | D | pattern | partial | ranking in library.ts only; no shared Find | UI-07 |
| UI-09 | D | pattern | partial | sorts in Library only | UI-07 |
| UI-10 | D | pattern | partial | filters in Library only; no find.json found | UI-07 |
| UI-11 | D | pattern | partial | groups in some lists; period vocab RangeNav | UI-07 |
| UI-12 | D | pattern | partial | no find.json/ui-check rule found; ui-check.mjs checks lists only | UI-07, UI-43 |
| UI-13 | D | pattern | built | Glyph.tsx, glyph.ts, icons.generated.ts resolver | UI-14 |
| UI-14 | D | pattern | built | glyph.ts item drawings (partial coverage unverified) | UI-13 |
| UI-15 | D | pattern | partial | corner marks in Glyph; Find bar icons absent (no Find) | UI-07 |
| UI-16 | D | pattern | built | Glyph sizes in kit.css icons section | UI-13 |
| UI-17 | D | pattern | built | kit.css:1731 backdrop; re-judged by V3/UI-79 | UI-79 |
| UI-18 | D | pattern | partial | shape levels in kit.css; no ObjectPage/Section component | UI-36 |
| UI-19 | D | pattern | built | tokens.css scales | UI-25 |
| UI-20 | D | pattern | superseded | UI-83 changes silhouettes (tail/point/eyelet removed); UI-79 limits | UI-79, UI-83 |
| UI-21 | D | pattern | partial | button classes in kit.css; no Button component | UI-40 |
| UI-22 | D | pattern | built | NavBar, tabs in kit.css | UI-90 |
| UI-23 | D | pattern | partial | track/segments in Nutrients/Chart; skyline in features/day not kit | UI-03, UI-75 |
| UI-24 | D | pattern | built | Field.tsx, field.test.ts | UI-37 |
| UI-25 | D | pattern | built | k-stack/k-line in kit.css; inline style counts unmeasured | UI-26 |
| UI-26 | D | pattern | contradicted | WeekStrip, Skyline, Toast, Find live in app features, not packages/kit | UI-29, UI-07 |
| UI-27 | D | pattern | partial | families/hues registered; new family still needs screen code (unverified) | UI-26 |
| UI-28 | D | pattern | built | --t-box in kit.css:4, used 32× | — |
| UI-29 | D | pattern | partial | missing in kit: Skyline, WeekStrip, Find; Chart/Field/NavBar/DateNav/PageHeader present | UI-26 |
| UI-30 | D | pattern | built | Box picks inside by family (muscle strip, need bar) | UI-14 |
| UI-31 | D | pattern | built | Nutrients.tsx open/highlight | UI-29 |
| UI-32 | D | pattern | built | ruler/zones in Nutrients + kit.css | UI-65 |
| UI-33 | D | pattern | partial | compact rule; chip-for-meal check unverified | UI-84 |
| UI-34 | D | pattern | superseded | boards frozen/obsolete; /kit gallery replaced them (UI-88) | UI-88 |
| UI-35 | D | pattern | partial | P1-P9; ui-check.mjs checks targets/lists, not all | UI-43 |
| UI-36 | D | pattern | partial | no ObjectPage component; pages hand-built under [area]/ | UI-96, UI-61 |
| UI-37 | D | pattern | partial | edit-in-place partly; "Salvato" toast mostly absent in grep | UI-67 |
| UI-38 | D | pattern | partial | Archivia present in object pages; trash in profilo/cestino | UI-39 |
| UI-39 | D | pattern | partial | classes applied ad hoc; no shared component | UI-40 |
| UI-40 | D | pattern | partial | vocabulary in places; no lone-› audit | UI-101 |
| UI-41 | D | pattern | built | kit List.tsx 8 + Mostra altri; Library.tsx:352 | UI-100 (same rule) |
| UI-42 | D | pattern | partial | meal/water/gym decided; Piano day row set unverified | UI-91 |
| UI-43 | v2 | pattern | partial | scripts/ui-check.mjs exists; the 30 tasks (F) absent | UI-35 |
| UI-44 | D | pattern | built | format.ts `F` with tests | UI-47 |
| UI-45 | D | pattern | contradicted | "Salva nella routine" in core/training/write.ts, sessione page; ledger itself flags ? | UI-45 own note |
| UI-46 | D | pattern | partial | microcopy rules; unverifiable globally | UI-45 |
| UI-47 | D | pattern | built | F.judge/F.cap/F.reach in format.ts | UI-44 |
| UI-48 | D | pattern | partial | provenance pills in some rows | — |
| UI-49 | D | pattern | partial | loading.tsx skeletons in (app); offline banner unverified | — |
| UI-50 | D | pattern | partial | shared rules list (screens.md); sub-bullets mixed | UI-35 |
| UI-51 | D | screen | partial | V-01..V-16: places superseded by ADR-0059/UI-90 | UI-60, UI-90 |
| UI-52 | F | screen | future | compact entry row; EntryRow.tsx partly | UI-05 |
| UI-53 | F | screen | future | feed filters: features/day/filter.ts exists, so partial | UI-54 |
| UI-54 | F | screen | future | day detail tabs | UI-86 |
| UI-55 | D | pattern | built | Nutrients one shape | UI-68 |
| UI-56 | F | pattern | future | Review area; Andamento exists w/ RangeNav | UI-87 |
| UI-57 | D | pattern | built | EntrySheet.tsx; object pages | — |
| UI-58 | D | pattern | partial | core/day/read.ts; route size cap not enforced | — |
| UI-59 | D | pattern | partial | must-survive list; 360px/120% tested via ui-audit | UI-84 |
| UI-60 | S | pattern | superseded | ADR-0059 / UI-90 places Corpo·Cibo·Oggi·Mente·Soldi | UI-62, UI-90 |
| UI-61 | D | pattern | partial | patterns ObjectPage, Section, ValueRow, ActionRow, Toast, MoreSheet not in kit | UI-36, UI-26 |
| UI-62 | D | pattern | duplicate | same decision as UI-60/UI-90 (ledger says "rediscovered") | UI-60 |
| UI-63 | D | pattern | built | routes per view; sheet via aggiungi | — |
| UI-64 | D | pattern | partial | data-density in kit.css; ⓘ legend unverified | — |
| UI-65 | D | pattern | built | grams bar with zones | UI-32 |
| UI-66 | D | pattern | contradicted | themes/slots: UI-74 "uso quello scuro" defers themes; no slots in code | UI-74 |
| UI-67 | D | pattern | partial | autosave for ticks; Save for definitions | UI-37 |
| UI-68 | D | pattern | built | Nutrients single macro bar | UI-55 |
| UI-69 | D | pattern | partial | principle, unmeasurable | — |
| UI-70 | v2 | screen | built | WaterRow.tsx, profilo/cestino, export | UI-91 |
| UI-71 | v2 | pattern | built | EntryRow actions, Annulla | UI-37 |
| UI-72 | F | screen | future | offline gym | — |
| UI-73 | D | pattern | partial | data matrix; 7 gaps listed | — |
| UI-74 | D | pattern | built | v2 photographed; gallery /kit | UI-79 |
| UI-75 | D | screen | partial | combined score chip; skyline in features/day/score, not kit | UI-03, UI-102 |
| UI-76 | D | screen | built | Swipe week, no arrows; mouse arrows in UI-98 | UI-87, UI-98 |
| UI-77 | D | screen | partial | rail + DayPart.tsx headers; empty-time dashed bar unverified | UI-86 |
| UI-78 | D | pattern | partial | tinted panel in kit.css; "everywhere" unverified | UI-99 |
| UI-79 | D | pattern | built | backdrop kit.css:1731 | UI-17, UI-83 |
| UI-80 | D | screen | built | WeatherCard.tsx levels remembered | UI-99 |
| UI-81 | D | pattern | built | glyph.ts meal icons distinct | UI-82 |
| UI-82 | D | pattern | built | own drawings in icons.generated.ts | UI-81 |
| UI-83 | D | pattern | built | silhouette rules in kit.css | UI-20 |
| UI-84 | D | pattern | built | per-box children check in ui-audit; head rule in Box | UI-91, UI-99 (overflow recurring) |
| UI-85 | ? | screen | partial | water compact, kcal of sessions/steps; "?" unresolved | UI-91 |
| UI-86 | D | screen | built | Il giorno two levels in DayView | UI-80 |
| UI-87 | D | screen | built | RangeNav + Swipe in kit | UI-76, UI-98 |
| UI-88 | F | screen | partial | /kit gallery exists (app/(app)/kit/page.tsx); status F stale | UI-89 |
| UI-89 | D | screen | built | fixes closed | UI-88 |
| UI-90 | D | pattern | built | NavBar.tsx, ⊕ floating | UI-60 |
| UI-91 | D | screen | built | WaterRow under week | UI-85 |
| UI-92 | D | screen | built | ?area= in aggiungi | UI-90 |
| UI-93 | D | screen | built | Corpo Diario "Allenati" | UI-90 |
| UI-94 | F | screen | partial | step 5 map D mostly built (UI-95..97); status F stale | UI-95 |
| UI-95 | D | screen | built | [area]/andamento routes | UI-94 |
| UI-96 | D | screen | built | [area]/cibo/[id], pasto, esercizio pages | UI-36 |
| UI-97 | D | screen | built | /profilo, tipi, cestino | — |
| UI-98 | D | pattern | built | Swipe.tsx hover:hover arrows | UI-76 |
| UI-99 | D | screen | built | weather card padding | UI-78, UI-84 |
| UI-100 | v2 | pattern | built | kit List.tsx | UI-41 |
| UI-101 | v2 | screen | built | whole row opens tracker | UI-40 |
| UI-102 | v2 | screen | built | score chip responsive | UI-75 |
| UI-103 | ? | pattern | not-built | visual rounds Palestra, Cibo...; open question | UI-74 |
