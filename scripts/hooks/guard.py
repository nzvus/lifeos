#!/usr/bin/env python3
"""Claude Code guards (PAT-91, PRD-41). One script, one subcommand per hook event.

  pre-edit   PreToolUse Edit|Write|MultiEdit: an edit under docs/spec/ (except changes/) is
             blocked unless a change folder is open (PRD-41: the spec changes only through one).
  post-edit  PostToolUse Edit|Write|MultiEdit: prettier --write, then eslint on the file;
             lint errors go back to Claude (exit 2).
  stop       Stop: `vitest related` on the branch's changed files, then `tsc --noEmit` in each
             touched workspace (typecheck last: vitest does not typecheck). A failure blocks the
             stop once; a state that already passed is not run again.

The user, 6 Nov: «come ci assicuriamo che ricostruendo… non abbiamo di nuovo lo stesso
problema?» (PROD-38). Hook input arrives as JSON on stdin (Claude Code hooks).
"""
import hashlib
import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(os.environ.get("CLAUDE_PROJECT_DIR") or Path(__file__).resolve().parents[2])
WORKSPACES = (".", "packages/kit")  # the app at the root (v1 retired 6 Nov), the kit
CODE = (".ts", ".tsx")
STATE = ROOT / ".claude/hooks-state"


def read_input() -> dict:
    try:
        return json.load(sys.stdin)
    except ValueError:
        return {}


def rel(path: str) -> str:
    try:
        return str(Path(path).resolve().relative_to(ROOT))
    except ValueError:
        return path


def workspace(relpath: str) -> str | None:
    """The kit for `packages/kit/…`, the app (root) for its own code, None for the rest."""
    if relpath.startswith("packages/kit/"):
        return "packages/kit"
    if relpath.startswith(("src/", "e2e/", "eslint/", "scripts/")) or "/" not in relpath:
        return "."
    return None


def open_changes() -> list[str]:
    changes = ROOT / "docs/spec/changes"
    return sorted(p.name for p in changes.iterdir() if p.is_dir() and p.name != "archive")


def run(cmd: list[str], cwd: Path, timeout: int = 300) -> tuple[int, str]:
    p = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=timeout)
    return p.returncode, (p.stdout + p.stderr).strip()


def pre_edit(data: dict) -> int:
    path = rel(data.get("tool_input", {}).get("file_path", ""))
    if path.startswith("docs/spec/") and not path.startswith("docs/spec/changes/"):
        if not open_changes():
            print(
                f"Blocked: {path} is the spec. It changes only through an open change "
                "(PRD-41): create docs/spec/changes/YYYY-MM-DD-name/ with proposal.md, "
                "delta.md, tasks.md first, or put his words in docs/spec/changes/inbox.md.",
                file=sys.stderr,
            )
            return 2
    return 0


def post_edit(data: dict) -> int:
    path = rel(data.get("tool_input", {}).get("file_path", ""))
    ws = workspace(path)
    if not ws or not path.endswith(CODE) or not (ROOT / path).exists():
        return 0
    run(["npx", "--no-install", "prettier", "--write", "--log-level=warn", path], ROOT)
    code, out = run(
        ["npx", "--no-install", "eslint", "--pass-on-unpruned-suppressions",
         *suppressions(ws), str(Path(path).relative_to(ws))],
        ROOT / ws,
    )
    if code != 0:
        print(f"eslint on {path} (PAT-90; fix it, never add to the baseline):\n{out[-3000:]}",
              file=sys.stderr)
        return 2
    return 0


def suppressions(ws: str) -> list[str]:
    baseline = ROOT / ws / "lint-baseline.json"
    return ["--suppressions-location", "lint-baseline.json"] if baseline.exists() else []


def changed_files() -> list[str]:
    """Files changed on this branch (committed or not) plus untracked ones."""
    base = subprocess.run(["git", "merge-base", "HEAD", "origin/main"], cwd=ROOT,
                          capture_output=True, text=True).stdout.strip() or "HEAD"
    names = set()
    for cmd in (["git", "diff", "--name-only", base],
                ["git", "ls-files", "--others", "--exclude-standard"]):
        names.update(subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
                     .stdout.split())
    return sorted(n for n in names if n.endswith(CODE) and workspace(n) and (ROOT / n).exists())


def stop(data: dict) -> int:
    files = changed_files()
    if not files:
        return 0
    digest = hashlib.sha256()
    for f in files:
        digest.update(f.encode() + (ROOT / f).read_bytes())
    stamp = STATE / "stop-passed"
    if stamp.exists() and stamp.read_text() == digest.hexdigest():
        return 0
    failures = []
    for ws in WORKSPACES:
        mine = [str(Path(f).relative_to(ws)) for f in files if workspace(f) == ws]
        if not mine:
            continue
        code, out = run(["npx", "--no-install", "vitest", "related", "--run",
                         "--passWithNoTests", *mine], ROOT / ws, timeout=540)
        if code != 0:
            failures.append(f"vitest related in {ws}:\n{out[-2500:]}")
            continue
        code, out = run(["npx", "--no-install", "tsc", "--noEmit"], ROOT / ws)
        if code != 0:
            failures.append(f"tsc in {ws}:\n{out[-2500:]}")
    if not failures:
        STATE.mkdir(parents=True, exist_ok=True)
        stamp.write_text(digest.hexdigest())
        return 0
    reason = "Related tests or typecheck fail on the changed files (PAT-91):\n\n" + \
        "\n\n".join(failures)
    if data.get("stop_hook_active"):
        # Already blocked once this turn: tell the user, never loop.
        print(json.dumps({"systemMessage": reason[:1500]}))
        return 0
    print(json.dumps({"decision": "block", "reason": reason}))
    return 0


if __name__ == "__main__":
    handlers = {"pre-edit": pre_edit, "post-edit": post_edit, "stop": stop}
    if len(sys.argv) != 2 or sys.argv[1] not in handlers:
        sys.exit(f"usage: guard.py {{{'|'.join(handlers)}}}")
    sys.exit(handlers[sys.argv[1]](read_input()))
