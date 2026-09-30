/**
 * core/import/gym-log.ts — reads the developer's gym notes (plain text, one
 * session per file, e.g. "PULL 4_260928_112710.txt") into a session plan
 * (ADR-0005). PURE: no database; scripts/import-training.ts applies it.
 *
 * The file name gives the label, the day and the start time
 * ("PULL 4", 2026-09-28, 11:27). The text:
 *
 *   Pause da 1.20                  rest 1 min 20 s for the sets that follow
 *   30 sec di pausa tra serie      rest 30 s for the exercises that follow
 *   Lat pulldown (note)            an exercise, optional note in brackets;
 *                                  "(pause da 60 sec)" sets its rest
 *   10 da 60                       10 reps with 60 kg
 *   2x9 da 15                      2 sets of 9 with 15 kg
 *   3x10                           3 sets of 10, no load (bodyweight)
 *   3x8 con 2 da 20                two dumbbells: load 40, written "2×20"
 *   7 con 2 da 10 + asta           plates plus a bar of unknown weight:
 *                                  load 20 (known part), approximate
 *   (reps da un braccio …)         a note on the exercise above
 *   Compiuto in 55 min / circa 1 ora   the duration
 *
 * Prose — the warm-up description before the first exercise, a sentence
 * between exercises, a remark after the rest — becomes the session's notes.
 * Anything else is reported as a warning, never dropped silently.
 */
import { plainSet, type PlannedSession } from "./training-plan";

export type ParsedSet = {
  reps: number;
  /** Total load in kg (exact decimal string), or null (bodyweight). */
  loadKg: string | null;
  /** The load as written, when it isn't a plain number ("2×20", "2×10 + asta"). */
  loadText: string | null;
  loadApprox: boolean;
};
export type ParsedExercise = {
  name: string;
  notes: string;
  restS: number | null;
  sets: ParsedSet[];
};
export type ParsedSession = {
  label: string;
  day: string;
  time: string;
  durationMin: number | null;
  notes: string;
  exercises: ParsedExercise[];
  warnings: string[];
};

const FILE = /^(.+?)_(\d{2})(\d{2})(\d{2})_(\d{2})(\d{2})\d{2}/;
const SET =
  /^(?:(\d+)\s*x\s*)?(\d+)\s*(?:(con\s*2\s*)?da\s*(\d+(?:[.,]\d+)?)\s*(\+\s*asta)?)?\s*$/i;
const REST = /^pause\s+da\s+(\d+)[.,:](\d{1,2})\b/i;
const REST_SEC = /^(\d+)\s*sec\s+di\s+pausa/i;
const DONE = /^compiuto\s+in\s+(?:circa\s+)?(?:(\d+)\s*min|(un|\d+)\s*or[ae])/i;
const NOTE_REST = /pause\s+da\s+(\d+)\s*sec/i;

/** "17.5" or "17,5" -> "17.5"; doubled -> "35". Exact enough for half kilos. */
const kg = (raw: string, times = 1) => {
  const n = Number(raw.replace(",", ".")) * times;
  return String(Math.round(n * 100) / 100);
};

export function parseGymLog(fileName: string, text: string): ParsedSession {
  const warnings: string[] = [];
  const m = FILE.exec(fileName.replace(/\.txt$/i, ""));
  if (!m)
    throw new Error(
      `file name not understood: ${fileName} (expected "LABEL_yymmdd_hhmmss.txt")`,
    );
  const [, label, yy, mo, dd, hh, mi] = m;
  const session: ParsedSession = {
    label: label!.trim(),
    day: `20${yy}-${mo}-${dd}`,
    time: `${hh}:${mi}`,
    durationMin: null,
    notes: "",
    exercises: [],
    warnings,
  };
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const isSet = (l: string | undefined) => l !== undefined && SET.test(l);
  const nextNonEmpty = (i: number) => lines.slice(i + 1).find((l) => l !== "");
  let restS: number | null = null;
  let current: ParsedExercise | null = null;
  let first = true;
  const sessionNotes: string[] = [];

  lines.forEach((line, i) => {
    if (line === "") return;
    if (first) {
      first = false; // the heading ("PUSH", "PULl"): the label comes from the file name
      return;
    }
    let r: RegExpExecArray | null;
    if ((r = REST.exec(line))) {
      restS = Number(r[1]) * 60 + Number(r[2]!.padEnd(2, "0"));
      const aside = /\((.*)\)\s*$/.exec(line); // "Pause da 1.20 (when alternating arms…)"
      if (aside) sessionNotes.push(aside[1]!.trim());
      return;
    }
    if ((r = REST_SEC.exec(line))) {
      restS = Number(r[1]);
      return;
    }
    if ((r = DONE.exec(line))) {
      session.durationMin = r[1] ? Number(r[1]) : r[2] === "un" ? 60 : Number(r[2]) * 60;
      return;
    }
    if ((r = SET.exec(line))) {
      if (!current) {
        warnings.push(`set before any exercise: "${line}"`);
        return;
      }
      const [, count, reps, pair, load, bar] = r;
      const set: ParsedSet = {
        reps: Number(reps),
        loadKg: load ? kg(load, pair ? 2 : 1) : null,
        loadText: pair ? `2×${load!.replace(".", ",")}${bar ? " + asta" : ""}` : null,
        loadApprox: Boolean(bar),
      };
      for (let k = 0; k < Number(count ?? 1); k++) current.sets.push({ ...set });
      return;
    }
    if (/^\(.*\)$/.test(line) && current) {
      current.notes = [current.notes, line.slice(1, -1).trim()]
        .filter(Boolean)
        .join(" · ");
      return;
    }
    if (isSet(nextNonEmpty(i))) {
      // An exercise: "Name (optional note)".
      const note = /\((.*)\)\s*$/.exec(line);
      const name = (note ? line.slice(0, note.index) : line).trim();
      const noteRest = note ? NOTE_REST.exec(note[1]!) : null;
      current = {
        name,
        notes: note ? note[1]!.trim() : "",
        restS: noteRest ? Number(noteRest[1]) : restS,
        sets: [],
      };
      session.exercises.push(current);
      return;
    }
    // Prose — the warm-up before the first exercise, or a sentence between
    // exercises ("Sento spalle e collo indolenziti") — is a session note.
    if (session.exercises.length === 0 || line.split(/\s+/).length >= 4) {
      sessionNotes.push(line);
      return;
    }
    warnings.push(`line not understood: "${line}"`);
  });
  session.notes = sessionNotes.join(" ");
  return session;
}

/** A parsed log as a session to import (./training-plan.ts). */
export function toPlannedSession(s: ParsedSession): PlannedSession {
  return {
    label: s.label,
    day: s.day,
    time: s.time,
    durationMin: s.durationMin,
    notes: s.notes,
    exercises: s.exercises.map((e) => ({
      name: e.name,
      notes: e.notes,
      restS: e.restS,
      sets: e.sets.map((x) => plainSet(x)),
    })),
  };
}
