# ADR-0010: A theme is a token set plus optional replacements for a closed list of slots, each with a default; light/dark and layout are separate per-device settings

**Status:** accepted
**Date:** 2026-09-30

## Context

The developer wants themes chosen in the settings that change not only the
palette but the widgets, graphics and overall style — explicitly allowing
**completely different components**, not only different values. Separately,
a light / dark / system setting valid for every theme, and a layout setting
(auto / desktop / phone) selectable on any device. Theming is a named kit
feature and learning objective (PROJECT.md §1–2); over-abstracting the kit
is the named cause of death (PROJECT.md §5).

State today: a theme is only colours — one `@theme` block in
`design/theme.css`, the dark palette redefines the same variables under
`prefers-color-scheme` or `data-theme="dark"`. Radius, rule thickness,
spacing and type size are plain Tailwind scale classes, so no theme can
change them. Half the components that would be themed (DayPanel,
MacroStrip, the charts) are server components, which cannot read React
context. Layout adapts with 22 `sm:`/`md:`/`lg:` uses in 8 files, all tied
to the viewport width, so "desktop on a phone" is impossible today.

## Options considered

### A. Extended tokens plus per-slot CSS, one component set
- Pros: near-zero cost; a theme is one CSS file; every component exists
  once. Components expose `data-slot` so a theme's CSS can restyle them.
- Cons: cannot change structure (bars instead of rings, side nav instead of
  tab bar) — less than what the developer asked for.

### B. A slot contract with partial overrides over a default kit
- Pros: truly different components where a theme wants them, defaults
  everywhere else; the cost is visible and chosen per slot (one component
  per override); slots only exist for components that already exist, so
  the rule of three (ADR-0002) still holds.
- Cons: a new layer (`themes/`) in the ADR-0002 dependency rules; adding a
  slot requires a default and a contract test; every override must follow
  its slot's props, so changing a slot's props touches every theme.

### C. Each theme is a complete alternative kit
- Pros: total freedom.
- Cons: every component written N times, forever; with one developer the
  second theme rots quickly. The over-abstraction PROJECT.md warns about.

## Decision

**Option B, with option A's shape tokens included.** Chosen by the
developer on 2026-09-30.

**1. Tokens.** Every theme defines colours for light AND dark plus shape
tokens: radius (`--radius-*`), density (`--spacing`, which scales every
`p-`/`gap-` utility), type scale (`--text-*`), rule thickness and chart
style (custom properties). Values stay in `design/` (ADR-0002 rule 3):
`design/theme.css` holds the token names and the default theme,
`design/themes/<id>.css` holds each other theme's values under
`[data-theme="<id>"]`. The current theme is called `label` (the EU
nutrition-label direction) and is the default.

**2. Slots.** A closed list, each with a props type (strings and numbers
only, no domain types — as `ui/` today) and a default implementation, which
is the existing component. Initial slots: `AppShell` (header + navigation),
`DayPanel`, `MacroDisplay` (strip, bars, targets), `Surface` (card /
section), `ListItem`, `Button`, `Field`, `Chart`. A theme's components live
in `src/themes/<id>/`, and `src/themes/<id>/slots.ts` overrides any subset.

**3. Resolution.** The user's theme id is read on the server with the
session and passed down as a prop, exactly like the dictionary `t` today —
one mechanism for server and client components (context would not reach
server components). Each slot is a small switch id → implementation in
`src/themes/`; non-default implementations load through dynamic import, so
the browser downloads only the active theme's code. A contract test renders
every slot of every theme with the same fixture props; a broken theme fails
CI.

**4. Layers.** `app → features → themes → ui → design, i18n`. `themes/` may
import `ui/`, `design/`, `i18n/`; `ui/` never imports `themes/`; features
render slots through `themes/` rather than importing the defaults from
`ui/` directly. Enforced by `eslint-plugin-boundaries` like the other rules.

**5. Settings and where they live.**
- Theme: per user, in the database (`user_settings.theme`, text, default
  `label`; additive migration) — it follows the user across devices.
- Mode (light / dark / system) and layout (auto / desktop / phone): per
  device, in cookies, because both are choices about a device. Read on the
  server and written as attributes (`data-mode`, `data-layout`) before the
  first paint, so the page never flashes the wrong palette or layout. A new
  device starts at system + auto. The existing `data-theme="dark"` selector
  is renamed to `data-mode`, freeing `data-theme` for the theme id.

**6. Layout variants.** Custom Tailwind variants (`@custom-variant`, e.g.
`wide:`) apply when the media query matches AND `data-layout="auto"`, or
always under `data-layout="desktop"`; never under `"phone"`. The 22
breakpoint uses are rewritten mechanically and a lint rule forbids raw
`sm:`/`md:`/`lg:` outside `design/`. Forcing a viewport width ("request
desktop site") was rejected: it covers desktop-on-phone but not
phone-on-desktop, so the variants would be needed anyway.

Decisive reasons: it gives what was asked (different components) while
keeping the cost per theme proportional to what that theme actually
changes; every slot has a working default, so a half-finished theme is
still a usable app; the contract test turns "a theme silently broke" into a
CI failure.

**Tripwires — revisit if:** (i) a theme overrides most slots — the contract
is drawn wrong, reconsider C or merge slots; (ii) after a second theme
exists, a slot is overridden by no theme — drop it back to a plain `ui/`
component; (iii) threading the theme id as a prop reaches more than a few
levels in several slices — reconsider a request-scoped mechanism;
(iv) forced "desktop" on a phone proves unusable — restrict the setting.

## Consequences

- Easier: a new theme can start as one CSS file and grow component by
  component; light/dark and layout work for every theme without the theme
  doing anything but providing both palettes.
- Harder: every override is a second implementation to maintain; slot
  props changes are multi-theme changes; feature components take one more
  prop (`theme`) where they render slots.
- Must do, in order: (1) shape tokens in `design/` and rename `data-theme`
  → `data-mode`; (2) `@custom-variant` layout variants + rewrite of the 22
  breakpoint uses + lint rule; (3) mode/layout cookies and the settings
  UI; (4) `themes/` layer, slot switches, contract test, lint boundaries;
  (5) `user_settings.theme` migration and theme picker; (6) the design pass
  on `label` (after phone + desktop screenshots). `ARCHITECTURE.md` is
  updated as each step lands, not before.
- This ADR extends ADR-0002 (adds the `themes/` layer); ADR-0002 stays
  accepted and unchanged.

## What I learned
