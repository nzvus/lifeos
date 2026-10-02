/**
 * features/nutrition/profiles/ProfileList.tsx — day types with their main
 * targets; the default one first and marked. A dynamic type (ADR-0014)
 * stores parameters, not numbers: it shows what it asks TODAY, so marked.
 * Server component.
 */
import Link from "next/link";
import { NUTRIENT_UNIT } from "@/core/nutrition/nutrients";
import type { TodayTargets } from "@/core/energy/repositories/outlook";
import type { DayProfile } from "@/core/nutrition/repositories/profiles";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import type { Messages } from "@/i18n";
import { NutrientIcon } from "@/ui/NutrientIcon";
import { Badge } from "@/ui/Badge";

type Props = {
  profiles: DayProfile[];
  /** Dynamic types: today's numbers, by profile id. */
  today?: ReadonlyMap<string, TodayTargets>;
  locale: Locale;
  t: Pick<Messages, "profiles" | "nutrients">;
};

const SHOWN = ["kcal", "protein", "carbs", "fat", "fiber"] as const;

export function ProfileList({ profiles, today, locale, t }: Props) {
  if (profiles.length === 0) return <p className="text-muted">{t.profiles.empty}</p>;
  return (
    <ul className="flex flex-col">
      {profiles.map((p) => {
        const now = today?.get(p.id);
        const value = (k: (typeof SHOWN)[number]) => (now ? String(now[k]) : p[k]);
        return (
          <li key={p.id} className="rule-b-medium border-ink py-3">
            <div className="flex items-baseline justify-between gap-3">
              <Link
                href={`/profiles/${p.id}`}
                className="font-display text-section font-bold underline-offset-4 hover:underline"
              >
                {p.name}
              </Link>
              {p.isDefault && <Badge tone="done">{t.profiles.isDefault}</Badge>}
            </div>
            {now && <p className="text-meta text-muted">{t.profiles.todayDynamic}</p>}
            {/* Icon + value + unit: the colour and icon name the nutrient, the
              word is for screen readers (five words never fit a phone row). */}
            <dl className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
              {SHOWN.map((k) => (
                <div key={k} className="flex items-center gap-1">
                  <dt className="flex items-center" title={t.nutrients[k]}>
                    <NutrientIcon name={k} size={14} />
                    <span className="sr-only">{t.nutrients[k]}</span>
                  </dt>
                  <dd className="font-display tabular-nums">
                    {value(k) === null ? "—" : formatNumber(value(k)!, locale, 0)}
                    <span className="pl-0.5 text-meta text-muted">
                      {NUTRIENT_UNIT[k]}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        );
      })}
    </ul>
  );
}
