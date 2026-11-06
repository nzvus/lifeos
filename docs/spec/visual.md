# lifeos — visual (how things look, once)

Status: **approved structure (ADR-0061); visual rules decided as cited.** Folds October's visual language
(`v2/shapes.md`, `icons.md`, `kit.md`, `design-register.md`, `dossiers/visual.md` §2–§4, `content.md` §1,
§3, ADR-0058). IDs `VIS-nn`; behaviour is `patterns.md`, only cited. «Today» = code on 6 Nov. His words
are quoted where a rule is his pick; «agent» = a choice he delegated («le scelte falle tu», 30 Oct).
Criteria: `dossiers/visual.md` §2 (contrast 4.5:1 / 3:1, read in 3 s, one hierarchy, decoration only
with meaning, one datum one form, kit only). Fold table: `audit-2026-11/fold-ui-prod.md`.

## 1. Tokens and theme
- **VIS-01** Dark first, one theme: `packages/kit/styles/tokens.css` holds `[data-theme="dark"]` (the
  reference: every screen drawn, photographed and judged in dark) and `[data-theme="light"]` (kept, not
  judged); the device picks, `localStorage.theme` overrides; no new themes, slots or density for now.
  [UI-74 «poi i vari temi possiamo vederli dopo, uso quello scuro io e basta», PRD-28, x14] — Today: built.
- **VIS-02** A page picks a level, never a size (PAT-80). `kit.css :root`: space `--sp-1…6` =
  4·8·12·16·24·32; corners `--r-mark` 4 · `--r-control` 8 · `--r-row` 12 · `--r-card` 16 · `--r-sheet` 20
  · `--r-pill`; concentric = outer − padding, ≥ 4; rules 1/1/2, `--ring` 2; `--shadow-1` only on sheets
  and menus. [UI-19, UI-25, S1, L1–L3] — Today: built in the kit; inline sizes in pages (partial).
- **VIS-03** One colour per meaning: status `--herb · --warn · --tomato` (VIS-20); area hue `--fam` via
  one class `fam-*`; `--macro-*`, `--moment-*`, `--muscle-*`, `--heat-*` (VIS-52), `--air-1…6`. A kind's
  shade fixed by kind, never by position; numbers in `--ink`, colour says state. `contrast.test.ts`:
  text 4.5:1 on paper, sheet, every 7 % tint; an area hue 3:1, only on large titles and icons.
  [UI-27, UI-50, UI-59, S2, T4] — Today: built.
- **VIS-04** Surfaces: L0 page (no frame, 16 px gutter) · L1 sheet (top corners 20, the only shadow,
  grabber, dims the page) · L1′ sub-page («‹ parent») · L2 section = **colour separates**: tinted 7 % by
  its area, no frame or rule, title 19 in the area hue, padding 12, 8 px between sections · L3 card (16,
  1 px outline, 12/16) · L4 row (12, 8/12) · L5 control (8, 44) · L6 mark. No card in a card. [UI-18,
  UI-78 «il 3 è più bello chiaramente», «ricordati del padding tra le schedine», CONTRA-01] — Today: built.
- **VIS-05** Target sizes (rule: PRD-12): `--touch` 44; `--touch-dense` 36 only inside a 44 px row (act
  pills, chips, water +250/+500); calendar cells ≥ 36 × 46 at 320 px; rail 20 wide. Every box fits at
  390/360/320 and at 360 px with 120 % text. [UI-19, UI-59, UI-84, UI-89 agent, V7] — Today: built
  (10 targets under 44 at 390). Open: PRD-12 says never under 44.

## 2. Type and numbers
- **VIS-10** Barlow for text, Barlow Condensed for titles and numbers; `--fs-d1…d4` 30/24/19/16,
  `--fs-b1…b3` 16/14/12, `--fs-hero` 40; 14 meta, 12 help/marks/axes, nothing under 12; a title gives
  way with an ellipsis, never under 4 em. [UI-19, S3, L4, UI-84, UI-89] — Today: built in tokens; partial
  in pages.
- **VIS-11** A number's look (all through `F`, PAT-50): decimal comma, thousands dot, «−»; decimals by
  unit (kg 1, g 1 under 100 else 0, kcal 0, € 2); non-breaking space before the unit; «103 / 159 g»; +
  only for a change; ≈; «7–9 h»; timers «1:35», else «6 h 02», «55 min»; sleep h:mm; dates from ISO
  («Gio 29»); 24 h only (PRD-17); periods «7 giorni · 30 giorni · 90 giorni · Mese · Scegli». No icon
  before a number, no number without its word and unit. [UI-44, UI-11, UI-89, V1] — Today: built.

## 3. Status tones and judgement marks
- **VIS-20** `--herb` good or primary · `--warn` attention · `--tomato` error or destructive. A page
  passes a state (`good · warn · bad · danger · info · muted`), `F.tone` colours it; never colour alone:
  also a mark, word or shape. [UI-47, UI-59] — Today: built.
