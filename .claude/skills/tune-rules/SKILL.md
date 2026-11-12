---
name: tune-rules
description: Turn recurring entries of RULES_LOG.md (and rules the user keeps repeating) into evidence-based changes to CLAUDE.md, .claude/rules, a skill or a guard; apply only after he agrees. Use when he says "tune the rules", when /retro finds two or more alike entries, or when he repeats a standing rule.
---

# Tune the rules

Open entries:
!`sed -n '/^## Open/,/^## Applied/p' RULES_LOG.md`

## Principles
- Change rules only from evidence: an entry above, his words (inbox, a change's proposal.md), a review finding, a guard or check failure. A taste or a guess is not evidence.
- A pattern needs two occurrences, or one if serious (data lost, a rule contradicting another, a spec ID broken).
- Replace or sharpen a rule; do not add one. CLAUDE.md has a line budget (`scripts/check.py`): say what a growing rule absorbs, or move detail to a path-scoped file in `.claude/rules/`.
- If a rule can be checked mechanically, propose the check too (`scripts/check.py`, a guard in `scripts/hooks/guard.py`, a lint rule).
- Spec files change only through a change folder (PRD-41).

## Steps
1. Group the entries into patterns; for each, quote the rule that should have prevented it, or say none exists.
2. Propose a numbered list: pattern, evidence (count + two examples), exact change (old → new), check if any, expected effect. Also what you decided not to change and why. Stop and wait.
3. Apply the approved changes; run `python3 scripts/check.py`.
4. Move the addressed entries to **Applied** with a `change:` part. Report what changed and what stays open.
