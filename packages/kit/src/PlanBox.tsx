"use client";
/**
 * The one builder of a thing's Box (Deliver ③, proposal §132; PAT-30, VIS-40, VIS-102): the caller
 * gives its slots already in its plan's order, each in the shape of its instrument, and this draws
 * every slot the same way for every type — never by type (PAT-81):
 * - `word: string` → a door that only says its value (a name, NOVA 1);
 * - `words: string[]` → a sideways `ChipRow` of names, open, before the doors (facts, members);
 * - `trend` → a door with the last value, its `Chart` behind it when there are two points or more;
 * - `nutrients` → a door with its `Nutrients` behind it;
 * - `rows` → a door with the count, the members as their own Box rows behind it (a meal's cibi).
 * `variants` are a thing's children he picks (a cibo's marche, §132 (b)): each has its own head
 * and slots; one is on at first (the caller's rule), a tap on another redraws the Box with it.
 */
import { useState } from "react";
import { Chart, type ChartData } from "./Chart";
import { ChipRow } from "./ChipRow";
import { Criteria } from "./Criteria";
import { Nutrients } from "./Nutrients";
import type { NutrientsData } from "./nutrient-rows";
import { ThingBox, type ThingBoxPlace } from "./ThingBox";
import { Box, type BoxDoor, type BoxEntry } from "./Box";
import { List } from "./List";
import { Glyph } from "./Glyph";
import { WORDS } from "./words";
import type { ReactNode } from "react";

type Base = { key: string; label: string };
export type PlanSlot =
  | (Base & { word: string })
  | (Base & { words: string[] })
  | (Base & { trend: ChartData; value: string; caption?: string })
  | (Base & { nutrients: NutrientsData; value?: string })
  | (Base & { rows: BoxEntry[]; value?: string });

/**
 * One of the box's actions (PAT-101): a verb (a button or a link), a value he steps (porzioni),
 * or a danger verb, drawn as an icon at the row's end (Elimina = the trash; `label` its aria).
 */
export type PlanAction = { key: string; label: string } & (
  | {
      onClick: () => void;
      aria?: string;
      danger?: "delete";
      /** A mode he switches (the bar's «Ingredienti» · «Nutrienti»): a chip, on or off. */
      pressed?: boolean;
      /** A verb drawn as its icon in its own colour, with the row's other icons (§172: «Unisci»). */
      icon?: "merge";
    }
  | {
      href: string;
      /**
       * A link drawn as an icon, at the row's end with the trash (his §145, §167; `label` its
       * aria): «link» its page (last), «why» how it is judged (?), «log» it put in the day.
       */
      icon?: "link" | "why" | "log";
    }
  | {
      step: { value: string; minus: string; plus: string };
      onMinus: () => void;
      onPlus: () => void;
    }
);