- **VIS-21** One mark for the voto scale (MOD-43): ≥ 70 filled dot, herb, «raggiunto» · ≥ 40 half dot,
  warn, «in parte» · < 40 ring, tomato, «non raggiunto» · none: no mark. `F.cap` (over max bad, > 85 %
  warn), `F.reach`; only `F.judge` compares with 70/40. [UI-47, S10] — Today: built.
- **VIS-22** Previsto · fatto · saltato is the box's shape, never an icon: previsto outline 45 % +
  hatch; fatto solid; saltato struck. [UI-15, UI-20, UI-59, S5] — Today: previsto built; struck not built.
- **VIS-23** Provenance pills (12 px): «stima», «da confermare» (from a label, or an assumed value of
  MOD-12 — agent), «modificato» (the herb dot, VIS-86), the source; at most one, the strongest.
  [UI-48, UI-15] — Today: partial (3 places).

## 4. Icons and Glyph
- **VIS-30** A page never names an icon: it passes data and `Glyph` resolves — control role / nutrient /
  section → his choice → tag → item data → subcategory or kind → domain → place. Tabler 3.19 (24 grid,
  2 px, round caps) + lifeos drawings, one `icons.json` → `icons.generated.ts`; hue always the domain's;
  one drawing, one meaning (`glyph.test.ts`). [UI-13, UI-27, S9] — Today: built.
- **VIS-31** Sizes xs 12 (pills) · s 16, tile 28 (parts, rail) · m 18, tile 32 (row badges) · l 28, tile
  48 (headers) · xl 64, tile 96 (empty states) · bg 320 (backdrop); stroke thins with size. A badge sits
  on the title's first line; gaps 8 and 4; sub-line indent 40; never a glyph alone (text or aria).
  [UI-16] — Today: built.
- **VIS-32** An icon on every item, before every title: bare in a row, in the domain hue; a filled tile
  only where the row is a button; header glyph size l (24 on sub-pages). [UI-79 «le icone le voglio»,
  UI-81 «questa volta mi fido del tuo consiglio», UI-83, UI-17, UI-50] — Today: built.
- **VIS-33** An ingredient by its food group (18); a meal by its dish, else its main ingredient; an
  exercise by its movement (36), equipment as the one corner mark (food: frozen, enriched, canned).
  Meal roles drawn apart: colazione cup on saucer, pranzo plate with cutlery, cena deep plate with moon,
  spuntino bitten biscuit. Parts in a line (tiles 28, «+N» past 8). Macros: proteine biceps, grassi nut,
  carboidrati wheat, fibre leaf, acqua drop. [UI-14, UI-15, UI-30, UI-50, UI-81, UI-82 agent]
  — Today: built; colazione and caffè share a cup (redraw).

## 5. The Box
- **VIS-40** One Box for every item (PAT-12: whole surface). Head = icon · title · value or score chip ·
  at most one short action; more, or a long one, on their own line bottom right. One line per row,
  details on open; `card` (L3) or `row` (L4). Inside by family: Nutrients L0 (food), muscle strip
  (training), need bar (water). [UI-26, UI-29, UI-30, UI-33, UI-84 «il tasto di aggiunta dell'acqua ha
  sempre sbordato e non te ne sei mai reso conto»] — Today: built.
- **VIS-41** Silhouettes (L3/L4, from the registry) change only corners, rims, corner bites — pranzo
  double rim, colazione cup, spuntino bite, cena three rims, sonno moon bite — never padding or a side;
  none where it breaks the row. [UI-79 «certe sagome rompono un po' troppo», UI-83 agent, CONTRA-03;
  supersedes UI-20] — Today: built.
- **VIS-42** The box drawing (`k-art`): free bottom-right corner, only in boxes with lines under the
  head, never under words or in dense rows; turns in once on load; on open grows ≈ 1.9× into a richer
  cousin. [UI-50, UI-79 «mi piacevano anche i disegni in sfondo con animazioni… ripensa a come
  posizionarle», UI-83, S6] — Today: built.
- **VIS-43** Score chip (look of PAT-52). Closed: unframed skyline coloured by band + number + word, one
  line under the head (the action if known, else the costliest part). Open: one ruler per criterion
  (VIS-52), skyline small in the head (width = weight, fill = score, dashed at 70). ≤ 360 px: number and
  word only; the number said once. [UI-03 «graficamente fanno schifo», UI-75 «a livello informativo
  meglio 1 e 3, una combinazione?» → agent, UI-102 «non vedo bene la miniatura delle valutazioni»,
  UI-89] — Today: built in `Box`; skyline in `features/day/score.ts`, not the kit (partial).

## 6. Nutrient bar and zones ruler
- **VIS-50** One `Nutrients`, one shape {eaten, planned, band, target, state}: L0-box (four thin macro
  bars, whole grams) · L0-ribbon · L1 (every nutrient, macro accordions) · L2 (foods × kinds). Macros
  split by kind in fixed shades; planned hatched; the target a moving tick; sugars, saturated, salt named
  by the icon; L1/L2 open like a Box, icons grow and tilt, a tapped food lights in every row.
  [UI-68 «tutte le barre dei macro… un unico tipo», UI-50, UI-55, UI-31, UI-02, D5] — Today: built.
