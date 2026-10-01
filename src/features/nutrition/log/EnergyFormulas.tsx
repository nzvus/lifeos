/**
 * features/nutrition/log/EnergyFormulas.tsx — "how is it computed": every
 * figure of the Energy section as its formula with the day's own numbers
 * (ADR-0014/0021), and for a dynamic day the target from the energy,
 * with the deficit or surplus stated. Server component.
 */
import type { DynamicParams, Energy } from "@/core/energy/energy";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, type Messages } from "@/i18n";

type Props = {
  energy: Energy;
  /** A dynamic day's parameters and the targets they gave; null for a fixed day. */
  dynamic: {
    params: DynamicParams;
    kcal: number;
    protein: number;
    fat: number;
    carbs: number;
    fiber: number;
  } | null;
  locale: Locale;
  t: Messages["energy"];
};

export function EnergyFormulas({ energy, dynamic, locale, t }: Props) {
  const f = t.formulas;
  const i = energy.inputs;
  const n = (v: number, d = 0) => formatNumber(String(v), locale, d);
  const rng = (lo: number, hi: number, d = 0) =>
    lo === hi ? n(lo, d) : `${n(lo, d)}–${n(hi, d)}`;
  const kcal = (r: { low: number; high: number }) => `${rng(r.low, r.high)} kcal`;

  const lines: { label: string; formula: string; result: string }[] = [
    {
      label: t.bmr,
      formula: `10 × ${n(i.kg, 1)} kg + 6,25 × ${n(i.heightCm)} cm − 5 × ${n(i.age)} ${f.years} ${i.sex === "male" ? "+ 5" : "− 161"}`,
      result: `${n(energy.bmr)} kcal`,
    },
    {
      label: t.baseline,
      formula: `${n(energy.bmr)} × ${rng(i.factor[0], i.factor[1], 2)} (${t.levels[i.level]})${i.correction !== 1 ? ` × ${n(i.correction, 2)}` : ""}`,
      result: kcal(energy.baseline),
    },
    {
      label: t.walking,
      formula:
        i.walk.minutes === 0
          ? fill(f.walkNone, { steps: n(i.walk.steps), level: n(i.walk.levelSteps) })
          : `${fill(f.walkMinutes, {
              min: n(i.walk.minutes),
              declared: n(i.walk.declaredMin),
              steps: n(i.walk.steps),
              level: n(i.walk.levelSteps),
            })} · (${rng(i.walk.met[0] - 1, i.walk.met[1] - 1, 1)} MET) × ${n(i.kg, 1)} kg × ${n(i.walk.minutes)}/60 h`,
      result: kcal(energy.walking),
    },
    ...i.sessions.map((s) => {
      const b = s.basis;
      const from =
        !b || !s.burn
          ? f.noBurn
          : b.kind === "estimate"
            ? fill(f.fromEstimate, { kcal: n(b.kcal) })
            : b.kind === "intensity"
              ? `${rng(b.met[0], b.met[1], 1)} MET × ${n(i.kg, 1)} kg × ${n(b.minutes)}/60 h`
              : fill(f.fromSets, {
                  strength: n(b.strengthMin),
                  cardio: n(b.cardioMin),
                  kg: n(i.kg, 1),
                });
      return {
        label: `${s.status === "done" ? t.trainingDone : t.trainingPlanned}: ${s.name}`,
        formula: s.burn
          ? `${from} = ${kcal(s.burn)} − ${fill(f.rest, { kcal: n(s.rest), min: n(s.durationMin) })}`
          : from,
        result: kcal(s.net),
      };
    }),
    {
      label: t.totalDone,
      formula: f.sumDone,
      result: kcal(energy.total.done),
    },
    {
      label: t.totalPlan,
      formula: f.sumPlan,
      result: kcal(energy.total.withPlan),
    },
  ];

  if (dynamic) {
    const mid = (energy.total.withPlan.low + energy.total.withPlan.high) / 2;
    const d = dynamic.params.deficitKcal;
    lines.push(
      {
        label: d > 0 ? f.deficit : d < 0 ? f.surplus : f.maintenance,
        formula: `${f.midpoint} ${n(Math.round(mid))} ${d >= 0 ? "−" : "+"} ${n(Math.abs(d))}${dynamic.kcal === 1200 ? ` (${f.floor})` : ""}`,
        result: `${n(dynamic.kcal)} kcal`,
      },
      {
        label: f.protein,
        formula: `${n(Number(dynamic.params.proteinGPerKg), 1)} g/kg × ${n(i.kg, 1)} kg`,
        result: `${n(dynamic.protein)} g (${n(dynamic.protein * 4)} kcal)`,
      },
      {
        label: f.fat,
        formula: `${n(Number(dynamic.params.fatGPerKg), 1)} g/kg × ${n(i.kg, 1)} kg`,
        result: `${n(dynamic.fat)} g (${n(dynamic.fat * 9)} kcal)`,
      },
      {
        label: f.carbs,
        formula: `(${n(dynamic.kcal)} − ${n(dynamic.protein * 4)} − ${n(dynamic.fat * 9)}) ÷ 4`,
        result: `${n(dynamic.carbs)} g`,
      },
      {
        label: f.fiber,
        formula: `14 g × ${n(dynamic.kcal)} / 1000`,
        result: `${n(dynamic.fiber)} g`,
      },
    );
  }

  return (
    <ol className="flex flex-col gap-2">
      {lines.map((l, k) => (
        <li
          key={k}
          className="flex flex-col gap-0.5 rule-b-medium border-hairline pb-2"
        >
          <span className="flex items-baseline justify-between gap-3">
            <span className="font-semibold">{l.label}</span>
            <span className="shrink-0 font-display whitespace-nowrap tabular-nums">
              {l.result}
            </span>
          </span>
          <span className="text-muted tabular-nums">{l.formula}</span>
        </li>
      ))}
    </ol>
  );
}
