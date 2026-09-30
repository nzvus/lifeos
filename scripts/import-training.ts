/**
 * scripts/import-training.ts — imports training history (ADR-0005) for one
 * account: the gym notes (a folder of "LABEL_yymmdd_hhmmss.txt" files) and/or
 * the training part of a FitForge export (sessions, presets, body metrics).
 *
 *   npm run import:training -- --email you@example.com --logs DIR --fitforge FILE   (dry run)
 *   … --alias "OCTE=Overhead cable triceps extention"    (repeatable: two names, one exercise)
 *   … --day "PUSH pre=2026-07-20"                        (repeatable: fix a session's day)
 *   … --apply                                            (writes)
 *
 * Nothing is deleted or overwritten: existing sessions (same day and label),
 * routines (same name) and measurements (same day and weight) are skipped,
 * so running it twice is harmless. Copies named "… (1).txt" and files with
 * identical content are read once.
 */
import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { openDb } from "../src/core/db/client";
import { ownerByEmailForLocalScript } from "../src/core/identity/local-admin";
import { parseFitforgeTraining } from "../src/core/import/fitforge-training";
import { parseGymLog, toPlannedSession } from "../src/core/import/gym-log";
import {
  applyTrainingImport,
  planTrainingImport,
  type TrainingImport,
} from "../src/core/import/training-apply";
import { getSettings } from "../src/core/nutrition/repositories/settings";

function usage(message: string): never {
  console.error(
    `${message}\nusage: npm run import:training -- --email EMAIL [--logs DIR] [--fitforge FILE] [--alias "A=B"]… [--day "LABEL=YYYY-MM-DD"]… [--apply]`,
  );
  process.exit(2);
}

let email: string | undefined;
let logs: string | undefined;
let fitforge: string | undefined;
let apply = false;
const aliases: Record<string, string> = {};
const days: Record<string, string> = {};
const args = process.argv.slice(2);
const pair = (v: string | undefined, flag: string) => {
  const [a, b] = (v ?? "").split("=").map((x) => x.trim());
  if (!a || !b) usage(`${flag} needs "A=B"`);
  return [a, b] as const;
};
for (let i = 0; i < args.length; i++) {
  const arg = args[i]!;
  if (arg === "--apply") apply = true;
  else if (arg === "--email") email = args[++i];
  else if (arg === "--logs") logs = args[++i];
  else if (arg === "--fitforge") fitforge = args[++i];
  else if (arg === "--alias") {
    const [a, b] = pair(args[++i], "--alias");
    aliases[a] = b;
  } else if (arg === "--day") {
    const [a, b] = pair(args[++i], "--day");
    days[a.toLowerCase()] = b;
  } else usage(`unexpected argument: ${arg}`);
}
if (!email) usage("missing --email");
if (!logs && !fitforge) usage("give --logs DIR and/or --fitforge FILE");
if (!process.env.DATABASE_URL) usage("DATABASE_URL is not set (see .env.example)");

const input: TrainingImport = { sessions: [], routines: [], measurements: [], aliases };
if (logs) {
  const seen = new Set<string>();
  for (const f of (await readdir(logs))
    .filter((f) => f.endsWith(".txt") && !f.includes(" (1)"))
    .sort()) {
    const text = await readFile(join(logs, f), "utf8");
    if (seen.has(text)) continue;
    seen.add(text);
    const parsed = parseGymLog(f, text);
    for (const w of parsed.warnings) console.warn(`  ! ${f}: ${w}`);
    input.sessions.push(toPlannedSession(parsed));
  }
}
if (fitforge) {
  const t = parseFitforgeTraining(JSON.parse(await readFile(fitforge, "utf8")));
  input.sessions.push(...t.sessions);
  input.routines.push(...t.routines);
  input.measurements.push(...t.measurements);
}
for (const s of input.sessions) s.day = days[s.label.toLowerCase()] ?? s.day;

let host = "(invalid DATABASE_URL)";
try {
  host = new URL(process.env.DATABASE_URL).hostname;
} catch {}
const { db, close } = openDb(process.env.DATABASE_URL);
try {
  const owner = await ownerByEmailForLocalScript(db, email);
  if (!owner) usage(`no account with email ${email} in this database`);
  const plan = await planTrainingImport(db, owner, input);
  console.log(
    `${apply ? "IMPORTING into" : "DRY RUN on"} ${host}${apply ? "" : " — nothing is written"}\n`,
  );
  console.log(`New exercises (${plan.newExercises.length}):`);
  for (const e of plan.newExercises) console.log(`  + ${e.name}  [${e.kind}]`);
  console.log(`\nSessions:`);
  for (const s of plan.sessions)
    console.log(`  ${s.exists ? "= exists " : "+ new    "} ${s.day}  ${s.label}`);
  console.log(`\nRoutines:`);
  for (const r of plan.routines)
    console.log(`  ${r.exists ? "= exists " : "+ new    "} ${r.name}`);
  console.log(`\nMeasurements:`);
  for (const m of plan.measurements)
    console.log(`  ${m.exists ? "= exists " : "+ new    "} ${m.day}  ${m.weightKg} kg`);
  if (!apply) {
    console.log(
      `\nTo write: add --apply. Two names for one exercise? add --alias "A=B" and run again.`,
    );
  } else {
    const { timezone } = await getSettings(db, owner);
    const r = await applyTrainingImport(db, owner, input, timezone);
    console.log(`\nCreated: ${JSON.stringify(r.created)}`);
    for (const f of r.failed) console.error(`  ! ${f.what}: ${JSON.stringify(f.errors)}`);
    if (r.failed.length) process.exitCode = 1;
  }
} finally {
  await close();
}
