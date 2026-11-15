#!/usr/bin/env python3
"""Refuse a foreground wait on CI (CLAUDE.md «Wait for CI in the background», his 15 Nov:
«ti avevo detto che dovevi farle in background… non segui mai le regole che ti imponi?»).
A Bash call that watches checks or a run must set run_in_background; exit 2 tells Claude why."""
import json
import re
import sys

call = json.load(sys.stdin)
args = call.get("tool_input", {})
cmd = args.get("command", "")
# Only a command: at a line's start or after ; & | ( — never the same words in a commit message.
START = r"(?:^|[;&|(]|\n)\s*"
waits = re.search(
    START + r"gh\s+pr\s+checks\b[^\n|;&]*--watch|" + START + r"gh\s+run\s+watch\b", cmd
)
if waits and not args.get("run_in_background"):
    print(
        "Blocked: waiting for CI runs in the background (CLAUDE.md, his 15 Nov). "
        "Run this with run_in_background: true and go on working; you are told when it ends.",
        file=sys.stderr,
    )
    sys.exit(2)