- **VIS-51** Bars by meaning, none hand-drawn: track (`--track` 6, `--tick` 2) · segments (`--segs` 8,
  1 px gaps) · skyline · time rail (VIS-60); full width. [UI-23, UI-64] — Today: built (skyline: VIS-43).
- **VIS-52** Zones «nella stessa barra… attaccata e sottile»: fill eaten, then planned hatched; under it a
  thin ruler with every zone and the grams at each change; the tip in its zone's colour (his «C + D»,
  25 Oct): `--heat-good` · `--heat-fair` · `--heat-bad` · `--heat-danger` hatched. A limit ticks the
  week's mean; guideline kinds (free sugars, saturated, trans, ω-3/6, inulin) on their own scale; the
  word («ottimo», «ok», «pessimo», «da evitare») judges eaten + planned, «→» when the plan counts.
  [UI-32, UI-65, UI-03, D1, memory heat-strip-design] — Today: built.

## 7. The day view (Oggi and every Diario)
- **VIS-60** Time rail: a thin coloured column, 20 px with vertical times, 64 px expanded with horizontal
  times and icons; bar 4 wide in the domain hue, on `--t-box`; it gains space, never takes it. [UI-50
  «una verticale colorata… con gli orari in verticale molto molto snelli», UI-77 «no, il tuo consiglio
  non mi piace», CONTRA-02, c13] — Today: built.
- **VIS-61** Parts of the day: full-width sky bands (mattina … notte) from his meal-role bounds (MOD-60),
  sun on the arc, moon at night, rising once; they cut the rail; drawn only when begun or holding
  something; empty passed parts merge into «niente». «Fine giornata» closes; untimed things below as
  cards. A role's meals grouped only if adjacent and ≤ 60 min apart. [UI-77 «per i separé volevo delle
  barre con disegni» → agent, UI-89, UI-42] — Today: built (`DayPart`).
- **VIS-62** Empty time ≥ 2 h passed: «una barra grigia sottile tratteggiata… se toccata può essere
  riempita», offering «+ <the missing meal>» or «+ aggiungi» (PAT-10, MOD-51). [UI-77] — Today: built
  (`EmptyTime`), not photographed since 30 Oct.
- **VIS-63** Week strip (look of PAT-54): on touch no ‹ › or «Oggi» button — swipe a week, the title
  opens the month, today a ring, «↩ oggi» only when away. Levels: 0 days · 1 thin bars under each number
  (per area) · 2 each day's 24-hour column (96 px, guides 6/12/18, now red). With a mouse small ‹ › and
  ← →; month and Andamento's period alike. [UI-76 «com'è attualmente in v2 è il migliore, al di là
  delle frecce…», «questo è il migliore», UI-87, UI-93, UI-98, D3] — Today: built.

## 8. Levels of expansion
- **VIS-70** A piece with levels 0…n (`useLevel`): a tap goes to the next, after the last back to 0;
  three dots say the level; remembered per piece (localStorage). Weather, «Il giorno» (0 four thin bars,
  1 every nutrient), the week. [UI-80 «al massimo facciamo più gradi di espandibilità… che viene
  ricordata nelle aperture delle pagine», UI-82, UI-86 agent] — Today: built. Open: PRD-19 says two
  levels at most; weather and week have three.

## 9. Weather
- **VIS-75** 0 a line in the date row · 1 the card (animated drawing, temperature trace) · 2 hours, air
  (EEA's six `--air-*`, ringed), sun arc. Tokens only; a box's padding 12 × 16 and radius; 8 px between
  blocks; never stored (x11). [UI-80 «b con a in espansione», «ricordati di fare padding», UI-99 «il
  meteo ha ancora un pessimo padding con le altre schede», D4, S15] — Today: built.

## 10. Backdrops
- **VIS-80** The page's domain glyph, 320 px, stroke 1, 6 %, top right, cropped, behind header and date,
  never under text; it scrolls away (UI-79 supersedes UI-17's sticky cross-fade). [UI-79, UI-17,
  CONTRA-03] — Today: built.

## 11. Controls (look only; what they do: `patterns.md` §2, §6)
- **VIS-85** Primary filled herb (one per screen, PRD-14; ⊕ counts) · secondary ink outline · link herb
  «›» in a section title, 44 px · act round 36 in a row · icon 44 with aria label; pressed 1 px down +
  10 % ink, focus ring, disabled 40 %, busy spinner. Segmented ≤ 4 short options, else drop-down; chips
  ink when on; tabs text with a 2 px tick; ⊕ the only filled circle. [UI-21, UI-22, UI-33, UI-89, UI-90,
  S8] — Today: built as classes (no `Button`).
- **VIS-86** Fields: label 4 above, help 4 below; 44 high; error turns frame and help tomato; edited by
  him = herb dot + base value with «↺». [UI-24] — Today: built (`Field`).

## 12. Motion
- **VIS-90** One timing `--t-box` ≈ 0.5 s on `--ease` for every open and close, nothing on its own clock;
  motion explains (bars grow, accordions open, the rail widens, drawings turn in once);
  `prefers-reduced-motion`: off or a switch. [UI-28, UI-50, S17] — Today: built.