/** The actions row (PAT-101): sideways, never wrapping; the danger verbs last, as icons. */
export function ActionRow({ actions }: { actions: PlanAction[] }) {
  if (actions.length === 0) return null;
  const danger = (a: PlanAction) => "danger" in a && !!a.danger;
  const icon = (a: PlanAction) => "icon" in a && !!a.icon;
  const page = (a: PlanAction) => "icon" in a && a.icon === "link";
  // the words first; then the icons — registra, «?», the trash — and the page last (§167)
  const ordered = [
    ...actions.filter((a) => !danger(a) && !icon(a)),
    ...actions.filter((a) => icon(a) && !page(a)),
    ...actions.filter(danger),
    ...actions.filter(page),
  ];
  return (
    <div className="k-hrow k-actrow" role="group" aria-label={WORDS.actions}>
      {ordered.map((a) =>
        "step" in a ? (
          <span
            key={a.key}
            className="k-line g1 k-step"
            role="group"
            aria-label={a.label}
          >
            <button
              type="button"
              className="k-btn act"
              aria-label={a.step.minus}
              onClick={a.onMinus}
            >
              −
            </button>
            <span className="k-num" aria-live="polite">
              {a.step.value}
            </span>
            <button
              type="button"
              className="k-btn act"
              aria-label={a.step.plus}
              onClick={a.onPlus}
            >
              +
            </button>
          </span>
        ) : "href" in a && a.icon ? (
          <a
            key={a.key}
            className={"k-btn act icon " + a.icon}
            href={a.href}
            aria-label={a.label}
          >
            <Glyph of={{ ui: a.icon }} decorative />
          </a>
        ) : "href" in a ? (
          <a key={a.key} className="k-btn act" href={a.href}>
            {a.label}
          </a>
        ) : "onClick" in a && a.icon ? (
          <button
            key={a.key}
            type="button"
            className={"k-btn act icon " + a.icon}
            aria-label={a.aria ?? a.label}
            title={a.label}
            onClick={a.onClick}
          >
            <Glyph of={{ ui: a.icon }} decorative />
          </button>
        ) : a.danger ? (
          <button
            key={a.key}
            type="button"
            className="k-btn act icon danger"
            aria-label={a.aria ?? a.label}
            title={a.label}
            onClick={a.onClick}
          >
            <Glyph of={{ ui: a.danger }} decorative />
          </button>
        ) : (
          <button
            key={a.key}
            type="button"
            className={a.pressed === undefined ? "k-btn act" : "k-chip"}
            {...(a.pressed === undefined ? {} : { "aria-pressed": a.pressed })}
            {...(a.aria ? { "aria-label": a.aria } : {})}
            onClick={a.onClick}
          >
            {a.label}
          </button>
        ),
      )}
    </div>
  );
}

export type PlanVariant = {
  key: string;
  /** Its chip: its name, and a short value beside it (a price). */
  label: string;
  meta?: string;
  /** What it changes in the head (its number, its voto). */
  head?: Partial<Pick<BoxEntry, "value" | "score" | "meta">>;
  slots: PlanSlot[];
  /** Its own bars (PAT-102 zone 2), in place of the box's when it is the one on. */
  before?: ReactNode;
};

/** A slot drawn as a door, or null when it is a row of names (drawn above the doors). */
export function slotDoor(s: PlanSlot): BoxDoor | null {
  if ("words" in s) return null;
  if ("word" in s) return { key: s.key, label: s.label, value: s.word };
  if ("trend" in s)
    return {
      key: s.key,
      label: s.label,
      value: s.value,
      ...(s.trend.y.length > 1
        ? {
            panel: (
              <Chart
                type="trend"
                data={s.trend}
                {...(s.caption ? { caption: s.caption } : {})}
              />
            ),
          }
        : {}),
    };
  if ("rows" in s)
    return {
      key: s.key,
      label: s.label,
      value: s.value ?? String(s.rows.length),
      panel: (
        <List label={s.label}>
          {s.rows.map((e, i) => (
            <Box key={i} density="row" rail={false} entry={e} />
          ))}
        </List>
      ),
    };
  return {
    key: s.key,
    label: s.label,
    ...(s.value ? { value: s.value } : {}),
    panel: <Nutrients data={s.nutrients} />,
  };
}

