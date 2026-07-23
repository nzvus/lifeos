---
name: adr
description: Run a structured decision process and record it as an ADR in docs/decisions/. Use when a significant (expensive-to-reverse) technical decision is being made, or the user says "adr" / "let's decide X".
---

# Decision Process → ADR

1. **Frame:** state the decision as a question and confirm it with the
   developer. Read `PROJECT.md` (constraints, invariants, learning goals)
   and any related prior ADRs. If the decision is actually cheap to
   reverse, say so and suggest skipping the ADR.
2. **Research:** if current ecosystem knowledge matters, search the web for
   the present state of the options (docs, benchmarks, adoption). Label
   each claim: official recommendation / industry convention / opinion.
3. **Options:** present 2–4 options with honest pros/cons AND a
   recommendation with reasoning. Weigh the developer's learning goals as a
   real factor, not just technical merit.
4. **STOP.** The developer decides. Answer follow-ups; do not proceed
   without an explicit choice.
5. **Record:** write `docs/decisions/NNNN-<slug>.md` from `0000-template.md`
   (next sequential number). Leave "What I learned" empty — prompt the
   developer to write it in their own words, and wait.
6. **Propagate:** update `CLAUDE.md` project block / `ARCHITECTURE.md` /
   `ROADMAP.md` if the decision changes them. One commit:
   `docs: ADR-NNNN <title>`.
