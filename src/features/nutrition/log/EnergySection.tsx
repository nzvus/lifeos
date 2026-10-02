/**
 * features/nutrition/log/EnergySection.tsx — what the day costs and what
 * came in (ADR-0014): every part of the expenditure as a range, the total
 * so far and with the plan, the intake eaten and with the planned food, and
 * the balance. Without body data it says what is missing, never a guess.
 * The day's movement (level, walking, steps) is edited here, and on today's
 * page the calibration against the scale (ADR-0020) is proposed.
 * Server component; the movement form is a client island.
 */
import { Flame } from "lucide-react";
import Link from "next/link";
import type { Calibration } from "@/core/energy/calibration";
import type { Energy, MissingBody, Range } from "@/core/energy/energy";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, type Messages } from "@/i18n";
import { TEXT_LINK } from "@/ui/button";
import { Disclosure } from "@/ui/Disclosure";
import { Collapsible } from "@/ui/Collapsible";
import { CalibrationBox } from "./CalibrationBox";
import { EnergyFormulas } from "./EnergyFormulas";
import type { ComponentProps } from "react";

type Props = {
  energy: Energy | null;
  missing: MissingBody;
  /** kcal eaten, and eaten + planned (exact strings). */
  eaten: string;
  withPlanned: string;
  /** A dynamic day's parameters and targets, for the formulas. */
  dynamic: ComponentProps<typeof EnergyFormulas>["dynamic"];
  /** ADR-0020: the accepted factor on the baseline (1 = none). */
  correction: number;
  /** ADR-0020: the last 28 days against the model (today's page only). */
  calibration: Calibration | null;
  setCorrection: (factor: number) => Promise<{ ok: boolean; message?: string }>;
  locale: Locale;
  t: Pick<Messages, "energy" | "errors" | "actions">;
};

export function EnergySection({
  energy,
  missing,
  eaten,
  withPlanned,
  dynamic,
  correction,
  calibration,
  setCorrection,
  locale,
  t,
}: Props) {
  const e = t.energy;
  const n = (v: number) => formatNumber(String(v), locale, 0);
  const range = (x: Range) =>
    x.low === x.high ? `${n(x.low)} kcal` : `${n(x.low)}–${n(x.high)} kcal`;
  const balance = (intake: string, out: Range) => {
    const kcal = Number(intake);
    const sign = (v: number) => (v > 0 ? `+${n(v)}` : n(v));
    return fill(e.balanceText, {
      lo: sign(Math.round(kcal - out.high)),
      hi: sign(Math.round(kcal - out.low)),
    });
  };
  const row = (label: string, value: string, strong = false) => (
    <li
      className={`flex items-baseline justify-between gap-3 ${strong ? "font-semibold" : ""}`}
    >
      <span className={strong ? "" : "text-muted"}>{label}</span>
      <span className="shrink-0 font-display whitespace-nowrap tabular-nums">
        {value}
      </span>
    </li>
  );
  return (
    <Collapsible
      id="day-energy"
      title={e.title}
      icon={<Flame size={20} aria-hidden="true" />}
      aside={energy ? range(energy.total.withPlan) : undefined}
      // Closed, still informative (2026-10-02): what is spent, part by part,
      // against what is eaten, on one scale.
      summary={
        energy ? (
          <div className="flex flex-col gap-2">
            <EnergyBars
              energy={energy}
              eaten={Number(eaten)}
              withPlanned={Number(withPlanned)}
              t={e}
            />
            <p className="text-meta text-muted tabular-nums">
              {fill(e.closed, {
                spent: range(energy.total.done),
                balance: balance(withPlanned, energy.total.withPlan),
              })}
            </p>
          </div>
        ) : undefined
      }
      defaultOpen={false}
    >
      <p className="text-meta text-muted">{e.subtitle}</p>
      {!energy ? (
        <p className="text-meta">
          {fill(e.missing, { list: missing.map((m) => e.missingNames[m]).join(", ") })}{" "}
          <Link href="/settings" className={TEXT_LINK}>
            {e.openSettings}
          </Link>
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 @2xl:grid-cols-2">
          <ul className="flex flex-col gap-1 text-meta">
            {row(e.bmr, `${n(energy.bmr)} kcal`)}
            {row(
              correction === 1
                ? e.baseline
                : fill(e.baselineCorrected, {
                    factor: formatNumber(String(correction), locale, 2),
                  }),
              range(energy.baseline),
            )}
            {row(e.walking, range(energy.walking))}
            {row(e.trainingDone, range(energy.training.done))}
            {row(e.trainingPlanned, range(energy.training.planned))}
            {row(e.totalDone, range(energy.total.done), true)}
            {row(e.totalPlan, range(energy.total.withPlan), true)}
          </ul>
          <ul className="flex flex-col gap-1 text-meta">
            {row(e.eaten, `${n(Number(eaten))} kcal`)}
            {row(e.balance, balance(eaten, energy.total.done), true)}
            {row(e.withPlanned, `${n(Number(withPlanned))} kcal`)}
            {row(e.balance, balance(withPlanned, energy.total.withPlan), true)}
          </ul>
        </div>
      )}
      {energy && (
        <Disclosure summary={e.formulas.title}>
          <EnergyFormulas energy={energy} dynamic={dynamic} locale={locale} t={e} />
        </Disclosure>
      )}
      {/* The day's movement: one line here; the form is the page's sheet
          (#day-move, MovementSheet) — not inside this section, which hides
          its content when closed and would hide an open sheet with it. */}
      <p className="text-meta">
        <a href="#day-move" className={TEXT_LINK}>
          {e.activity}
        </a>
      </p>
      {calibration && calibration.verdict !== "no_body" && (
        <Disclosure
          summary={e.calibration.title}
          // Open by itself only when there is something to decide.
          defaultOpen={calibration.proposed !== null}
        >
          <CalibrationBox
            c={calibration}
            accept={setCorrection}
            locale={locale}
            t={e.calibration}
          />
        </Disclosure>
      )}
    </Collapsible>
  );
}

