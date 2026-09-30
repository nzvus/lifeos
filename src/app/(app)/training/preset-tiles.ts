/**
 * app/(app)/training/preset-tiles.ts — the "start from" tiles shared by the
 * Training page and the day page: every routine at its latest version
 * (core/training/presets.ts), from all done sessions before `day`.
 */
import "server-only";
import type { Owner } from "@/core/identity/owner";
import { latestPreset, type PresetSet } from "@/core/training/presets";
import { listRoutines } from "@/core/training/repositories/routines";
import { listSessions } from "@/core/training/repositories/sessions";
import type { PresetTile } from "@/features/training/sessions/PresetPicker";
import { getDb } from "@/app/_server/runtime";

export async function presetTiles(owner: Owner, day: string): Promise<PresetTile[]> {
  const db = getDb();
  const [routines, history] = await Promise.all([
    listRoutines(db, owner),
    listSessions(db, owner, "2000-01-01", day),
  ]);
  return routines.map((r) => {
    const p = latestPreset<PresetSet>(r, history, (it) => ({ ...it, warmup: false }));
    return {
      routineId: r.id,
      label: p.label,
      fromDay:
        p.from.kind === "session"
          ? `${p.from.day.slice(8, 10)}/${p.from.day.slice(5, 7)}`
          : null,
    };
  });
}
