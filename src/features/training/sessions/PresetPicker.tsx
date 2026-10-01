/**
 * features/training/sessions/PresetPicker.tsx — "start a session from…":
 * one tile per routine, each at its latest version (core/training/presets.ts:
 * the tile says which session it repeats), plus an empty session. A grid of
 * equal tiles, centred text, so the row is balanced on a phone and on a desktop.
 * The editor opens prefilled for `day` (today when absent); with `start`
 * (the Training page), a routine tile instead starts it now in gym mode;
 * with `onPick` (the day page), the parent decides (start, plan or editor).
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
  start,
  onPick,
  emptyHref = "/training/new",
  disabled = false,
  t,
}: {
  presets: readonly PresetTile[];
  /** Server action starting a routine in gym mode (form field routineId). */
  start?: (formData: FormData) => Promise<void>;
  /** A tile was chosen (the parent acts on the routine id). */
  onPick?: (routineId: string) => void;
  /** Where the empty session tile leads. */
  emptyHref?: string;
  disabled?: boolean;
  t: Messages["training"];
}) {
  return (
    <ul className="grid grid-cols-2 gap-2 @lg:grid-cols-4">
      {presets.map((p) => (
        <li key={p.routineId}>
          {onPick ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onPick(p.routineId)}
              className={`${TILE} w-full`}
            >
              <Body p={p} t={t} />
            </button>
          ) : start ? (
            <form action={start}>
              <input type="hidden" name="routineId" value={p.routineId} />
              <button type="submit" className={`${TILE} w-full`}>
                <Body p={p} t={t} />
              </button>
            </form>
          ) : (
            <Link href={`/training/new?routine=${p.routineId}`} className={TILE}>
              <Body p={p} t={t} />
            </Link>
          )}
        </li>
      ))}
      <li>
        <Link href={emptyHref} className={`${TILE} border-dashed text-muted`}>
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