const mid = (r: Range) => (r.low + r.high) / 2;

/** Spent (everyday, steps, training done and planned) against eaten. */
function EnergyBars({
  energy,
  eaten,
  withPlanned,
  t,
}: {
  energy: Energy;
  eaten: number;
  withPlanned: number;
  t: Messages["energy"];
}) {
  // Fewer steps than the day type's usual lower the everyday part (ADR-0032).
  const everyday = Math.max(0, mid(energy.baseline) + Math.min(0, mid(energy.walking)));
  const steps = Math.max(0, mid(energy.walking));
  const done = mid(energy.training.done);
  const planned = mid(energy.training.planned);
  const scale = Math.max(everyday + steps + done + planned, withPlanned, 1);
  const pct = (v: number) => `${(v / scale) * 100}%`;
  const parts = [
    { label: t.baseline, v: everyday, cls: "bg-muscle-back" },
    { label: t.walking, v: steps, cls: "bg-muscle-legs" },
    { label: t.trainingDone, v: done, cls: "bg-muscle-chest" },
    { label: t.trainingPlanned, v: planned, cls: "bg-muscle-chest opacity-40" },
  ].filter((p) => p.v > 0);
  const bar = "flex h-3 w-full overflow-hidden rounded-badge bg-hairline";
  return (
    <div className="flex flex-col gap-1.5 text-meta" aria-hidden="true">
      <div className={bar}>
        {parts.map((p) => (
          <span key={p.label} className={`h-full ${p.cls}`} style={{ width: pct(p.v) }} />
        ))}
      </div>
      <div className={bar}>
        <span className="h-full bg-macro-carbs" style={{ width: pct(eaten) }} />
        <span
          className="h-full bg-macro-carbs opacity-40"
          style={{ width: pct(Math.max(0, withPlanned - eaten)) }}
        />
      </div>
      <ul className="flex flex-wrap gap-x-3 gap-y-0.5 text-muted">
        {[...parts, { label: t.eaten, v: eaten, cls: "bg-macro-carbs" }].map((p) => (
          <li key={p.label} className="inline-flex items-center gap-1">
            <span className={`inline-block h-2 w-2 rounded-full ${p.cls}`} />
            {p.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
