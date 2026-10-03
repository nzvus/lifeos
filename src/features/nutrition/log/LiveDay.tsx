/**
 * features/nutrition/log/LiveDay.tsx — the day's food that answers at once
 * (2026-10-03: "real time macros … modifying as you modify the food plan";
 * "it has to be more responsive").
 *
 * <LiveDay> holds the day's entries (status, servings, snapshot lines) in the
 * browser with React's useOptimistic: a tap on −/+ or on the round tick
 * changes them HERE first, so every number below redraws in the same frame;
 * the server action runs behind, and when the page comes back from the
 * server its data replaces the guess (or puts it back, if the action failed).
 * The sums are core's (core/nutrition/totals.ts entriesTotals): the same exact
 * arithmetic as the server, rounded once.
 *
 * Inside it:
 *   - LiveTotals: the day as planned — the five macros, eaten + planned
 *     against the day's zones (core/nutrition/bands), as ui/NutrientRow;
 *   - LiveStatusToggle, LiveServings: the tick and the −/+ of an entry;
 *   - LiveEntryStrip, LiveTimes, LiveGroupStrip, LiveGroupKcal: the numbers
 *     those change.
 */
"use client";

import { Circle, CircleCheck, ListChecks, Minus, Plus } from "lucide-react";
import {
  createContext,
  useContext,
  useOptimistic,
  useState,
  type ReactNode,
} from "react";
import { bandFor, bandState, type Band } from "@/core/nutrition/bands";
import { stripValues } from "@/core/nutrition/display";
import { NUTRIENT_UNIT, type NutrientKey } from "@/core/nutrition/nutrients";
import { servingsText, stepServings } from "@/core/nutrition/servings";
import { TARGET_KIND } from "@/core/nutrition/targets";
import { entriesTotals, type TotalsLine } from "@/core/nutrition/totals";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, type Messages } from "@/i18n";
import type { ActionButtonState } from "@/ui/ActionButtonForm";
import { MacroStrip, type MacroStripLabels } from "@/ui/MacroStrip";
import { NutrientIcon } from "@/ui/NutrientIcon";
import { NutrientRow } from "@/ui/NutrientRow";

export type LiveEntry = {
  id: string;
  status: "planned" | "eaten";
  servings: string;
  lines: TotalsLine[];
};

type Patch = { id: string; status?: LiveEntry["status"]; servings?: string };

const LiveContext = createContext<{
  entries: LiveEntry[];
  patch: (p: Patch) => void;
} | null>(null);

export function LiveDay({
  entries,
  children,
}: {
  entries: LiveEntry[];
  children: ReactNode;
}) {
  const [live, patch] = useOptimistic(entries, (state: LiveEntry[], p: Patch) =>
    state.map((e) => (e.id === p.id ? { ...e, ...p } : e)),
  );
  return (
    <LiveContext.Provider value={{ entries: live, patch }}>
      {children}
    </LiveContext.Provider>
  );
}

function useLive() {
  return useContext(LiveContext)!;
}

function useEntry(id: string): LiveEntry | undefined {
  return useLive().entries.find((e) => e.id === id);
}

/** The round tick (ADR-0009): planned ↔ eaten, shown flipped at once. */
export function LiveStatusToggle({
  id,
  toEaten,
  toPlanned,
  future = false,
  labels,
}: {
  id: string;
  /** Server actions, bound to the entry and the status they set. */
  toEaten: (prev: ActionButtonState, formData: FormData) => Promise<ActionButtonState>;
  toPlanned: (prev: ActionButtonState, formData: FormData) => Promise<ActionButtonState>;
  /** A day still to come: planned food can't be ticked as eaten. */
  future?: boolean;
  labels: { markEaten: string; markPlanned: string; future: string };
}) {
  const { patch } = useLive();
  const entry = useEntry(id);
  const [error, setError] = useState<string | null>(null);
  const eaten = entry?.status === "eaten";
  const locked = future && !eaten;
  const label = locked ? labels.future : eaten ? labels.markPlanned : labels.markEaten;
  return (
    <form
      action={async (formData) => {
        setError(null);
        patch({ id, status: eaten ? "planned" : "eaten" });
        const result = await (eaten ? toPlanned : toEaten)({ status: "idle" }, formData);
        if (result.status === "error") setError(result.message);
      }}
    >
      <button
        type="submit"
        disabled={locked}
        aria-pressed={eaten}
        aria-label={label}
        title={error ?? label}
        className={`p-1 disabled:opacity-50 ${eaten ? "text-herb" : "text-muted"}`}
      >
        {eaten ? (
          <CircleCheck size={24} aria-hidden="true" />
        ) : (
          <Circle size={24} aria-hidden="true" />
        )}
      </button>
    </form>
  );
}

