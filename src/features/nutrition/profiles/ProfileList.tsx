/**
 * features/nutrition/profiles/ProfileList.tsx — day types with their main
 * targets; the default one first and marked. Server component.
 */
import Link from "next/link";
import type { DayProfile } from "@/core/nutrition/repositories/profiles";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import type { Messages } from "@/i18n";
import { NutrientIcon } from "@/ui/NutrientIcon";

type Props = {
  profiles: DayProfile[];
  locale: Locale;
  t: Pick<Messages, "profiles" | "nutrients">;
};

const SHOWN = ["kcal", "protein", "carbs", "fat", "fiber"] as const;

export function ProfileList({ profiles, locale, t }: Props) {
  if (profiles.length === 0) return <p className="text-muted">{t.profiles.empty}</p>;
  return (
    <ul className="flex flex-col">
      {profiles.map((p) => (
        <li key={p.id} className="border-b-2 border-ink py-3">
          <div className="flex items-baseline justify-between gap-3">
            <Link
              href={`/profiles/${p.id}`}
              className="font-display text-xl font-bold underline-offset-4 hover:underline"
            >
              {p.name}
            </Link>
            {p.isDefault && (
              <span className="border-2 border-herb px-2 font-display text-sm font-semibold text-herb">
                {t.profiles.isDefault}
              </span>
            )}
          </div>
          <dl className="grid grid-cols-5 gap-2 pt-1 text-sm">
            {SHOWN.map((k) => (
              <div key={k}>
                <dt className="flex items-center gap-1 text-muted">
                  <NutrientIcon name={k} size={14} />
                  <span className="truncate">{t.nutrients[k]}</span>
                </dt>
                <dd className="font-display text-lg tabular-nums">
                  {p[k] === null ? "—" : formatNumber(p[k], locale, 0)}
                </dd>
              </div>
            ))}
          </dl>
        </li>
      ))}
    </ul>
  );
}
