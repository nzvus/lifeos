"use client";
/**
 * Nutrients, level L1 (kit.md §4): the boards' markup, drawn from
 * `nutrientsL1` (nutrient-rows.ts). A macro row opens on the box's transition into its kinds,
 * where it came from and its notes. `NutrientsL0`: a meal box's four thin bars.
 * L2 (a meal's window, `data.foods`): the foods as chips; one tapped is
 * highlighted in every bar and in «da dove», each kind says where it came from.
 * Pass plain data (server pages may render it).
 */
import { useState, type CSSProperties } from "react";
import { F } from "./format";
import { Glyph } from "./Glyph";
import {
  nutrientsL0,
  nutrientsL1,
  type HeatStrip,
  type NutrientsData,
} from "./nutrient-rows";

/**
 * A number's zones as a ruler under its own bar (`.zoned`): the bar still
 * says how much (its kinds, then the planned part hatched), its tip takes
 * the colour of the zone it ends in, and the ruler shows every zone — the
 * right one green, the near ones yellow — with the amount at each change.
 */
function ZoneBand({ strip }: { strip: HeatStrip }) {
  return (
    <>
      {strip.tip && (
        <span
          className="k-ztip"
          aria-hidden="true"
          style={{ left: strip.to ?? strip.at, background: strip.tip }}
        />
      )}
      <span className="k-zrule" aria-hidden="true">
        {strip.rule.map((r, i) => (
          <span key={i} className={"z " + r.level} style={{ left: r.left, width: r.w }} />
        ))}
        {strip.ticks.map((t, i) => (
          <span key={"t" + i} className="tk" style={{ left: t.at }}>
            {t.label && <span>{t.label}</span>}
          </span>
        ))}
      </span>
    </>
  );
}

export function Nutrients({ data }: { data: NutrientsData }) {
  const [open, setOpen] = useState<string | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const { kcal, foods, macros, limits, micros } = nutrientsL1(data, sel);
  const means = limits.some((l) => l.strip?.mean);
  return (
    <div className="k-stack g3">
      {kcal && (
        <div className="k-stack">
          <span className="k-line base between">
            <span className="k-line base">
              <Glyph of={{ nutrient: "kcal" }} size="m" />
              <span className="k-num d2">{kcal.v}</span>
              {kcal.t && <span className="k-meta">/ {kcal.t}</span>}
            </span>
            <span className="k-meta">{kcal.left}</span>
          </span>
          {kcal.bar && (
            <span className="k-track" role="img" aria-label={kcal.aria}>
              <span className="k-seg kcal" style={{ width: kcal.bar.w }} />
              <span className="k-seg kcal planned" style={{ width: kcal.bar.pw }} />
            </span>
          )}
        </div>
      )}
      {foods.length > 1 && (
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
      {macros.map((m) => {
        const isOpen = open === m.key;
        const more = m.kinds.length + m.sources.length + m.extras.length > 0;
        return (
          <div key={m.key} className="k-nrow">
            <button
              type="button"
              className="k-mrow"
              onClick={more ? () => setOpen(isOpen ? null : m.key) : undefined}
              aria-expanded={more ? isOpen : undefined}
            >
              <span className="k-line between">
                <span className="k-line">
                  <span className="k-micon">
                    <Glyph of={{ nutrient: m.key }} size="m" />
                  </span>
                  <span className="k-label">{m.name}</span>
                </span>
                <span className="k-num b2">
                  {m.value}
                  {m.target && <span className="k-meta"> / {m.target}</span>}
                  {m.word && (
                    <span
                      className="k-help"
                      style={{ color: F.tone(m.state ?? undefined) }}
                    >
                      {" "}
                      {m.word}
                    </span>
                  )}
                </span>
              </span>
              <span
                className={"k-track" + (m.strip ? " zoned" : "")}
                role="img"
                aria-label={m.aria}
              >
                {m.segs.map((s, i) => (
                  <span
                    key={i}
                    className={"k-seg" + (s.planned ? " planned" : "")}
                    style={{
                      width: s.w,
                      background: s.bg,
                      opacity: s.planned ? 0.5 : s.dim ? 0.25 : 1,
                    }}
                  />
                ))}
                {m.mark && <span className="k-mark" style={{ left: m.mark }} />}
                {m.strip && <ZoneBand strip={m.strip} />}
              </span>
            </button>
            {more && (
              <div className={"k-reveal" + (isOpen ? " on" : "")}>
                <div>
                  <div className="k-kinds">
                    {m.kinds.map((k) => (
                      <div key={k.name} className="k-stack g0">
                        <div className="k-krow">
                          <span className="k-body">
                            <span className="k-sw" style={{ background: k.c }} />
                            {k.name}
                            {k.word && (
                              <span
                                className="k-help"
                                style={{ color: F.tone(k.state ?? undefined) }}
                              >
                                {" "}
                                {k.word}
                              </span>
                            )}
                          </span>
                          <span className={"k-bar" + (k.strip ? " zoned" : "")}>
                            <i style={{ width: k.w, background: k.fill }} />
                            {k.strip && <ZoneBand strip={k.strip} />}
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
                          <span
                            key={x.t}
                            className="k-pill"
                            style={{ color: x.c, borderColor: x.c }}
                          >
                            {x.t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {limits.length > 0 && (
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
                <span className="k-help">/ {l.t}</span>
              </span>
              <span className={"k-bar" + (l.strip ? " zoned" : "")}>
                <i style={{ width: l.w, background: l.color }} />
                {l.pw && <i className="p" style={{ left: l.w, width: l.pw }} />}
                {l.strip && <ZoneBand strip={l.strip} />}
                {l.strip?.mean && <b style={{ left: l.strip.mean }} />}
              </span>
              {l.word && (
                <span className="k-help" style={{ color: F.tone(l.state ?? undefined) }}>
                  {l.word}
                </span>
              )}
            </span>
          ))}
        </div>
      )}
      {means && (
        <span className="k-help k-heatkey" aria-hidden="true">
          <b /> media della settimana
        </span>
      )}
      {micros && (
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
              <div className="k-kinds g3">
                {micros.groups.map((g) => (
                  <div key={g.name} className="k-stack">
                    <span className="k-cap">{g.name}</span>
                    {g.items.map((i) => (
                      <div
                        key={i.name}
                        className="k-krow k-microw"
                        role="img"
                        aria-label={i.aria}
                      >
                        <span className="k-body">{i.name}</span>
                        <span className={"k-bar" + (i.strip ? " zoned" : "")}>
                          <i style={{ width: i.w, background: i.color }} />
                          {i.strip && <ZoneBand strip={i.strip} />}
                        </span>
                        <span className="k-num b3 k-right">{i.v}</span>
                      </div>
                    ))}
                  </div>
                ))}
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
