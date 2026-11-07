# Change 2026-11-07-exercise-scheda — esercizio and scheda onto the generic pieces (phase 4, step 4)

**Why.** Phase 4 (approved 6 Nov): each type moves onto the registry's generic pieces and its
bespoke pages go; after cibo and pasto comes «exercise and scheda (+ PAT-63 Timer)» (ROADMAP
«Now»). PAT-63 says the gym clock becomes the kit `Timer` «in the change "esercizio e
scheda"». Today a scheda has no page and no place in Elenco: it is only touched from a session
(«Salva nella scheda»). His words: «procedi» (7 Nov, after the retro of food-meal that named
this change as the next).

**What.**
1. **Esercizio** on the generic ObjectPage `/corpo/esercizio/<id>` (PAT-04, PAT-30): name and
   guide in place; its own sections from `extras.tsx`: its trend (TR-24) as «Andamento», its
   records (TR-23 where built), its sessions newest first, the schede that use it («Usato
   in»), its variants. «Unisci» is the kit `MergeSheet`; `nuovo` its `NEW_FORMS` entry
   (`ExerciseForm`). Deleted: the exercise page, `/unisci`, `nuovo`, its layout.
2. **Scheda** on the generic ObjectPage `/corpo/scheda/<id>`: its exercises in order, the
   estimated duration (TR-37), «Inizia» (the one primary, starts gym mode), Famiglia
   (variants); `nuovo` and `/componi` are the kit `Composer` with the exercises as lines.
   Corpo · Elenco gets a «Schede» section (PAT-43).
3. **Timer** (PAT-63): the gym clock's states and saved instants become the kit `Timer`
   (pure state machine + view, `GymClock` on it); gym mode behaves as today.

**Decided by the agent** (inside the spec):
- A scheda line is an exercise in its order, no quantity: the sets come from the proposal
  (TR-30, MOD-51), so the kit `Composer` gains lines without a stepper and a move up/down.
- The scheda's word in addresses is `scheda` (the registry's name); its key stays `routine`
  in code and data (a rename of stored keys is not worth a migration now).

**Not in this change.** TR-06 chain edit, TR-18 long-break flag, TR-20/22 comparable by
position, TR-36 incoherence checks, TR-40 «Inizia adesso» for an attività, TR-42/43; the
attività sheet; the session's own page beyond the Timer (see Q-13).

**Questions for him (asked at the end; the work goes on without them).**
- **Q-13** PAT-62 names the sessione among the Composer's types, but a session is captured
  live in gym mode (TR-07, the full-screen exception of PAT-01), not composed. (a) gym mode
  stays its own full screen made of kit pieces (`Timer`, `Box`, `Find`) and PAT-62 says
  «pasto, scheda»; (b) gym mode's exercise list becomes the `Composer` too. Agent's pick: (a)
  — composing is the scheda's job; the session follows the scheda and the Timer.

**Count (each PR counts):** pages −4 expected (exercise page, `/unisci`, `nuovo`, layout),
pages +0 for the scheda (served by the family route), merge implementations −1.

**Stop.** None inside his «procedi»; Q-13 asked at the end, moved to `changes/inbox.md` when
the change was archived.
