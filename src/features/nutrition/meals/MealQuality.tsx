/**
 * features/nutrition/meals/MealQuality.tsx — what a meal is made of by the
 * ADR-0012 attributes of its ingredients, on its card: average rating,
 * energy by processing level (NOVA bar with its words), protein by origin,
 * the fibre types present and the tags of its ingredients. Nothing shows
 * for a meal whose ingredients are not classified yet.
 */
import type { QualitySummary } from "@/core/nutrition/quality-summary";
import { FIBER_TYPES, NOVA_LEVELS, ORIGINS } from "@/core/nutrition/quality";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, qualityLabels, type Messages } from "@/i18n";
import { NovaBar } from "@/ui/NovaBar";
import { QualityBadges } from "@/ui/QualityIcons";
import { Stars } from "@/ui/StarRating";

type Props = {
  summary: QualitySummary;
  rating: number | null;
  tags: { name: string; icon: string }[];
  locale: Locale;
  t: Pick<Messages, "quality" | "ratings" | "mealQuality">;
};

export function MealQuality({ summary, rating, tags, locale, t }: Props) {
  const q = t.mealQuality;
  const classified = summary.nova.unknown < 100;
  const novaText = fill(q.nova, {
    parts: [
      ...NOVA_LEVELS.filter((n) => summary.nova[String(n) as "1"] > 0).map((n) =>
        fill(q.novaPart, { n: String(n), v: String(summary.nova[String(n) as "1"]) }),
      ),
      ...(summary.nova.unknown > 0
        ? [fill(q.unknown, { v: String(summary.nova.unknown) })]
        : []),
    ].join(" · "),
  });
  const originText = fill(q.origin, {
    parts: ORIGINS.filter((o) => summary.origin[o] > 0)
      .map((o) =>
        fill(q.originPart, { name: t.quality.origins[o], v: String(summary.origin[o]) }),
      )
      .join(" · "),
  });
  const fibers = FIBER_TYPES.filter((f) => Number(summary.fiber[f]) > 0);
  if (!classified && rating === null && tags.length === 0) return null;
  return (
    <div className="flex flex-col gap-1 text-meta">
      {rating !== null && (
        <span className="inline-flex items-center gap-1.5 text-muted tabular-nums">
          <Stars
            score={rating}
            label={fill(t.ratings.averageLabel, {
              v: formatNumber(String(rating), locale, 1),
            })}
          />
          {fill(t.ratings.average, { v: formatNumber(String(rating), locale, 1) })}
        </span>
      )}
      {classified && (
        <>
          <NovaBar shares={summary.nova} label={novaText} />
          <span className="text-muted">{novaText}</span>
          {summary.origin.unknown < 100 && (
            <span className="text-muted">{originText}</span>
          )}
        </>
      )}
      <QualityBadges
        nova={null}
        origin={null}
        fiberTypes={fibers}
        tags={tags}
        labels={qualityLabels(t)}
      />
    </div>
  );
}