/** −  × n  + : the entry's multiplier, one tap at a time (core/nutrition/servings). */
export function LiveServings({
  id,
  action,
  locale,
  t,
}: {
  id: string;
  /** The server action, bound to the entry; reads `servings`. */
  action: (formData: FormData) => Promise<void>;
  locale: Locale;
  t: Pick<Messages["day"], "servingsTimes" | "servingsMore" | "servingsLess">;
}) {
  const { patch } = useLive();
  const current = Number(useEntry(id)?.servings ?? 1);
  const step = (dir: 1 | -1) => {
    const next = stepServings(current, dir);
    return (
      <button
        key={dir}
        type="submit"
        name="servings"
        value={next ?? ""}
        disabled={next === null}
        aria-label={fill(dir === 1 ? t.servingsMore : t.servingsLess, {
          n: next === null ? "" : formatNumber(String(next), locale, 2),
        })}
        className="tile inline-flex h-9 w-9 items-center justify-center rounded-control disabled:opacity-40"
      >
        {dir === 1 ? (
          <Plus size={16} aria-hidden="true" />
        ) : (
          <Minus size={16} aria-hidden="true" />
        )}
      </button>
    );
  };
  return (
    <form
      action={async (formData) => {
        const next = formData.get("servings");
        if (typeof next === "string" && next) patch({ id, servings: next });
        await action(formData);
      }}
      className="relative z-2 flex shrink-0 items-center gap-1"
    >
      {step(-1)}
      <span className="min-w-10 text-center font-display font-semibold tabular-nums">
        {fill(t.servingsTimes, { n: servingsText(current, locale) })}
      </span>
      {step(1)}
    </form>
  );
}

/** "× 2" after the entry's name, when not 1. */
export function LiveTimes({
  id,
  locale,
  t,
}: {
  id: string;
  locale: Locale;
  t: Pick<Messages["day"], "servingsTimes">;
}) {
  const servings = Number(useEntry(id)?.servings ?? 1);
  if (servings === 1) return null;
  return (
    <span className="pl-2 font-display text-muted">
      {fill(t.servingsTimes, { n: servingsText(servings, locale) })}
    </span>
  );
}

/** One entry's energy and macros at its current servings. */
export function LiveEntryStrip({
  id,
  locale,
  labels,
}: {
  id: string;
  locale: Locale;
  labels: MacroStripLabels;
}) {
  const entry = useEntry(id);
  if (!entry) return null;
  return (
    <MacroStrip
      values={stripValues(entriesTotals([entry]).nutrients, locale)}
      labels={labels}
    />
  );
}

/** A moment of the day: its entries' energy and macros together. */
export function LiveGroupStrip({
  ids,
  locale,
  labels,
}: {
  ids: string[];
  locale: Locale;
  labels: MacroStripLabels;
}) {
  const entries = useLive().entries.filter((e) => ids.includes(e.id));
  return (
    <MacroStrip
      values={stripValues(entriesTotals(entries).nutrients, locale)}
      labels={labels}
    />
  );
}

/** A moment's eaten kcal ("{v} kcal eaten"), as the header of its group. */
export function LiveGroupKcal({
  ids,
  locale,
  text,
}: {
  ids: string[];
  locale: Locale;
  /** With {v}: the moments' subtotal line. */
  text: string;
}) {
  const eaten = useLive().entries.filter(
    (e) => ids.includes(e.id) && e.status === "eaten",
  );
  return (
    <>{fill(text, { v: formatNumber(entriesTotals(eaten).nutrients.kcal, locale, 0) })}</>
  );
}

const MACROS = ["kcal", "protein", "carbs", "fat", "fiber"] as const;

/**
 * The day as planned, live: per macro the whole plan (eaten + planned) as
 * the amount and the state, what is already eaten as the solid bar, the plan
 * as its shadow (ui/NutrientRow) — the same zones as the Summary's panel.
 */
export function LiveTotals({
  targets,
  bands,
  locale,
  t,
}: {
  /** The day's targets (with auto ones), null where none. */
  targets: Record<(typeof MACROS)[number], number | null>;
  bands?: Partial<Record<NutrientKey, Band>>;
  locale: Locale;
  t: Pick<Messages, "nutrients" | "panel">;
}) {
  const { entries } = useLive();
  const eaten = entriesTotals(entries.filter((e) => e.status === "eaten")).nutrients;
  const plan = entriesTotals(entries).nutrients;
  return (
    <section
      aria-labelledby="live-totals-title"
      className="panel flex flex-col gap-3 p-4"
    >
      <h2 id="live-totals-title" className="section-heading">
        <span className="section-icon">
          <ListChecks size={20} aria-hidden="true" />
        </span>
        {t.panel.liveTitle}
      </h2>
      <div className="flex flex-col gap-3">
        {MACROS.map((k) => {
          const v = Number(plan[k]);
          const done = Number(eaten[k]);
          const target = targets[k];
          const band = bandFor(bands?.[k], target, TARGET_KIND[k]);
          const state = bandState(v, band);
          const u = NUTRIENT_UNIT[k];
          const g = (n: number) =>
            `${formatNumber(String(Math.round(n)), locale, 0)} ${u}`;
          const status = !band
            ? undefined
            : state === "short"
              ? fill(t.panel.toGo, {
                  v: g((k === "kcal" && target ? target : band.low) - v),
                })
              : state === "good"
                ? t.panel.inZone
                : state === "high"
                  ? fill(t.panel.aboveZone, { v: g(band.high) })
                  : fill(t.panel.past, { v: g(band.ceiling) });
          return (
            <NutrientRow
              key={k}
              icon={<NutrientIcon name={k} />}
              label={t.nutrients[k]}
              amount={
                target === null
                  ? g(v)
                  : `${formatNumber(String(Math.round(v)), locale, 0)} / ${g(target)}`
              }
              status={
                done !== v
                  ? [status, fill(t.panel.liveEaten, { v: g(done) })]
                      .filter(Boolean)
                      .join(" · ")
                  : status
              }
              state={state}
              eaten={done}
              withPlan={v}
              zone={band ? { low: band.low, high: band.high } : null}
              max={band ? Math.max(band.ceiling * 1.15, v, target ?? 0) || 1 : 1}
            />
          );
        })}
      </div>
    </section>
  );
}
