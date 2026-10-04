/**
 * features/mind/MindDays.tsx — the checked-in days, newest first, one row
 * each: the date, mood / energy / stress as three short bars out of 5 (the
 * bar's length is the value; no number to read), and the note.
 */
import type { Messages } from "@/i18n";

type Day = {
  day: string;
  label: string;
  mood: number | null;
  energy: number | null;
  stress: number | null;
  note: string;
};

function Bar({
  value,
  label,
  tone,
}: {
  value: number | null;
  label: string;
  tone: string;
}) {
  return (
    <span
      className="flex min-w-0 flex-1 flex-col gap-0.5"
      title={`${label}: ${value ?? "—"}/5`}
    >
      <span className="sr-only">{`${label}: ${value ?? "—"}/5`}</span>
      <span className="block h-1.5 w-full rounded-badge bg-hairline" aria-hidden="true">
        {value !== null && (
          <span
            className={`block h-full rounded-badge ${tone}`}
            style={{ width: `${(value / 5) * 100}%` }}
          />
        )}
      </span>
    </span>
  );
}

export function MindDays({ days, t }: { days: Day[]; t: Messages["mind"] }) {
  return (
    <ul className="flex flex-col">
      {days.map((d) => (
        <li key={d.day} className="item flex flex-col gap-1 py-2">
          <div className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-meta text-muted first-letter:uppercase">
              {d.label}
            </span>
            {/* Mood and energy: more is better (green); stress: more is worse (amber). */}
            <Bar value={d.mood} label={t.mood} tone="bg-herb" />
            <Bar value={d.energy} label={t.energy} tone="bg-herb" />
            <Bar value={d.stress} label={t.stress} tone="bg-warn" />
          </div>
          {d.note && <p className="text-meta">{d.note}</p>}
        </li>
      ))}
    </ul>
  );
}
