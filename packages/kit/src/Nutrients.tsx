"use client";
/**
 * Nutrients, level L1 (kit.md §4): the boards' markup, drawn from
 * `nutrientsL1` (nutrient-rows.ts). A macro row opens on the box's transition into its kinds,
 * where it came from and its notes. `NutrientsL0`: a meal box's four thin bars.
 * L2 (a meal's window, `data.foods`): the foods as chips; one tapped is
 * highlighted in every bar and in «da dove», each kind says where it came from.
 * Pass plain data (server pages may render it).
 */
import { NumUnit } from "./NumUnit";
import { useState, type CSSProperties } from "react";
import { Glyph } from "./Glyph";
import { Verdict } from "./Verdict";
import { FitLine } from "./FitLine";
import {
  energyL1,
  HEAT_WORDS,
  NAME,
  nutrientsL0,
  nutrientsL1,
  type NutrientsData,
} from "./nutrient-rows";
import { Condensed } from "./Condensed";
import { Fascia } from "./Fascia";
import { WORDS } from "./words";

/**
 * `part`: «main» the kcal, the foods and the four macros; «rest» the limits and the vitamins
 * and minerals (a day that keeps them behind a door, VIS-40); «all» by default.
 */
export function Nutrients({
  data,
  part = "all",
  lit,
  chips = true,
  onTap,
  inline = false,
  by = "foods",
  focus,
  picked,
  onPick,
  litCells = null,
  openFirst,
}: {
  data: NutrientsData;
  part?: "all" | "main" | "rest";
  /** The part lit by its place, the rest dimmed (a meal in its day, §143); overrides a tap. */
  lit?: string | null;
  /** false: no row of parts to tap (the meal box lights its part itself). */
  chips?: boolean;
  /** A tap on the bars goes to the next level (drill down · roll up, VIS-70; §143). */
  onTap?: () => void;
  /** The four macros side by side on one row, each its icon, number and track (his §145). */
  inline?: boolean;
  /** The bars split by «foods» or by «kinds» of nutrient (VIS-106, his §169–§170). */
  by?: "foods" | "kinds";
  /** Only this macro's kinds and sources (a box's «Nutrienti» band, his §172). */
  focus?: string | null;
  /** Inline: the macro cell picked (its kinds shown below), and a tap on a cell picks it. */
  picked?: string | null;
  onPick?: (key: string) => void;
  /** Inline: only these cells lit, the rest dimmed (a criterion picked, his §189 F3). */
  litCells?: string[] | null;
  /** A row open from the start («micro»: the box's «Micro» band shows them at once, §174). */
  openFirst?: string;
}) {
  const main = part !== "rest";
  const rest = part !== "main";
  const [open, setOpen] = useState<string | null>(openFirst ?? null);
  const [sel, setSel] = useState<string | null>(null);
  const { kcal, foods, macros, limits, micros } = nutrientsL1(
    data,
    lit !== undefined ? lit : sel,
    by,
  );
  const means = limits.some((l) => l.strip?.mean);
  const energy = inline || focus === KCAL ? energyL1(data, by) : null;
  return (
    <div className="k-stack g3">
      {main && kcal && !inline && focus === undefined && (
        <div className="k-stack">
          <span className="k-line base between">
            <span className="k-line base">
              <Glyph of={{ nutrient: "kcal" }} size="m" />
              <span className="k-num d2">{kcal.v}</span>
              {kcal.withPlan && (
                <span className="k-num d2 k-plan">→ {kcal.withPlan}</span>
              )}
              {kcal.t && <span className="k-meta k-nowrap">/ {kcal.t}</span>}
            </span>
          </span>
          {kcal.bar && (
            <span
              className={"k-track" + (kcal.strip ? " zoned" : "")}
              role="img"
              aria-label={kcal.aria}
            >
              <span
                className="k-seg kcal"
                style={{
                  width: kcal.bar.w,
                  ...(kcal.ramp
                    ? { backgroundImage: kcal.ramp.image, backgroundSize: kcal.ramp.size }
                    : {}),
                }}
              />
              <span className="k-seg kcal planned" style={{ width: kcal.bar.pw }} />
              {kcal.mark && <span className="k-mark" style={{ left: kcal.mark }} />}
              {kcal.strip && <Fascia strip={kcal.strip} />}
            </span>
          )}
          {/* Under the bar, never beside the number: at 320 px it ran into «/ 2.105 kcal». */}
          {kcal.left && <span className="k-help">{kcal.left}</span>}
        </div>
      )}
      {main && chips && foods.length > 1 && (
        <div className="k-chips" aria-label="Cibi: tocca per evidenziarne il contributo">
          {foods.map((f, n) => (
            <button
              // The same food can come twice (a role's meals together): the key keeps its place.
              key={f.key + ":" + n}
              type="button"
              className="k-chip k-nfood"
              aria-pressed={f.pressed}
              onClick={() => setSel(f.pressed ? null : f.key)}
            >
              <span className="k-sw" style={{ opacity: f.tone }} />
              <span className="k-clip">{f.name}</span>
              <span className="k-meta">{f.amount}</span>
            </button>
          ))}
        </div>
      )}
      {focus !== undefined &&
        (() => {
          if (focus === MICRO)
            return micros ? <MicroColumns micros={micros} limits={limits} /> : null;
          if (focus === KCAL) return energy ? <EnergyColumns e={energy} /> : null;
          const m = macros.find((x) => x.key === focus);
          return m ? <MacroColumns m={m} /> : null;
        })()}
      {main && inline && (
        <div className={"k-ninline" + (onPick ? " rows" : "")}>
          {/* the kcal first, a cell like the macros' (his §178): picked, where they come from */}
          {onPick && energy && (
            <button
              type="button"
              className={
                "k-mcell kcal" +
                (picked === KCAL ? " picked" : "") +
                (litCells && !litCells.includes(KCAL) ? " dim" : "")
              }
              aria-pressed={picked === KCAL}
              aria-label={energy.aria}
              onClick={() => onPick(KCAL)}
            >
              <FitLine className="k-line g1">
                <Glyph of={{ nutrient: "kcal" }} size="s" />
                <NumUnit v={energy.short} className="b3" />
                <Verdict level={energy.level} />
              </FitLine>
              <More
                name={WORDS.energy}
                word={energy.level ? HEAT_WORDS[energy.level] : null}
              />
              <span className="k-track" aria-hidden="true">
                {energy.segs.map((x, i) => (
                  <span
                    key={i}
                    className="k-seg"
                    style={{ width: x.w, background: x.bg }}
                  />
                ))}
              </span>
            </button>
          )}
          {macros.map((m) => (
            <button
              key={m.key}
              type="button"
              className={
                "k-mcell" +
                (picked === m.key ? " picked" : "") +
                (litCells && !litCells.includes(m.key) ? " dim" : "")
              }
              style={{ "--mc": m.color } as CSSProperties}
              {...(onPick
                ? { onClick: () => onPick(m.key), "aria-pressed": picked === m.key }
                : onTap
                  ? { onClick: onTap }
                  : {})}
              aria-label={m.aria}
            >
              <FitLine className="k-line g1">
                <Glyph of={{ nutrient: m.key }} size="s" />
                <NumUnit v={m.short} className="b3" />
                <Verdict level={m.level} />
              </FitLine>
              <More
                name={NAME[m.key]}
                word={m.level ? HEAT_WORDS[m.level] : null}
                share={energy?.byMacro.find((x) => x.key === m.key)?.w}
              />
              <MacroTrack m={m} full />
            </button>
          ))}
          {/* the fifth cell: vitamins and minerals, picked like a macro (his §173–§174) */}
          {onPick && micros && (
            <button
              type="button"
              className={
                "k-mcell micro" +
                (picked === MICRO ? " picked" : "") +
                (litCells && !litCells.includes(MICRO) ? " dim" : "")
              }
              aria-pressed={picked === MICRO}
              aria-label={WORDS.micro + ": " + micros.summary}
              onClick={() => onPick(MICRO)}
            >
              <FitLine className="k-line g1">
                <Glyph of={{ nutrient: "micro" }} size="s" />
                <span className="k-num b3">{coverage(micros.summary)}</span>
                {/* a meal's micros are not judged (FD-35): the dash, as every cell has its mark */}
                <Verdict level={null} />
              </FitLine>
              <More name={WORDS.microAll} word={null} />
              <span className="k-track" aria-hidden="true">
                <span
                  className="k-seg micro"
                  style={{ width: coveredPct(micros.summary) }}
                />
              </span>
            </button>
          )}
        </div>
      )}
      {(main && !inline && focus === undefined ? macros : []).map((m) => {
        const isOpen = open === m.key;
        const more = m.kinds.length + m.sources.length + m.extras.length > 0;
        return (
          <div key={m.key} className="k-nrow">
            <button
              type="button"
              className="k-mrow"
              onClick={
                onTap ? onTap : more ? () => setOpen(isOpen ? null : m.key) : undefined
              }
              aria-expanded={!onTap && more ? isOpen : undefined}
            >
              <FitLine className="k-line between">
                <span className="k-line">
                  <span className="k-micon">
                    <Glyph of={{ nutrient: m.key }} size="m" />
                  </span>
                  <span className="k-label">{m.name}</span>
                </span>
                <span className="k-num b2">
                  {m.value}
                  {m.withPlan && <span className="k-plan"> → {m.withPlan}</span>}
                  {m.target && <span className="k-meta"> / {m.target}</span>}
                  {/* Its verdict's chevrons, as in a meal's row (his §146: «aggiungerei lo stesso le
                      freccette»); none where nothing judges it. */}
                  {m.level && (
                    <>
                      {" "}
                      <Verdict level={m.level} />
                    </>
                  )}
                </span>
              </FitLine>
              <MacroTrack m={m} label />
            </button>
            {more && (
              <div className={"k-reveal" + (isOpen ? " on" : "")}>
                <div>
                  <MacroKinds m={m} />
                </div>
              </div>
            )}
          </div>
        );
      })}
      {rest && focus === undefined && limits.length > 0 && (
        <div className="k-grid k-nlims" style={{ "--cols": 3 } as CSSProperties}>
          {limits.map((l) => (
            <span key={l.key} className="k-stack g1" role="img" aria-label={l.aria}>
              {/* Named as the macros are (the developer, 2026-10-25), the numbers under. */}
              <span className="k-line g1">
                <Glyph of={{ nutrient: l.key }} size="xs" />
                <span className="k-label k-nlim">{l.name}</span>
              </span>
              <span className="k-line g1">
                <span className="k-num b2">{l.v}</span>
                {l.withPlan && <span className="k-num b2 k-plan">→ {l.withPlan}</span>}
                <span className="k-help">/ {l.t}</span>
              </span>
              <span className={"k-bar" + (l.strip ? " zoned" : "")}>
                <i style={{ width: l.w, background: l.color }} />
                {l.pw && <i className="p" style={{ left: l.w, width: l.pw }} />}
                {l.strip && <Fascia strip={l.strip} />}
                {l.strip?.mean && <b style={{ left: l.strip.mean }} />}
              </span>
            </span>
          ))}
        </div>
      )}
      {rest && focus === undefined && means && (
        <span className="k-help k-heatkey" aria-hidden="true">
          <b /> media della settimana
        </span>
      )}
      {rest && focus === undefined && micros && (
        <div className="k-nrow">
          <button
            type="button"
            className="k-mrow"
            onClick={() => setOpen(open === "micro" ? null : "micro")}
            aria-expanded={open === "micro"}
          >
            <span className="k-line between">
              <span className="k-line">
                <span className="k-micon">
                  <Glyph of={{ nutrient: "micro" }} size="m" />
                </span>
                <span className="k-label">Vitamine e minerali</span>
              </span>
              <span className="k-meta">{micros.summary}</span>
            </span>
          </button>
          <div className={"k-reveal" + (open === "micro" ? " on" : "")}>
            <div>
              <div className="k-kinds g3 flat">
                {micros.groups.map((g) => {
                  // A micro is a macro's row (VIS-50/52, his 19 Nov «gli stessi criteri delle
                  // macro»): its name and amount / target, the full-width bar in its colour, the
                  // target's tick, the zones ruler with its amounts, the tip in its zone's colour.
                  const row = (i: (typeof g.items)[number]) => (
                    <div
                      key={i.name}
                      className="k-mrow k-mmicro"
                      role="img"
                      aria-label={i.aria}
                    >
                      <span className="k-line between">
                        <span className="k-label">{i.name}</span>
                        <span className="k-num b2">
                          {i.amount}
                          {i.target && <span className="k-meta"> / {i.target}</span>}
                        </span>
                      </span>
                      <span className={"k-track" + (i.strip ? " zoned" : "")}>
                        <span
                          className="k-seg"
                          style={{ width: i.w, background: i.color }}
                        />
                        {i.mark && <span className="k-mark" style={{ left: i.mark }} />}
                        {i.strip && <Fascia strip={i.strip} />}
                      </span>
                    </div>
                  );
                  const fine = g.items.filter((i) => i.ok);
                  return (
                    <div key={g.name} className="k-stack">
                      <span className="k-cap">{g.name}</span>
                      {/* rows for what is not fine; the fine ones on one line (PAT-40, his 19 Nov) */}
                      {g.items.filter((i) => !i.ok).map(row)}
                      {fine.length > 0 && (
                        <Condensed
                          label={WORDS.fine}
                          remember={"micro.ok." + g.name}
                          names={fine.map((i) => (
                            <>
                              <span
                                className="k-cid"
                                style={{ background: i.color }}
                                aria-hidden="true"
                              />{" "}
                              {i.name}
                            </>
                          ))}
                        >
                          <div className="k-stack">{fine.map(row)}</div>
                        </Condensed>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Level L0: a meal box's four thin bars, its kinds shaded (the boards' `k-l0`). */
export function NutrientsL0({ data }: { data: NutrientsData }) {
  return (
    <div className="k-l0">
      {nutrientsL0(data).map((m) => (
        <span key={m.key} className="r" role="img" aria-label={m.aria}>
          <Glyph of={{ nutrient: m.key }} size="xs" />
          <span className="k-track">
            {m.segs.map((s, i) => (
              <span key={i} className="k-seg" style={{ width: s.w, background: s.bg }} />
            ))}
          </span>
          <span className="k-num b3 k-right">{m.value}</span>
        </span>
      ))}
    </div>
  );
}

/** A macro's track: its segments (lit or dimmed), its target mark, its zones ruler (VIS-50, VIS-52). */
function MacroTrack({
  m,
  label = false,
  full = false,
}: {
  m: ReturnType<typeof nutrientsL1>["macros"][number];
  /** Its own label for a screen reader; else the cell around it says it. */
  label?: boolean;
  /** Always full: only the proportions of its parts, no target mark, no ruler (his §146). */
  full?: boolean;
}) {
  const sum = m.segs.reduce((a, s) => a + parseFloat(s.w), 0);
  const w = (x: string) =>
    full && sum > 0 ? ((parseFloat(x) / sum) * 100).toFixed(1) + "%" : x;
  return (
    <span
      className={"k-track" + (m.strip && !full ? " zoned" : "")}
      {...(label ? { role: "img", "aria-label": m.aria } : { "aria-hidden": true })}
    >
      {m.segs.map((s, i) => (
        <span
          key={i}
          className={"k-seg" + (s.planned ? " planned" : "")}
          style={{
            width: w(s.w),
            background: s.bg,
            opacity: s.planned ? 0.5 : s.dim ? 0.25 : 1,
          }}
        />
      ))}
      {!full && m.mark && <span className="k-mark" style={{ left: m.mark }} />}
      {!full && m.strip && <Fascia strip={m.strip} />}
    </span>
  );
}

/** The key of the kcal's cell among the macros' (his §178). */
export const KCAL = "kcal";
/** The key of the vitamins-and-minerals cell among the macros' (his §174). */
export const MICRO = "micro";
/** «6 su 11 coperti» → «6/11»; the share covered as a width. */
const coverage = (summary: string) =>
  /(\d+)\s*su\s*(\d+)/.exec(summary)?.slice(1, 3).join("/") ?? "";
const coveredPct = (summary: string) => {
  const m = /(\d+)\s*su\s*(\d+)/.exec(summary);
  return m && Number(m[2]) > 0
    ? ((Number(m[1]) / Number(m[2])) * 100).toFixed(1) + "%"
    : "0%";
};

/** A macro's kinds, where it came from and its notes — its row open, or the box's «Nutrienti» band. */
function MacroKinds({ m }: { m: ReturnType<typeof nutrientsL1>["macros"][number] }) {
  return (
    <div className="k-kinds">
      {m.kinds.map((k) => (
        <div key={k.name} className="k-stack g0">
          <div className="k-krow">
            <span className="k-body">
              <span className="k-sw" style={{ background: k.c }} />
              {k.name}
            </span>
            <span className={"k-bar" + (k.strip ? " zoned" : "")}>
              <i style={{ width: k.w, background: k.fill }} />
              {k.strip && <Fascia strip={k.strip} />}
            </span>
            <span className="k-num b3 k-right">{k.v}</span>
          </div>
          {k.from && <span className="k-help k-nfrom">{k.from}</span>}
        </div>
      ))}
      {m.sources.length > 0 && (
        <>
          <span className="k-cap">da dove</span>
          {m.sources.map((s, n) => (
            <div
              key={s.name + ":" + n}
              className="k-src"
              style={{ opacity: s.faint ? 0.6 : s.dim ? 0.3 : 1 }}
            >
              <span className="k-body k-clip">{s.name}</span>
              <span className="k-bar">
                <i style={{ width: s.w, background: m.color }} />
              </span>
              <span className="k-num b3 k-right">{s.g}</span>
            </div>
          ))}
        </>
      )}
      {m.extras.length > 0 && (
        <div className="k-chips">
          {m.extras.map((x) => (
            <span key={x.t} className="k-pill" style={{ color: x.c, borderColor: x.c }}>
              {x.t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Each macro's kinds named on the band's side (his §174, Claude's pick): what its kinds tell. */
const KINDS_SIDE: Record<string, string> = {
  protein: "qualità",
  carbs: "tipo",
  fat: "acidi grassi",
  fiber: "tipo",
};

type ColumnRow = {
  key: string;
  name: string;
  w: string;
  c: string;
  v: string;
  dim?: boolean;
  /** Its need's tick on the bar (a micro's target), when it has one. */
  mark?: string | null;
};

/**
 * One section of a band in three vertical tiles (his §174, §176): its label turned on its side,
 * the rows (name and bar), the numbers (read only). A macro's kinds, «da dove», a micros' group.
 */
function SideColumns({ side, rows }: { side: string; rows: ColumnRow[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="k-kcols" role="group" aria-label={side}>
      <span className="k-kside">
        <span>{side}</span>
      </span>
      <div className="k-kcells">
        {rows.map((r) => (
          <div key={r.key} className={"k-kcell" + (r.dim ? " dim" : "")}>
            <span className="k-kname k-clip">{r.name}</span>
            <span className="k-bar">
              <i style={{ width: r.w, background: r.c }} />
              {r.mark && <span className="k-mark" style={{ left: r.mark }} />}
            </span>
          </div>
        ))}
      </div>
      <div className="k-knums">
        {rows.map((r) => (
          <span key={r.key} className="k-num b3">
            {r.v}
          </span>
        ))}
      </div>
    </div>
  );
}

/** A macro's kinds and where it came from (his §174): two sections of side columns. */
function MacroColumns({ m }: { m: ReturnType<typeof nutrientsL1>["macros"][number] }) {
  return (
    <div className="k-stack k-kcolumns">
      <SideColumns
        side={KINDS_SIDE[m.key] ?? ""}
        rows={m.kinds.map((k) => ({
          key: k.name,
          name: k.name,
          w: k.w,
          c: k.fill,
          v: k.v,
        }))}
      />
      <SideColumns
        side={WORDS.fromWhere}
        rows={m.sources.map((x, n) => ({
          key: x.name + ":" + n,
          name: x.name,
          w: x.w,
          c: m.color,
          v: x.g,
          dim: !!x.dim,
        }))}
      />
    </div>
  );
}

/**
 * The vitamins and minerals as the macros' kinds are (his §176: «coerente con quel che abbiamo
 * fatto»): a section per group, its name on the side; no header line — the «Micro» cell says it.
 */
function MicroColumns({
  micros,
  limits = [],
}: {
  micros: NonNullable<ReturnType<typeof nutrientsL1>["micros"]>;
  /** The limits first, as their own section (his §183: «i limiti? sono nei micro?»). */
  limits?: ReturnType<typeof nutrientsL1>["limits"];
}) {
  return (
    <div className="k-stack k-kcolumns">
      <SideColumns
        side={WORDS.limits}
        rows={limits.map((l) => ({
          key: l.key,
          name: l.name,
          w: l.w,
          c: l.color,
          v: l.v + " / " + l.t,
        }))}
      />
      {micros.groups.map((g) => (
        <SideColumns
          key={g.name}
          side={g.name.toLowerCase()}
          rows={g.items.map((i) => ({
            key: i.name,
            name: i.name,
            w: i.w,
            c: i.color,
            v: i.v,
            mark: i.mark,
          }))}
        />
      ))}
    </div>
  );
}

/** The kcal picked (his §178): where they come from, by macro and by ingredient, in kcal. */
function EnergyColumns({ e }: { e: NonNullable<ReturnType<typeof energyL1>> }) {
  return (
    <div className="k-stack k-kcolumns">
      <SideColumns side={WORDS.byMacro} rows={e.byMacro} />
      <SideColumns side={WORDS.fromWhere} rows={e.byFood} />
    </div>
  );
}

/**
 * What a picked cell adds once it takes the whole row (his §184): its name, its verdict's word,
 * its share of the kcal. Hidden in a cell that is not picked (CSS).
 */
function More({
  name,
  word,
  share,
}: {
  name: string;
  word: string | null;
  share?: string | undefined;
}) {
  return (
    // the name last: the icon already says it, so it is what gives way when the row is short
    <span className="k-mmore">
      {share && (
        <span className="k-meta">{WORDS.ofKcal(Math.round(parseFloat(share)))}</span>
      )}
      {word && <span className="k-meta">{word}</span>}
      <span className="k-mname">{name}</span>
    </span>
  );
}
