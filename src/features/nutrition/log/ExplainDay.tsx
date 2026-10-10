/**
 * features/nutrition/log/ExplainDay.tsx — how a dynamic day's numbers were
 * built, in four plain steps (core/day/explain.ts). Under the day's goal
 * line, closed until asked. Server component.
 */
import type { DayExplained } from "@/core/day/explain";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, type Messages } from "@/i18n";
import { Disclosure } from "@/ui/Disclosure";

export function ExplainDay({
  x,
  locale,
  t,
}: {
  x: DayExplained;
  locale: Locale;
  t: Messages["energy"]["weightGoal"];
}) {
  const e = t.explain;
  const n = (v: number, d = 0) => formatNumber(String(v), locale, d);
  const s = x.source;
  const goalLine =
    s.type === "goal"
      ? s.kcalPerDay === 0
        ? fill(e.goalSteady, { kind: t.kindsShort[s.kind] })
        : fill(s.kcalPerDay < 0 ? e.goalTakes : e.goalAdds, {
            kind: t.kindsShort[s.kind],
            rate: n(Math.abs(s.ratePctWeek), 2),
            kcal: n(Math.abs(s.kcalPerDay)),
          })
      : s.type === "checkin"
        ? [
            fill(e.checkin, {
              day: new Intl.DateTimeFormat(locale === "it" ? "it-IT" : "en-GB", {
                day: "numeric",
                month: "long",
                timeZone: "UTC",
              }).format(new Date(`${s.startDay}T00:00:00Z`)),
              kcal: n(x.kcal - s.shift),
              exp: s.expenditure === null ? "—" : n(s.expenditure),
            }),
            s.shift !== 0 &&
              fill(e.checkinShift, {
                shift: `${s.shift > 0 ? "+" : "−"}${n(Math.abs(s.shift))}`,
              }),
          ]
            .filter(Boolean)
            .join(" ")
        : fill(s.deficit >= 0 ? e.typeTakes : e.typeAdds, {
            kcal: n(Math.abs(s.deficit)),
          });
  return (
    <Disclosure summary={e.title}>
      <ol className="flex list-decimal flex-col gap-1 pl-5 text-meta tabular-nums">
        {s.type !== "checkin" && (
          <li>
            {fill(e.spend, {
              total: n(x.spend.total),
              bmr: n(x.spend.bmr),
              everyday: n(x.spend.everyday),
              steps: n(x.spend.steps),
              training: n(x.spend.training),
            })}
          </li>
        )}
        <li>{goalLine}</li>
        {x.floored !== null && <li>{fill(e.floor, { kcal: n(x.floored) })}</li>}
        <li className="font-semibold">{fill(e.result, { kcal: n(x.kcal) })}</li>
        <li>
          {fill(e.split, {
            protein: n(x.protein.g),
            perKg: n(x.protein.perKg, 1),
            kg: n(x.protein.ofKg, 1),
            fat: n(x.fat.g),
            share: n(x.fat.sharePct),
            carbs: n(x.carbs.g),
          })}
        </li>
      </ol>
    </Disclosure>
  );
}
