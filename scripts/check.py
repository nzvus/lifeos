#!/usr/bin/env python3
"""
check.py -- repo health check for AI-assisted projects. Zero dependencies.

Audits code + docs for problems that are cheap to detect automatically and
easy for agents (or humans) to introduce silently:
  - files over line budgets (source and docs)
  - merge conflict markers
  - leftover template placeholders in filled-in docs
  - malformed / non-sequential / incomplete ADRs
  - broken relative markdown links
  - malformed .claude skill files
  - empty files, TODO/FIXME inventory

Usage:
    python scripts/check.py            # check repo (parent of scripts/)
    python scripts/check.py --strict   # warnings also fail the run
Exit code: 0 = clean (or warnings only), 1 = errors found.

Extend it: add a function that yields Finding tuples and register it in
CHECKS at the bottom. Keep every check dumb, fast, and dependency-free.
"""
import re
import sys
from pathlib import Path

# ----------------------------- configuration --------------------------------
CFG = {
    "source_exts": {".py", ".js", ".ts", ".jsx", ".tsx", ".vue", ".svelte",
                    ".java", ".kt", ".c", ".h", ".cpp", ".hpp", ".cs", ".go",
                    ".rs", ".rb", ".php", ".swift", ".lua", ".sql", ".sh"},
    "source_warn_lines": 400,     # a file this long deserves a look
    "source_error_lines": 800,    # a file this long deserves a refactor
    "doc_budgets": {              # per-file line budgets (error if exceeded)
        "ARCHITECTURE.md": 160,
        "CLAUDE.md": 130,
        "PROJECT.md": 120,
    },
    "doc_default_warn_lines": 300,  # any other .md beyond this -> warn
    "ignore_dirs": {".git", "node_modules", "dist", "build", "target", "out",
                    ".venv", "venv", "__pycache__", ".next", ".idea",
                    ".vscode", "vendor", "coverage"},
    # placeholder patterns that must not survive in filled-in root docs
    "placeholder_res": [re.compile(r"<[a-z][^<>\n]{2,60}>"),   # <name — ...>
                        re.compile(r"\[TEMPLATE\]")],
    "placeholder_exempt": {"docs/decisions/0000-template.md", "README.md",
                           "ROADMAP.md"},  # ROADMAP keeps format comments
    "adr_dir": "docs/decisions",
    "adr_required_headings": ["## Context", "## Options",
                              "## Decision", "## Consequences"],
    "adr_status_re": re.compile(
        r"\*\*Status:\*\*\s*(proposed|accepted|superseded)", re.I),
}
# -----------------------------------------------------------------------------

Finding = tuple  # (level, path, line_or_None, message)
ERR, WARN, INFO = "ERROR", "WARN", "INFO"


def walk(root: Path):
    for p in sorted(root.rglob("*")):
        if any(part in CFG["ignore_dirs"] for part in p.parts):
            continue
        if p.is_file():
            yield p


def read(p: Path):
    try:
        return p.read_text(encoding="utf-8", errors="replace").splitlines()
    except OSError:
        return None


# ------------------------------- checks --------------------------------------
def check_lengths(root, files):
    for p, lines in files.items():
        n = len(lines)
        rel = p.relative_to(root).as_posix()
        if p.suffix in CFG["source_exts"]:
            if n > CFG["source_error_lines"]:
                yield (ERR, rel, None,
                       f"{n} lines (> {CFG['source_error_lines']}): split this file")
            elif n > CFG["source_warn_lines"]:
                yield (WARN, rel, None,
                       f"{n} lines (> {CFG['source_warn_lines']}): consider splitting")
        elif p.suffix == ".md":
            budget = CFG["doc_budgets"].get(p.name)
            if budget and n > budget:
                yield (ERR, rel, None,
                       f"{n} lines (budget {budget}): run doc compression")
            elif not budget and n > CFG["doc_default_warn_lines"]:
                yield (WARN, rel, None,
                       f"{n} lines: is this doc still information-dense?")


def check_conflicts_and_empty(root, files):
    markers = ("<<<<<<<", "=======", ">>>>>>>")
    for p, lines in files.items():
        rel = p.relative_to(root).as_posix()
        if p.stat().st_size == 0:
            yield (WARN, rel, None, "empty file")
        for i, line in enumerate(lines, 1):
            if line.startswith(markers[0]) or line.startswith(markers[2]):
                yield (ERR, rel, i, "merge conflict marker")


def check_placeholders(root, files):
    """Root-level docs must not still contain template placeholders."""
    for p, lines in files.items():
        rel = p.relative_to(root).as_posix()
        if p.suffix != ".md" or rel in CFG["placeholder_exempt"]:
            continue
        if p.parent != root and CFG["adr_dir"] not in rel:
            continue
        if rel == f"{CFG['adr_dir']}/0000-template.md":
            continue
        for i, line in enumerate(lines, 1):
            for rx in CFG["placeholder_res"]:
                if rx.search(line):
                    yield (WARN, rel, i,
                           f"template placeholder left in: {line.strip()[:60]!r}")
                    break


