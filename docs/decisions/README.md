# Decision Records (ADRs)

One file per significant decision: `NNNN-short-title.md`, numbered
sequentially, never edited after acceptance (supersede instead).

**What deserves an ADR:** anything expensive to reverse — stack, architecture
style, data model shape, protocol/API design, build & deploy strategy, major
library adoption. Rule of thumb: if changing your mind later costs more than
a day, write the ADR now.

**What doesn't:** naming, formatting, small library picks, anything a
one-line note in a commit message covers.

ADRs are the project's long-term memory AND the primary learning artifact:
the "Options considered" section is where trade-off thinking is practiced.
An agent (or future you) questioning a past choice reads the ADR instead of
re-litigating it from scratch — this is the single biggest token saver in
long-lived projects.

## Where each area stands (2026-10-15)
Several areas were decided in chains: read the last link first, then the
ones it amends only if you need the history.

| Area | In force | History it amends or replaces |
|---|---|---|
| Stack, layout, data, delivery, auth | 0001, 0002, 0003, 0004, 0006 | — |
| Log entries | 0007 (proposed), 0009, 0022, 0042 | 0011 (moments, amended by 0044) |
| A day's targets | 0040 (one engine), 0043, 0045, 0046, 0047, 0048 | 0008, 0014, 0020, 0021, 0023, 0025, 0026 |
| Expenditure | 0041, 0042, 0051 | 0014, 0020, 0021, 0026, 0030 (superseded), 0032 |
| Day programs and slots | 0044, 0046 | 0008, 0011 |
| Today and navigation | 0050, 0038 | 0033, 0035, 0036 (their tab parts) |
| Training | 0005, 0016, 0024, 0029, 0037, 0049 | 0028 (targets, amended by 0049) |
| Body | 0027, 0031, 0051 | 0030, 0032 |
| Food data, pantry, supplements | 0012, 0013, 0017, 0039 | — |
| Money | 0036 | — |
| UI and editing | 0010, 0015, 0019 | — |
| Assistant, packs, invites | 0018, 0034 | — |
| Data out and back in | 0052 | 0003 (export), 0034 (Settings import) |
| lifeos v2 (target) | 0053, 0054, 0055 (food › product › format), 0056 (v2 next to v1 in `apps/v2`) | the v1 domain models, when v2 replaces v1 |
