---
name: compress
description: Audit and compress project documentation - remove stale info, deduplicate, shrink ARCHITECTURE.md back under budget, verify docs match code. Use when docs feel bloated/stale or the user says "compress".
---

# Documentation Compression

Goal: maximum information density, zero staleness. Docs exist to be READ by
future sessions cheaply.

1. **Audit:** for each root doc and `docs/` file, check against the actual
   code: stale? duplicated elsewhere? never referenced? Report findings as
   a short table before changing anything.
2. **Propose, then act** (get approval for deletions):
   - `ARCHITECTURE.md` over ~150 lines → rewrite to current-state-only;
     rationale that leaked in moves to (or is discarded in favor of) ADRs.
   - Duplicated knowledge → keep one canonical location, link from others.
   - Obsolete content → delete (git history is the archive; say so).
   - A doc nobody reads → propose deleting the whole file.
3. **Never compress ADRs** — they are append-only history. A wrong ADR gets
   a superseding ADR, not an edit.
4. Finish with one metric: total doc line count before → after, and one
   sentence on what future sessions will now load less of.