export function PlanBox({
  entry,
  slots = [],
  variants,
  picked,
  variantsLabel = "",
  children,
  actions = [],
  before,
  between,
  xor,
  ...place
}: ThingBoxPlace & {
  entry: BoxEntry;
  /** In the plan's order; a slot with no data is left out by the caller (PRD-22). */
  slots?: PlanSlot[];
  variants?: PlanVariant[];
  /** The variant on at first; the first when missing. */
  picked?: string;
  /** The variants' row's name, for a screen reader only (ChipRow). */
  variantsLabel?: string;
  /** Open, before the variants and the names (a meal's four thin bars, a place's own line). */
  children?: ReactNode;
  /** Open, first: what can be done to it here (PAT-101), from its rows in `orca/actions.md`. */
  actions?: PlanAction[];
  /** Open, above the actions: the type's bars (PAT-102 zones 2 and 3). */
  before?: ReactNode;
  /** Open, after the voto and above the actions: a thing's own rows (its kin, PAT-103). */
  between?: ReactNode;
  /**
   * The last band, two halves of which one is on (his §169–§170): the view the bars show now is
   * hatched while it is shut; a tap on a half shows that view and opens its band under it (a fixed
   * height that scrolls inside), filled; a tap on the open one shuts it.
   */
  xor?: {
    items: { key: string; label: string }[];
    current: string;
    open: boolean;
    onPick: (key: string) => void;
    panel: ReactNode;
  };
}) {
  const vs = variants ?? [];
  const [key, setKey] = useState(() => picked ?? vs[0]?.key);
  const v = vs.find((x) => x.key === key);
  // The choice is one chip in the actions row that opens its list in place (PAT-102 zone 4; his
  // 20–21 Nov: «la marca che crea tutto quello spazio»); a pick closes it.
  const [choosing, setChoosing] = useState(false);
  const shown = v ? v.slots : slots;
  const doors = shown.flatMap((s) => {
    const d = slotDoor(s);
    return d ? [d] : [];
  });
  // Its page: the last, small icon of its actions row, never a column of its own (his §145).
  const { href, hrefLabel, ...rest } = { ...entry, ...(v?.head ?? {}) };
  const headEntry = rest;
  const all: PlanAction[] = [
    ...(v
      ? [
          vs.length > 1
            ? {
                key: "choice",
                label: v.label + (v.meta ? " · " + v.meta : "") + " ▾",
                aria: variantsLabel + ": " + v.label,
                pressed: choosing,
                onClick: () => setChoosing((c) => !c),
              }
            : // One alone is named, nothing to choose: a plain chip (its marca, §152).
              {
                key: "choice",
                label: v.label + (v.meta ? " · " + v.meta : ""),
                aria: variantsLabel + ": " + v.label,
                pressed: false,
                onClick: () => {},
              },
        ]
      : []),
    ...actions,
    // «Come valutiamo» as «?» in the actions row (his §167), not a link under the voto
    ...(headEntry.score?.how
      ? [
          {
            key: "why",
            label: WORDS.scoreHow.replace(/\s*›$/, ""),
            href: headEntry.score.how,
            icon: "why" as const,
          },
        ]
      : []),
    ...(href
      ? [
          {
            key: "page",
            label: hrefLabel ?? "Apri " + entry.title,
            href,
            icon: "link" as const,
          },
        ]
      : []),
  ];
  const rows = shown.flatMap((s) => ("words" in s && s.words.length > 0 ? [s] : []));
  return (
    <ThingBox {...place} entry={headEntry} doors={doors} votoElsewhere bands>
      {/* The zones in one column, one gap between any two (PAT-102; his §148: bars always had
          nothing between them and what came under). */}
      <div className="k-zones">
        {/* zones 2 and 3 in one band: the type's bar and the voto in full (his §161, §172) */}
        <div className="k-stack g2 k-bars">
          {v?.before ?? before}
          {headEntry.score && headEntry.score.value !== null && (
            <Criteria data={headEntry.score} planned={!!headEntry.planned} howInRow />
          )}
        </div>
        {/* a thing's own rows above the actions (its kin, PAT-103; his §161) */}
        {between}
        <ActionRow actions={all} />
        {xor && (
          <div className="k-xor" role="group">
            {xor.items.map((i) => (
              <button
                key={i.key}
                type="button"
                className={
                  "k-xorhalf" + (i.key === xor.current ? (xor.open ? " on" : " now") : "")
                }
                aria-pressed={xor.open && i.key === xor.current}
                onClick={() => xor.onPick(i.key)}
              >
                {i.label}
              </button>
            ))}
          </div>
        )}
        {xor?.open && <div className="k-xorpanel">{xor.panel}</div>}
        {children}
        {choosing && (
          <ChipRow
            label={variantsLabel}
            {...(key ? { selected: key } : {})}
            onPick={(k) => {
              setKey(k);
              setChoosing(false);
            }}
            items={vs.map((x) => ({
              key: x.key,
              label: x.label,
              ...(x.meta ? { value: x.meta } : {}),
            }))}
          />
        )}
        {rows.map((s) => (
          <ChipRow
            key={s.key}
            label={s.label}
            items={s.words.map((w, i) => ({ key: i + ":" + w, label: w }))}
          />
        ))}
      </div>
    </ThingBox>
  );
}
