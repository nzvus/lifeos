# orca — every thing he knows, in four tables (Z4, ADR-0064)

The **ORCA** tables of OOUX: **O**bjects, **R**elationships, **C**alls to action (`actions.md`),
**A**ttributes. Cards, places, the engine and navigation are **derived** from them, never drawn one
by one (method §2). Rows are written in round 1 (stop A: his word on them), then changed only
through a change whose proposal names its **ORCA cells**. `check.py` reads the schema below and
fails a PR that breaks it; a table with no rows is not checked yet.

Rules: one row per thing; IDs never reused (`OBJ-nn`, `REL-nn`, `ACT-nn`, `ATT-nn`, next free
number); names are his words (product.md §3); every row has its **Source** (his words and date,
or a spec ID). Status: ✓ built · ◐ partly · ○ decided, not built · ✗ to remove.

## objects.md — `| ID | Name | What it is | Form | Class | Key | Status | Source |`
- **Form**: `voce` (logged in time) · `object` (a catalog thing, reused) · `signal` (computed:
  a voto, a stima, a trend) · `reference` (what a number is judged against: fascia, obiettivo,
  target) · `part` (inside a voce or an object: a riga, a serie) · `frame` (a span things are
  read over: giorno, parte del giorno, periodo; MOD-56) · `place` (a preset of the two spaces,
  reframe §3).
- **Class** (MOD-57): intake · activity · state · measurement · exchange · note · context, or `—`.
- **Key**: the registry key in code (`eslint/type-keys.json`), several with `,`, or `—`.
- Checked: every registry key has a row; a `voce` or `object` row ✓ or ◐ has keys that exist.

## relationships.md — `| ID | From | Relation | To | How many | Source |`
- **From**, **To**: OBJ IDs. **Relation**: made of · contains · refers to · derived from.
  **How many**: `1`, `0..1`, `0..n`, `1..n`.

## actions.md — `| ID | Object | Action | Where | Source |`
- **Action**: log · plan · change · skip · start from · merge · archive · filter · drill ·
  compare · why. **Where**: in place — the card, row or instrument it is done on; never ⊕ and
  never a page of its own (his 20 Nov, proposal §112–§113).

## attributes.md — `| ID | Object | Attribute | Reading | Question | Instrument | Level | References | Data | Source |`
- **Reading** (MOD-57): amount · time · rating · done · category · presence · composition · score.
- **Question** and **Instrument** (bars-study §21.3): reach → bar · prediction → fan · trend →
  line · yes/no → cells · rhythm → rail · stock → tank · comparison → ghost · composition → parts
  · source → rows · spread → band · verdict → skyline; a name or a note → word.
- **Level**: 0 · 1 · 2 (VIS-70). **References**: target, fascia, goal, past self, mean, record, or
  `—`. **Data**: ✓ ◐ ○ ✗ in his export.
