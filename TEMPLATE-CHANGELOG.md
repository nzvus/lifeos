# TEMPLATE-CHANGELOG.md

> Lives in your MASTER copy of the template (delete from project copies).
> After each retro or finished project: if something should have been in the
> template from day one, change the master and log it here. This file is
> your engineering playbook's growth record.

Entry format: `## vX.Y — date` / what changed / which project's friction caused it.

## v0.2 — 2026-07-23
Added `scripts/check.py` + `check.bat`/`check.sh`: deterministic repo health
check (length budgets, conflict markers, placeholder leakage, ADR validation,
broken links, skill frontmatter). Driven by the realization that agents also
edit docs and need cheap, token-free verification. CLAUDE.md now requires
running it before a slice is "done".

## v0.1 — 2026-07-23
Initial version. Files: README, CLAUDE.md, PROJECT.md (kickoff brief),
ARCHITECTURE.md, ROADMAP.md, ADR system, 4 skills (kickoff, adr, retro,
compress). Deliberately minimal: new docs/skills are added only after the
same need appears twice in real projects.

Open questions to answer through use:
- Does CLAUDE.md need per-domain variants (webapp vs game vs systems)?
- Is a `debug` or `review` skill needed, or does CLAUDE.md rule 5 cover it?
- When does CI config deserve a place in the template vs per-project ADR-0004?
