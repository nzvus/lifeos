# How v2 is built — dossiers, then slices

Decided 2026-10-23, from the developer's considerations of 2026-10-22: «la
pianificazione, design e esecuzione del progetto deve avere uno sguardo
critico e scettico… tutto provato e comprovato su basi scientifiche o standard
di settore… un'analisi dissezionata e verticale su ogni singolo aspetto».
Until then v2 grew in breadth (#219–#246, one thin slice each): screens
existed, but the rules behind them (gym advice, progress, steps) were v1's,
carried over unexamined. From now on a domain is designed whole before its
code changes.

## The cycle, per domain
1. **Dossier** (`docs/spec/v2/dossiers/<domain>.md`, skill `dossier`): one
   session, research included. Ends with the open questions.
2. **Review by the developer**: the dossier is a target, approved as the v2
   target was. Design choices inside it stay the agent's
   (memory "design review delegated"); what changes data, formulas or what
   is collected is the developer's.
3. **ADR** when the outcome is expensive to reverse (schema, a formula many
   things read, an external service).
4. **Slices**, test-first: the dossier's acceptance tests become unit tests
   on the engines before any screen.
5. **Phone check on the developer's data**, then the domain's line in
   ROADMAP is closed and `engines.md` / `kinds.md` updated to the dossier's
   outcome (the dossier stays as the why).

Small fixes and requests that change no rule (a button, a label, a saved
estimate) skip the dossier: they go straight to a slice.

## A dossier, always the same sections
1. **Question** — what the domain must answer for the person, in their words.
2. **Today** — what v1 and v2 do, file by file, and what the developer's
   data says (an audit on the refined export: counts, gaps, odd values).
   Every complaint from `considerations*.txt` placed here.
3. **Evidence** — literature and standards, each claim with its source (DOI
   or URL) and its strength: guideline / meta-analysis / single study /
   convention / opinion. Where sources disagree, say so.
4. **Data** — what to collect, how (typed, timed, derived, imported), at what
   precision, from which sources, how sources converge when they disagree
   (E11 data quality), how long it is kept.
5. **Model** — the formulas and the aggregation tree: what feeds what, from
   the entry (L0) to the day, the week and the goals (L1/L2), naming the
   engines (E1–E11) it changes. Units and ranges.
6. **Experience** — what the person sees and touches, on the phone first;
   which kit parts; empty, partial and wrong-data states.
7. **Edge cases** — missing data, one-off days, travel, illness, changed
   equipment.
8. **Acceptance tests** — concrete inputs → expected outputs, from the
   developer's own days where possible.
9. **Questions for the developer** — only what is theirs to decide.

## Using Claude Code
- **One session, one unit:** a dossier, or one slice, or one batch of small
  fixes. A slice of several files starts in plan mode.
- **Research** runs in the main thread (WebSearch, reading the papers'
  abstracts and guidelines). Parallel agents only for a wide literature
  sweep, at most 2–3: each starts cold and costs a whole context.
- **Skills:** `dossier` (this page's sections), `adr`, `retro` at the end of
  a domain, `compress` when a spec file passes ~250 lines.
- **Tests and deploys** as CLAUDE.md says: targeted tests locally, the full
  suite in CI; one PR per theme.
- **Handoff** in `~/.claude/plans/` only when a session ends mid-work; the
  state otherwise lives in ROADMAP and the PRs.
- **Budget:** a dossier ≈ one session, a slice ≈ one session; measured at each
  retro and corrected here.

## Order (2026-10-23)
1. Training: progress, rests, warm-ups, auto mode, session length,
   coherence across exercises, the context of each session.
2. Movement: routes and trips in the library, the day's movement bands,
   instead of the imprecise steps.
3. Day templates and routines (Piano): for every domain, not only the gym.
4. Energy expenditure, then micronutrients, then meal roles and the pre/post
   workout tags (E1's open question).
