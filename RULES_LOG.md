# Rules log: where the rules failed

Where CLAUDE.md, a rule file (`.claude/rules/`), a skill or a guard misled Claude or had to be repeated by the user. Any session appends 0–3 lines under **Open** when that happens; `/tune-rules` turns recurring ones into rule changes and moves them under **Applied**. (Idea from the study vault's RULES_LOG.md, via fleet P-007.)

Entry, one line: `- YYYY-MM-DD · <CLAUDE.md|rule|skill|guard> · <what went wrong or was repeated> · evidence: <his words, a review finding, a failed check> · idea: <possible fix>`

## Open
- 2026-11-12 · CLAUDE.md · reports to the user were lists of PRs, Q-ids and gates; the one action he had to take was lost · evidence: «i do not understand what hsould i do», then «what?» · idea: «Keep the user informed» adds: when the user must act, end with one «Your next step» in plain words (memory one-step-at-a-time).
- 2026-11-12 · CLAUDE.md · Claude suggested `! cat ~/.config/lifeos/backup-key.txt` to copy the key: the `!` output lands in the chat, so the secret went into the transcript · evidence: the key printed in the 12 Nov session · idea: a line «never route a secret through the chat (`!` output is in the transcript): tell the user to open the file themselves».
- 2026-11-12 · guard · two PRs open at once each kept CLAUDE.md within its 130-line budget, together 133: check.py would have failed main after both merged · evidence: #348 + the process-diet branch · idea: when two branches touch a budgeted file, check the sum (or keep the edits on one branch: «few PRs»).

- 2026-11-15 · CLAUDE.md · «Wait for CI in the background» broken four times in one session: `gh pr checks --watch` run in the foreground to have the result before replying · evidence: «ti avevo detto che dovevi farle in background… non segui mai le regole che ti imponi?» · idea: a PreToolUse hook that blocks `gh pr checks … --watch` and `gh run watch` unless `run_in_background` is set.
- 2026-11-15 · skill · `verify` had no step «open it in his browser», so the memory open-in-browser was skipped twice · evidence: «you did not write doen that rule apparently» · applied the same day: verify step 6 + CLAUDE.md line (PR #360).

- 2026-11-17 · CLAUDE.md «ap» · under «ap yc» Claude ended two turns «waiting for CI» and parked approved work as «UI, for Sonnet» · evidence: «do not wait for ci, i repeted this to you many times… i said "ap yc" so you should not stop» · idea: a Stop hook that, when the last user message is «ap»/«ap yc», refuses a final reply that says «waiting for CI» while a background CI task runs.

## Applied
- 2026-11-14 · `.claude/rules/design.md` (new, always loaded) · each session drew from a summary and dropped the agreed v2 look and kit pieces; two artifact pages rejected · evidence: «why you are continueing to ignore all the discussions that we had for v2», «il modo in cui stiamo lavorando è sbagliato» · applied by his «yc»: one page of what v2 decided, no separate drawings, one screen at a time, yc/ap never cover design.
