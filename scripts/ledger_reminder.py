#!/usr/bin/env python3
"""SessionStart hook: remind every session to read the ledger first and list what is still open.

The developer, 30 Oct: «molte scelte… ogni volta te le dimentichi». Prints the hook JSON that
Claude Code injects as context: the rule, the open contradictions, the count of open lines.
"""
import json
import re
from pathlib import Path

LEDGER = Path(__file__).resolve().parent.parent / "docs/spec/v2/ledger.md"

lines = LEDGER.read_text(encoding="utf-8").splitlines() if LEDGER.exists() else []
contra = [l[2:] for l in lines if re.match(r"^- \*\*CONTRA-\d+\*\* \? ", l)]
open_ids = [m.group(1) for l in lines if (m := re.match(r"^- \*\*([A-Z]+-\d+)\*\* \? ", l))
            and not m.group(1).startswith("CONTRA")]

text = [
    "LEDGER FIRST: read docs/spec/v2/ledger.md before any design or code. Cite the IDs you follow "
    "(«Ledger: UI-12, FOOD-03»); every request or opinion of the developer becomes a line at once, "
    "in his words; a changed decision is edited in the same PR.",
    f"Open contradictions ({len(contra)}), settle them with the developer, never pick silently:",
    *[f"  {c}" for c in contra],
    f"Open lines (?): {len(open_ids)} — {', '.join(open_ids)}",
]
print(json.dumps({"hookSpecificOutput": {"hookEventName": "SessionStart",
                                         "additionalContext": "\n".join(text)}}))