def check_adrs(root, files):
    adr_dir = root / CFG["adr_dir"]
    if not adr_dir.is_dir():
        return
    nums = []
    for p in sorted(adr_dir.glob("*.md")):
        rel = p.relative_to(root).as_posix()
        if p.name in ("README.md", "0000-template.md"):
            continue
        m = re.fullmatch(r"(\d{4})-[a-z0-9][a-z0-9-]*\.md", p.name)
        if not m:
            yield (ERR, rel, None,
                   "ADR filename must be NNNN-kebab-title.md")
            continue
        nums.append(int(m.group(1)))
        text = "\n".join(files.get(p, []))
        sm = CFG["adr_status_re"].search(text)
        if not sm:
            yield (ERR, rel, None,
                   "missing/invalid '**Status:** proposed|accepted|superseded'")
        for h in CFG["adr_required_headings"]:
            if h not in text:
                yield (ERR, rel, None, f"missing required section '{h}'")
        if sm and sm.group(1).lower() == "accepted":
            tail = text.split("## What I learned")[-1]
            if len(tail.strip()) < 20:
                yield (WARN, rel, None,
                       "accepted ADR but 'What I learned' is empty -- write it")
    dupes = {n for n in nums if nums.count(n) > 1}
    for n in sorted(dupes):
        yield (ERR, CFG["adr_dir"], None, f"duplicate ADR number {n:04d}")
    if nums:
        expected = set(range(1, max(nums) + 1))
        for n in sorted(expected - set(nums)):
            yield (WARN, CFG["adr_dir"], None, f"gap in ADR numbering: {n:04d}")


def check_md_links(root, files):
    link_re = re.compile(r"\[[^\]]*\]\(([^)#\s]+)(?:#[^)]*)?\)")
    for p, lines in files.items():
        if p.suffix != ".md":
            continue
        rel = p.relative_to(root).as_posix()
        for i, line in enumerate(lines, 1):
            for target in link_re.findall(line):
                if re.match(r"^[a-z]+:", target):   # http:, mailto:, ...
                    continue
                if not (p.parent / target).exists():
                    yield (ERR, rel, i, f"broken relative link -> {target}")


def check_skills(root, files):
    for p, lines in files.items():
        if p.name != "SKILL.md" or ".claude" not in p.parts:
            continue
        rel = p.relative_to(root).as_posix()
        text = "\n".join(lines)
        if not text.startswith("---"):
            yield (ERR, rel, 1, "SKILL.md must start with '---' frontmatter")
            continue
        fm = text.split("---", 2)
        body = fm[1] if len(fm) >= 3 else ""
        for field in ("name:", "description:"):
            if field not in body:
                yield (ERR, rel, None, f"frontmatter missing '{field}'")


def check_todos(root, files):
    hits = []
    for p, lines in files.items():
        if p.suffix not in CFG["source_exts"] or p.name == "check.py":
            continue
        for i, line in enumerate(lines, 1):
            if re.search(r"\b(TODO|FIXME|HACK|XXX)\b", line):
                hits.append((p.relative_to(root).as_posix(), i))
    if hits:
        listing = ", ".join(f"{f}:{i}" for f, i in hits[:8])
        more = f" (+{len(hits)-8} more)" if len(hits) > 8 else ""
        yield (INFO, ".", None, f"{len(hits)} TODO/FIXME markers: {listing}{more}")


CHECKS = [check_lengths, check_conflicts_and_empty, check_placeholders,
          check_adrs, check_md_links, check_skills, check_todos]


# -------------------------------- runner --------------------------------------
def main():
    strict = "--strict" in sys.argv
    root = Path(__file__).resolve().parent.parent
    files = {}
    for p in walk(root):
        if p.suffix in CFG["source_exts"] or p.suffix == ".md":
            lines = read(p)
            if lines is not None:
                files[p] = lines

    findings = []
    for chk in CHECKS:
        findings.extend(chk(root, files))

    order = {ERR: 0, WARN: 1, INFO: 2}
    findings.sort(key=lambda f: (order[f[0]], f[1], f[2] or 0))
    for level, path, line, msg in findings:
        loc = f"{path}:{line}" if line else path
        print(f"[{level:5}] {loc} -- {msg}")

    errs = sum(1 for f in findings if f[0] == ERR)
    warns = sum(1 for f in findings if f[0] == WARN)
    print(f"\nChecked {len(files)} files: {errs} error(s), {warns} warning(s).")
    fail = errs > 0 or (strict and warns > 0)
    print("RESULT: FAIL" if fail else "RESULT: OK")
    sys.exit(1 if fail else 0)


if __name__ == "__main__":
    main()
