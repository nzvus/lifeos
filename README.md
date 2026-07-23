# AI-Native Project Starter — v0.1

A domain-agnostic skeleton for starting any software project (webapp, backend,
game, VM, plugin, tool...) with an AI agent as engineering partner.
It encodes: workflow rules, decision records, sprint cadence, and
token-efficient context management.

## How to start a new project

1. Copy this folder, rename it, `git init`, first commit.
2. Fill in `PROJECT.md` (the kickoff brief). If using Claude Code, run the
   `kickoff` skill instead — it interviews you and fills it in.
3. Delete the sections of `CLAUDE.md` marked `[TEMPLATE]` that don't apply;
   fill in the project-specific block at the top.
4. Sprint 0: make the foundational decisions (stack, architecture style,
   deployment) as ADRs in `docs/decisions/`. No code before ADR-0001.
5. Sprint 1: walking skeleton — one trivial feature end-to-end, tested,
   deployed (or packaged/runnable, for non-deployed domains).

## File map (read order for a new agent session)

| File | Purpose | Loaded |
|---|---|---|
| `CLAUDE.md` | Always-true rules & conventions | automatically, every session |
| `PROJECT.md` | What we're building & why | on demand |
| `ARCHITECTURE.md` | Current system shape (kept short) | when designing/implementing |
| `ROADMAP.md` | Sprints: planned / current / done | when planning |
| `docs/decisions/` | ADRs — one per significant decision | when a decision is questioned |
| `.claude/skills/` | Reusable agent workflows | auto-triggered or by `/name` |

Everything else (Glossary, Patterns, Known-Issues, ...) is created **only when
a real need appears twice**. Resist premature documentation.

## Health check (the deterministic guardrail)

`python3 scripts/check.py` (or double-click `check.bat` on Windows,
`./check.sh` on macOS/Linux) audits the whole repo in <1s, zero dependencies:
file-length budgets, merge-conflict markers, leftover template placeholders,
ADR format/numbering/completeness, broken doc links, malformed skills.
Agents edit docs too -- this catches what they silently break, for zero
tokens. `--strict` makes warnings fail (use in CI). Config is a dict at the
top of the script; extend it with your own checks as friction appears.
Optional: wire it as a Claude Code PostToolUse/Stop hook so it runs
automatically after agent edits.

## The meta-loop

After every project retro, if you learned something that should have been in
the template from the start, update your master copy and log it in
`TEMPLATE-CHANGELOG.md`. The template is the playbook; the changelog is
proof you're improving as an engineer, not just shipping projects.
