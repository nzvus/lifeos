// The guards of change 2026-11-06-guards, each tried on a case it must stop: the Claude Code
// hooks (PAT-91), the skills (PAT-92), «built» needs a test (PRD-42), the copy detector
// (PRD-53). They run the real scripts: python3 and node, as CI has them.
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(import.meta.dirname, "..");
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "guards-"));
const hook = (sub, input, env = {}) =>
  spawnSync("python3", [path.join(ROOT, "scripts/hooks/guard.py"), sub], {
    input: JSON.stringify(input),
    encoding: "utf8",
    env: { ...process.env, ...env },
  });

describe("Claude Code hooks (PAT-91)", () => {
  it("blocks a spec edit when no change is open, allows it inside changes/", () => {
    const root = tmp();
    fs.mkdirSync(path.join(root, "docs/spec/changes/archive"), { recursive: true });
    const env = { CLAUDE_PROJECT_DIR: root };
    const spec = hook(
      "pre-edit",
      { tool_input: { file_path: `${root}/docs/spec/model.md` } },
      env,
    );
    expect(spec.status).toBe(2);
    expect(spec.stderr).toContain("PRD-41");
    const inbox = hook(
      "pre-edit",
      { tool_input: { file_path: `${root}/docs/spec/changes/inbox.md` } },
      env,
    );
    expect(inbox.status).toBe(0);
    fs.mkdirSync(path.join(root, "docs/spec/changes/2026-11-07-x"));
    expect(
      hook("pre-edit", { tool_input: { file_path: `${root}/docs/spec/model.md` } }, env)
        .status,
    ).toBe(0);
  });

  it("sends lint errors of an edited file back to Claude", () => {
    const file = path.join(ROOT, "src/features/zz-guard-probe.tsx");
    fs.writeFileSync(file, 'export const P = () => <input type="search" />;\n');
    try {
      const r = hook(
        "post-edit",
        { tool_input: { file_path: file } },
        { CLAUDE_PROJECT_DIR: ROOT },
      );
      expect(r.status).toBe(2);
      expect(r.stderr).toContain("lifeos/no-search-input");
    } finally {
      fs.rmSync(file);
    }
  }, 60_000);

  it("ignores files outside the v2 workspaces", () => {
    const r = hook("post-edit", {
      tool_input: { file_path: path.join(ROOT, "README.md") },
    });
    expect(r.status).toBe(0);
  });

  it("is wired in .claude/settings.json for each event", () => {
    const s = JSON.parse(
      fs.readFileSync(path.join(ROOT, ".claude/settings.json"), "utf8"),
    );
    const commands = (e) =>
      s.hooks[e].flatMap((m) => m.hooks.map((h) => h.command)).join(" ");
    expect(commands("PreToolUse")).toContain('guard.py" pre-edit');
    expect(commands("PostToolUse")).toContain('guard.py" post-edit');
    expect(commands("Stop")).toContain('guard.py" stop');
  });
});

describe("skills (PAT-92)", () => {
  it("change, verify and audit exist with their frontmatter; dossier and compress are gone", () => {
    for (const name of ["change", "verify", "audit", "adr", "retro"]) {
      const md = fs.readFileSync(
        path.join(ROOT, `.claude/skills/${name}/SKILL.md`),
        "utf8",
      );
      expect(md).toMatch(new RegExp(`^---\\nname: ${name}\\ndescription: .+\\n---`));
    }
    for (const gone of ["dossier", "compress"])
      expect(fs.existsSync(path.join(ROOT, `.claude/skills/${gone}`))).toBe(false);
  });
});

describe("«built» needs a test that cites the ID (PRD-42)", () => {
  const probe = (root) =>
    execFileSync(
      "python3",
      [
        "-c",
        `import importlib.util,json,sys
from pathlib import Path
s=importlib.util.spec_from_file_location("c", ${JSON.stringify(path.join(ROOT, "scripts/check.py"))}); c=importlib.util.module_from_spec(s); s.loader.exec_module(c)
print(json.dumps([m for (_,_,_,m) in c.check_built_needs_a_test(Path(sys.argv[1]), {})]))`,
        root,
      ],
      { encoding: "utf8" },
    );
  const fixture = (testCites, untested = "") => {
    const root = tmp();
    fs.mkdirSync(path.join(root, "docs/spec"), { recursive: true });
    fs.mkdirSync(path.join(root, "src"), { recursive: true });
    fs.writeFileSync(
      path.join(root, "docs/spec/product.md"),
      "- **PRD-90** A rule. — Today: built.\n- **PRD-91** Another. — Today: not built.\n",
    );
    fs.writeFileSync(path.join(root, "src/x.test.ts"), `// ${testCites}\n`);
    fs.writeFileSync(path.join(root, "docs/spec/untested.txt"), untested);
    return JSON.parse(probe(root));
  };

  it("fails a built requirement no test cites; a citing test or the baseline lets it pass", () => {
    expect(fixture("nothing")).toEqual([
      expect.stringContaining("PRD-90 is «built» but no test"),
    ]);
    expect(fixture("PRD-90")).toEqual([]);
    expect(fixture("nothing", "PRD-90\n")).toEqual([]);
  });

  it("the baseline may only shrink: a tested or unbuilt ID must leave it", () => {
    expect(fixture("PRD-90", "PRD-90\n")).toEqual([
      expect.stringContaining("has a test now"),
    ]);
    expect(fixture("PRD-90", "PRD-91\n")).toEqual([
      expect.stringContaining("not a «built» requirement"),
    ]);
  });
});

describe("the copy-paste detector (PRD-53)", () => {
  const now = JSON.parse(
    fs.readFileSync(path.join(ROOT, "scripts/cpd-baseline.json"), "utf8"),
  );
  const run = (duplicatedLines) => {
    const file = path.join(tmp(), "baseline.json");
    fs.writeFileSync(file, JSON.stringify({ ...now, duplicatedLines }));
    return spawnSync("node", [path.join(ROOT, "scripts/cpd.mjs")], {
      encoding: "utf8",
      env: { ...process.env, CPD_BASELINE: file },
    });
  };

  it("fails when duplication rises above the baseline, and when a drop is not written down", () => {
    const rise = run(now.duplicatedLines - 1);
    expect(rise.status).toBe(1);
    expect(rise.stderr).toContain("A shape used a third time becomes a kit piece");
    const drop = run(now.duplicatedLines + 1);
    expect(drop.status).toBe(1);
    expect(drop.stderr).toContain("--save");
    expect(run(now.duplicatedLines).status).toBe(0);
  }, 60_000);
});

describe("one app at the root (DT-42)", () => {
  it("v1 is gone: no apps/ workspace, the app's code and migrations at the root", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
    expect(pkg.workspaces).toEqual(["packages/*"]);
    expect(fs.existsSync(path.join(ROOT, "apps"))).toBe(false);
    expect(fs.existsSync(path.join(ROOT, "src/app/(app)/layout.tsx"))).toBe(true);
    expect(fs.existsSync(path.join(ROOT, ".github/workflows/migrate.yml"))).toBe(false);
    const sqls = fs
      .readdirSync(path.join(ROOT, "drizzle"))
      .filter((f) => f.endsWith(".sql"));
    expect(sqls.length).toBeGreaterThan(0);
  });

  it("backs up the app's database and nothing else (DT-34)", () => {
    const backup = fs.readFileSync(
      path.join(ROOT, ".github/workflows/backup.yml"),
      "utf8",
    );
    expect(backup).toContain("environment: v2");
    expect(backup).not.toContain("V2_DATABASE_URL_DIRECT");
    expect(backup).not.toContain("purge-trash");
  });
});
