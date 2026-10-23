---
name: dossier
description: Design one lifeos v2 domain whole before its code changes - research, audit of the developer's data, model, experience, acceptance tests - as docs/spec/v2/dossiers/<domain>.md. Use when the user says "dossier", or a request changes how a domain measures, advises or collects data.
---

# Dossier for one domain

The method and the sections are in `docs/spec/v2/method.md`; read it first,
then only the spec pages the domain touches (`engines.md` sections,
`kinds.md` rows, the domain's code).

1. **Gather the complaints:** every line about the domain in
   `~/Syncthing/Documents/Projects-artifacts/LIFEOS/considerations*`, quoted
   briefly, and the open items in ROADMAP.
2. **Today:** read the v1 and v2 code that implements it; write what it does
   in plain words with file paths. Audit the refined export
   (`LIFEOS/export-2026-10-16/…-refined.json`) with a short script in the
   scratchpad: counts, distributions, gaps. Never send the export anywhere.
3. **Evidence:** search guidelines first (ACSM, EFSA, WHO, ISSN, NSCA…), then
   meta-analyses, then single studies. Each claim: source link + strength.
   Note disagreements instead of picking silently.
4. **Data, Model, Experience, Edge cases:** as method.md says. Formulas with
   units; the aggregation tree as a short list (entry → day → week → goal).
5. **Acceptance tests:** at least five, from the developer's own days.
6. **Questions:** only the developer's decisions, each with a
   recommendation.
7. Run `python3 scripts/check.py`, add the dossier to ROADMAP step 5, open a
   docs-only PR and **STOP** for the developer's review.

Write it in English (the docs' language); talk to the developer in Italian.
Keep it under ~250 lines: detail that no slice needs stays out.
