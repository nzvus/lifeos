---
name: kickoff
description: Interview the developer to fill in PROJECT.md at the start of a new project, then set up sprint 0. Use when the user says "kickoff", "start the project", or PROJECT.md is still the empty template.
---

# Project Kickoff

Run PROJECT.md as a structured interview, NOT a form-filling exercise.

1. Read `PROJECT.md`. Ask about each section conversationally, ONE question
   at a time. Push back like a senior engineer: vague pitch → ask for the
   user and the problem; missing non-goals → propose three things to cut;
   no hard invariant → dig until you find what must never be wrong (every
   real project has at least one).
2. Challenge scope: if v1 has more than 5 capabilities, help cut. If scale
   assumptions look aspirational, say so.
3. Write the answers into `PROJECT.md`, concise.
4. Fill the project-specific block at the top of `CLAUDE.md` with whatever
   is already known; leave `<...>` placeholders for post-ADR items.
5. Create the sprint-0 entry in `ROADMAP.md`: its slices are the
   foundational ADRs from PROJECT.md §5, in dependency order.
6. Do NOT start ADR analysis in the same session. End by telling the
   developer which ADR is first and what to think about before that session.
