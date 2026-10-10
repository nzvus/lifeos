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
 *   - LiveStatusToggle, LiveCountToggle, LiveServings: the tick, "in the
 *     total" (planned only) and the −/+ of an entry;
 *   - LiveEntryStrip, LiveTimes, LiveGroupStrip, LiveGroupKcal: the numbers
 *     those change.
 */
"use client";

import { Circle, CircleCheck, Eye, EyeOff, ListChecks, Minus, Plus } from "lucide-react";
import {
  createContext,
  useContext,
  useOptimistic,
  useState,
  type ReactNode,
} from "react";
import { bandFor, bandState, toGoFrom, type Band } from "@/core/nutrition/bands";
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
import { InfoTip } from "@/ui/InfoTip";
import { NutrientBar } from "@/ui/NutrientBar";

export type LiveEntry = {
  id: string;
  status: "planned" | "eaten";
  /** Planned but left out of the plan's total (2026-10-04). */
  leftOut?: boolean;
  servings: string;
  lines: TotalsLine[];
};

type Patch = {
  id: string;
  status?: LiveEntry["status"];
  servings?: string;
  leftOut?: boolean;
};

/** What the plan's totals count: eaten food, and the planned not left out. */
const counted = (e: LiveEntry) => e.status === "eaten" || !e.leftOut;

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

/**
 * In the total or not (2026-10-04): a planned entry can be left out of the
 * plan's totals, e.g. the dishes of a menu still to choose from. Shown only
 * while the entry is planned; flipped at once, saved behind.
 */
export function LiveCountToggle({
  id,
  action,
  labels,
}: {
  id: string;
  /** Server action: (entry id, left out?). */
  action: (id: string, out: boolean) => Promise<{ ok: boolean; message?: string }>;
  labels: { counted: string; leftOut: string };
}) {
  const { patch } = useLive();
  const entry = useEntry(id);
  const [error, setError] = useState<string | null>(null);
  if (!entry || entry.status !== "planned") return null;
  const out = Boolean(entry.leftOut);
  const label = out ? labels.leftOut : labels.counted;
  return (
    <form
      action={async () => {
        setError(null);
        patch({ id, leftOut: !out });
        const r = await action(id, !out);
        if (!r.ok) setError(r.message ?? "");
      }}
    >
      <button
        type="submit"
        aria-pressed={!out}
        aria-label={label}
        title={error ?? label}
        className={`p-0.5 ${out ? "text-muted" : "text-muted hover:text-ink"}`}
      >
        {out ? (
          <EyeOff size={16} aria-hidden="true" />
        ) : (
          <Eye size={16} aria-hidden="true" />
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
  const entries = useLive().entries.filter((e) => ids.includes(e.id) && counted(e));
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

/** Every nutrient, in label order: the macros, then the limits after their macro. */
const ROWS = [
  "kcal",
  "protein",
  "carbs",
  "sugars",
  "fat",
  "saturatedFat",
  "fiber",
  "salt",
] as const satisfies readonly NutrientKey[];
const SUB = new Set<NutrientKey>(["sugars", "saturatedFat"]);

/**
 * The day as planned, live and compact (2026-10-04: "almost only bars"): per
 * nutrient one line — the whole plan (eaten + planned) against the zone and
 * the limit, eaten solid, the plan lighter (ui/NutrientBar); the words of
 * the state stay for screen readers and the tooltip.
 */
export function LiveTotals({
  targets,
  bands,
  locale,
  t,
}: {
  /** The day's targets (with auto ones), null where none. */
  targets: Record<(typeof ROWS)[number], number | null>;
  bands?: Partial<Record<NutrientKey, Band>>;
  locale: Locale;
  t: Pick<Messages, "nutrients" | "panel" | "macro">;
}) {
  const { entries } = useLive();
  const eaten = entriesTotals(entries.filter((e) => e.status === "eaten")).nutrients;
  const plan = entriesTotals(entries.filter(counted)).nutrients;
  return (
    <section
      aria-labelledby="live-totals-title"
      className="panel flex flex-col gap-2 p-4"
    >
      <h2 id="live-totals-title" className="section-heading">
        <span className="section-icon">
          <ListChecks size={20} aria-hidden="true" />
        </span>
        {t.panel.liveTitle}
        <span className="ml-auto font-sans text-meta normal-case">
          <InfoTip label={t.panel.legend}>{t.panel.liveLegend}</InfoTip>
        </span>
      </h2>
      <div className="flex flex-col gap-2">
        {ROWS.map((k) => {
          const v = Number(plan[k]);
          const done = Number(eaten[k]);
          const target = targets[k];
          const band = bandFor(bands?.[k], target, TARGET_KIND[k]);
          const state = bandState(v, band);
          const u = NUTRIENT_UNIT[k];
          const d = k === "salt" ? 1 : 0;
          const g = (n: number) => `${formatNumber(String(n), locale, d)} ${u}`;
          const status = !band
            ? undefined
            : state === "short"
              ? fill(t.panel.toGo, {
                  v: g(toGoFrom(target, band.low) - v),
                })
              : state === "good"
                ? t.panel.inZone
                : state === "high"
                  ? fill(t.panel.aboveZone, { v: g(band.high) })
                  : fill(t.panel.past, { v: g(band.ceiling) });
          // A limit is drawn where it is a health maximum.
          const limit = band && band.ceilingKind === "health" ? band.ceiling : null;
          return (
            <NutrientBar
              key={k}
              icon={<NutrientIcon name={k} size={SUB.has(k) ? 12 : 14} />}
              label={t.macro.short[k]}
              sub={SUB.has(k)}
              amount={
                target === null
                  ? g(v)
                  : `${formatNumber(String(v), locale, d)} / ${g(target)}`
              }
              status={[
                `${t.nutrients[k]}: ${g(v)}`,
                status,
                done !== v && fill(t.panel.liveEaten, { v: g(done) }),
              ]
                .filter(Boolean)
                .join(" · ")}
              state={state}
              eaten={done}
              withPlan={v}
              // A limit (sugars, saturated fat, salt) has no zone to reach: its tick.
              zone={
                band && TARGET_KIND[k] !== "max"
                  ? { low: band.low, high: band.high }
                  : null
              }
              limit={limit}
              max={Math.max(band ? band.ceiling * 1.15 : 0, v, target ?? 0) || 1}
            />
          );
        })}
      </div>
    </section>
  );
}
