/**
 * features/training/sessions/PresetPicker.tsx — "start a session from…":
 * one tile per routine, each at its latest version (core/training/presets.ts:
 * the tile says which session it repeats), plus an empty session. A grid of
 * equal tiles, centred text, so the row is balanced on a phone and on a desktop.
 * The editor opens prefilled for `day` (today when absent); with `start`
 * (the Training page), a routine tile instead starts it now in gym mode.
 */
import { Plus } from "lucide-react";
import Link from "next/link";
import { fill, type Messages } from "@/i18n";

export type PresetTile = {
  routineId: string;
  /** The label the new session gets: the routine's name. */
  label: string;
  /** "dd/mm" of the session it repeats, or null when it uses the routine's items. */
  fromDay: string | null;
};

const TILE =
  "tile flex min-h-16 flex-col items-center justify-center gap-0.5 px-2 py-2 text-center hover:border-ink";

export function PresetPicker({
  presets,
  day,
  start,
  t,
}: {
  presets: readonly PresetTile[];
  day?: string;
  /** Server action starting a routine in gym mode (form field routineId). */
  start?: (formData: FormData) => Promise<void>;
  t: Messages["training"];
}) {
  // From the day page: that day, and back to it after saving (ADR-0015 `from`).
  const dayParam = day ? `day=${day}&from=${encodeURIComponent(`/?day=${day}`)}` : "";
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {presets.map((p) => (
        <li key={p.routineId}>
          {start ? (
            <form action={start}>
              <input type="hidden" name="routineId" value={p.routineId} />
              <button type="submit" className={`${TILE} w-full`}>
                <Body p={p} t={t} />
              </button>
            </form>
          ) : (
            <Link
              href={`/training/new?routine=${p.routineId}${dayParam ? `&${dayParam}` : ""}`}
              className={TILE}
            >
              <Body p={p} t={t} />
            </Link>
          )}
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

function Body({ p, t }: { p: PresetTile; t: Messages["training"] }) {
  return (
    <>
      <span className="font-display text-item font-semibold">{p.label}</span>
      <span className="text-meta text-muted">
        {p.fromDay ? fill(t.presetFrom, { day: p.fromDay }) : t.presetRoutine}
      </span>
    </>
  );
}
