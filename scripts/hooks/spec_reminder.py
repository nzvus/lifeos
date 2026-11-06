#!/usr/bin/env python3
"""SessionStart hook: point every session at the spec and list what is open (ADR-0061, PRD-43).

The developer, 30 Oct: «molte scelte… ogni volta te le dimentichi». Prints the hook JSON that
Claude Code injects as context: what to read, the open change, the inbox's open items.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CHANGES = ROOT / "docs/spec/changes"
inbox = (CHANGES / "inbox.md").read_text(encoding="utf-8").splitlines() if (CHANGES / "inbox.md").exists() else []
open_items = [l[2:] for l in inbox if re.match(r"^- \*\*(Q|W)-\d+\*\* ", l)]
open_changes = sorted(p.name for p in CHANGES.iterdir() if p.is_dir() and p.name != "archive") if CHANGES.exists() else []

text = [
    "SPEC FIRST: read docs/spec/product.md, model.md, patterns.md (and the domains/ file you touch) "
    "before any design or code; cite the requirement IDs you follow (PRD-, MOD-, PAT-, VIS-, FD-, TR-, BD-, PL-, DT-). "
    "Every request or opinion of the developer goes at once, in his words, into the open change's proposal.md "
    "or docs/spec/changes/inbox.md. A spec change is a folder in docs/spec/changes/ (proposal, delta, tasks).",
    f"Open change: {', '.join(open_changes) if open_changes else 'none'}",
    f"Inbox ({len(open_items)} open, never pick silently):",
    *[f"  {c}" for c in open_items],
]
print(json.dumps({"hookSpecificOutput": {"hookEventName": "SessionStart",
                                         "additionalContext": "\n".join(text)}}))
