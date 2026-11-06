# Change 2026-11-06-tracker — the tracker onto the registry's generic pieces (phase 4, step 2)

**Why.** Phase 4 (approved 6 Nov): «il tipo più semplice (abitudine/tracker)» first, each type
change deleting its bespoke pages. His words: «vai avanti senza chidermi conferme per ora»
(6 Nov) and «vai» (6 Nov) for this change.

**What.** The tracker (MOD-01: «a user's own tracker is a row with the same shape»; registry
type `tracker`, area Oggi, stored in `kinds`) uses the generic pieces instead of its page in
Profilo:
1. `core/verbs`: `readObject` / `listObjects` read a tracker; `act edit` renames it (undo: the
   old name). PAT-24.
2. Its page is the generic ObjectPage at `/oggi/tracker/<id>` (PAT-04, PAT-30): its name
   editable in place (PAT-13, for every type), what it is, its fields, «Andamento», Archivia /
   Ripristina with «Annulla».
3. `/oggi/tracker/nuovo` (PAT-11) is its create form: the tracker's own fields editor
   (`TrackerForm`, its specialisation, PAT-61), then its page.
4. Oggi · Elenco gets a «Tracker» section (`Elenco`, PAT-43) with «Attivi · Archiviati» and
   «+ Nuovo tracker».
5. `/profilo/tipi` is deleted (redirected to Oggi · Elenco); its archive action goes (one
   archive path fewer).

**Decided by the agent** (inside the spec): the abitudine is a blocco (MOD-30, PL-03), so it
moves with the Piano change, where every blocco moves; the name of every catalog object becomes
editable in place on the generic page (PAT-13 «taps a value»).

**Not in this change.** Editing a tracker's fields after creation (its kind's schema: entries
already logged with them; a question for later, not asked now); abitudini; the Andamento page.

**Count (PRD, each PR counts):** pages −1 (`/profilo/tipi`), archive implementations −1.

**Stop.** None inside his «vai avanti»; questions, if any, written here and asked at the end.
