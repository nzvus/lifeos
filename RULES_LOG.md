# Rules log: where the rules failed

Where CLAUDE.md, a rule file (`.claude/rules/`), a skill or a guard misled Claude or had to be repeated by the user. Any session appends 0–3 lines under **Open** when that happens; `/tune-rules` turns recurring ones into rule changes and moves them under **Applied**. (Idea from the study vault's RULES_LOG.md, via fleet P-007.)

Entry, one line: `- YYYY-MM-DD · <CLAUDE.md|rule|skill|guard> · <what went wrong or was repeated> · evidence: <his words, a review finding, a failed check> · idea: <possible fix>`

## Open
- 2026-11-12 · CLAUDE.md · reports to the user were lists of PRs, Q-ids and gates; the one action he had to take was lost · evidence: «i do not understand what hsould i do», then «what?» · idea: «Keep the user informed» adds: when the user must act, end with one «Your next step» in plain words (memory one-step-at-a-time).
- 2026-11-12 · CLAUDE.md · Claude suggested `! cat ~/.config/lifeos/backup-key.txt` to copy the key: the `!` output lands in the chat, so the secret went into the transcript · evidence: the key printed in the 12 Nov session · idea: a line «never route a secret through the chat (`!` output is in the transcript): tell the user to open the file themselves».
- 2026-11-12 · guard · two PRs open at once each kept CLAUDE.md within its 130-line budget, together 133: check.py would have failed main after both merged · evidence: #348 + the process-diet branch · idea: when two branches touch a budgeted file, check the sum (or keep the edits on one branch: «few PRs»).

## Applied
