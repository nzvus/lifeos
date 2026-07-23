---
name: retro
description: Close a sprint - review outcomes against criteria, extract lessons, compress the sprint entry into ROADMAP.md Done section, and propose improvements to the workflow itself. Use at sprint end or when the user says "retro".
---

# Sprint Retrospective

1. Read the current sprint in `ROADMAP.md` and `git log` since sprint start.
2. **Review against criteria:** for each slice and the review criteria —
   met / partially / missed, with evidence (tests, working demo). Be honest,
   not congratulatory.
3. **Interview (one question at a time):**
   - What was the hardest moment and what did it teach you?
   - Where did the human/AI collaboration work badly? (too much generated
     code? unclear plans? context waste?)
   - What do you understand now that you couldn't have explained 2 weeks ago?
4. **Compress:** replace the sprint block with a 3–4 line entry in `## Done`
   (shipped / decisions / lesson / carried over). Move unfinished slices to
   backlog or next sprint.
5. **Improve the system:** propose at most TWO concrete changes — to
   `CLAUDE.md` rules, to a skill, or to the master template (remind the
   developer to log template changes in their `TEMPLATE-CHANGELOG.md`).
   Small, specific, based on actual friction from this sprint.
6. Draft the next sprint's goal for discussion. Don't finalize it in the
   same breath — planning deserves its own conversation.
