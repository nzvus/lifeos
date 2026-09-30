/**
 * features/training/sessions/PresetPicker.tsx — "start a session from…":
 * one tile per routine, each at its latest version (core/training/presets.ts:
 * the tile says which session it repeats), plus an empty session. A grid of
 * equal tiles, centred text, so the row is balanced on a phone and on a desktop.
 * Links only: the editor opens prefilled for `day` (today when absent).
 */
import { Plus } from "lucide-react";
import Link from "next/link";
import { fill, type Messages } from "@/i18n";

export type PresetTile = {
  routineId: string;
  /** The label the new session gets: "PUSH 6". */
  label: string;
  /** "dd/mm" of the session it repeats, or null when it uses the routine's items. */
  fromDay: string | null;
};

const TILE =
  "tile flex min-h-16 flex-col items-center justify-center gap-0.5 px-2 py-2 text-center hover:border-ink";

export function PresetPicker({
  presets,
  day,
  t,
}: {
  presets: readonly PresetTile[];
  day?: string;
  t: Messages["training"];
}) {
  const dayParam = day ? `day=${day}` : "";
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {presets.map((p) => (
        <li key={p.routineId}>
          <Link
            href={`/training/new?routine=${p.routineId}${dayParam ? `&${dayParam}` : ""}`}
            className={TILE}
          >
            <span className="font-display text-item font-semibold">{p.label}</span>
            <span className="text-meta text-muted">
              {p.fromDay ? fill(t.presetFrom, { day: p.fromDay }) : t.presetRoutine}
            </span>
          </Link>
        </li>
      ))}
      <li>
        <Link
          href={`/training/new${dayParam ? `?${dayParam}` : ""}`}
          className={`${TILE} border-dashed text-muted`}
        >
          <Plus size={18} aria-hidden="true" />
          <span className="text-meta">{t.presetEmpty}</span>
        </Link>
      </li>
    </ul>
  );
}
