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
