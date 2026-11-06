// The copy-paste detector of PRD-53 (change 2026-11-06-guards): jscpd over v2 and the kit.
// Duplicated lines may not rise above scripts/cpd-baseline.json (6 Nov); `npm run lint` runs
// it, so CI fails a PR that copies a shape instead of making it a kit piece (rule of three).
//
// usage: node scripts/cpd.mjs [--save]   (--save writes the baseline: only after a drop)
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const BASELINE = process.env.CPD_BASELINE ?? path.join(ROOT, "scripts/cpd-baseline.json");
const out = fs.mkdtempSync(path.join(os.tmpdir(), "cpd-"));

execFileSync(
  path.join(ROOT, "node_modules/.bin/jscpd"),
  [
    "apps/v2/src",
    "packages/kit/src",
    "--format",
    "typescript,tsx",
    "--ignore",
    "**/*.test.ts,**/*.test.tsx,**/icons.generated.ts",
    "--reporters",
    "json",
    "--output",
    out,
    "--silent",
  ],
  { cwd: ROOT, stdio: ["ignore", "ignore", "inherit"] },
);
const report = JSON.parse(fs.readFileSync(path.join(out, "jscpd-report.json"), "utf8"));
fs.rmSync(out, { recursive: true, force: true });
const now = {
  duplicatedLines: report.statistics.total.duplicatedLines,
  clones: report.statistics.total.clones,
};

if (process.argv.includes("--save")) {
  fs.writeFileSync(BASELINE, JSON.stringify(now, null, 2) + "\n");
  console.log(`cpd baseline saved: ${now.duplicatedLines} lines in ${now.clones} clones`);
  process.exit(0);
}

const base = JSON.parse(fs.readFileSync(BASELINE, "utf8"));
const where = (c) =>
  `  ${c.firstFile.name}:${c.firstFile.start}  =  ${c.secondFile.name}:${c.secondFile.start}  (${c.lines} lines)`;
if (now.duplicatedLines > base.duplicatedLines) {
  console.error(
    `cpd: ${now.duplicatedLines} duplicated lines, baseline ${base.duplicatedLines} (PRD-53). ` +
      `A shape used a third time becomes a kit piece. The largest clones:`,
  );
  const largest = [...report.duplicates].sort((a, b) => b.lines - a.lines).slice(0, 10);
  console.error(largest.map(where).join("\n"));
  process.exit(1);
}
if (now.duplicatedLines < base.duplicatedLines) {
  // As ESLint's unpruned suppressions: a drop is written down, or the copies could come back.
  console.error(
    `cpd: ${now.duplicatedLines} duplicated lines (baseline ${base.duplicatedLines}): ` +
      `run \`node scripts/cpd.mjs --save\` so the baseline shrinks with the code.`,
  );
  process.exit(1);
}
console.log(`cpd: ${now.duplicatedLines} duplicated lines, as the baseline (PRD-53).`);
