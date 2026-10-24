"use client";
/**
 * Nutrients, level L1 (kit.md §4): the boards' markup, drawn from
 * `nutrientsL1` (nutrient-rows.ts). A macro row opens on the box's transition into its kinds,
 * where it came from and its notes. `NutrientsL0`: a meal box's four thin bars.
 * L2 comes with the food slice.
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

/** A number's zones on their own line, its marks over them (`heatStrip`). */
function Heat({ strip }: { strip: HeatStrip }) {
  return (
    <span className="k-heat" aria-hidden="true">
      <span className="z">
        {strip.zones.map((z, i) => (
          <span
            key={i}
            className={z.danger ? "danger" : undefined}
            style={{ width: z.w, background: z.c }}
          />
        ))}
      </span>
      {strip.to && <i className="to" style={{ left: strip.to }} />}
      <i className="at" style={{ left: strip.at }} />
      {strip.mean && <i className="mean" style={{ left: strip.mean }} />}
    </span>
  );
}

export function Nutrients({ data }: { data: NutrientsData }) {
  const [open, setOpen] = useState<string | null>(null);
  const { kcal, macros, limits, micros } = nutrientsL1(data);
  const strips = [...macros, ...limits].some((x) => x.strip);
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
              <span className="k-track" role="img" aria-label={m.aria}>
                {m.segs.map((s, i) => (
                  <span
                    key={i}
                    className={"k-seg" + (s.planned ? " planned" : "")}
                    style={{ width: s.w, background: s.bg, opacity: s.planned ? 0.5 : 1 }}
                  />
                ))}
                {m.mark && <span className="k-mark" style={{ left: m.mark }} />}
              </span>
              {m.strip && <Heat strip={m.strip} />}
            </button>
            {more && (
              <div className={"k-reveal" + (isOpen ? " on" : "")}>
                <div>
                  <div className="k-kinds">
                    {m.kinds.map((k) => (
                      <div key={k.name} className="k-krow">
                        <span className="k-body">
                          <span className="k-sw" style={{ background: k.c }} />
                          {k.name}
                        </span>
                        <span className="k-bar">
                          <i style={{ width: k.w, background: k.c }} />
                        </span>
                        <span className="k-num b3 k-right">{k.v}</span>
                      </div>
                    ))}
                    {m.sources.length > 0 && (
                      <>
                        <span className="k-cap">da dove</span>
                        {m.sources.map((s) => (
                          <div
                            key={s.name}
                            className="k-src"
                            style={{ opacity: s.faint ? 0.6 : 1 }}
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
              <span className="k-line g1">
                <Glyph of={{ nutrient: l.key }} size="xs" />
                <span className="k-num b2">{l.v}</span>
                <span className="k-help">/ {l.t}</span>
              </span>
              {l.strip ? (
                <>
                  <Heat strip={l.strip} />
                  <span
                    className="k-help"
                    style={{ color: F.tone(l.state ?? undefined) }}
                  >
                    {l.word}
                  </span>
                </>
              ) : (
                <span className="k-bar">
                  <i style={{ width: l.w, background: l.color }} />
                </span>
              )}
            </span>
          ))}
        </div>
      )}
      {strips && (
        <span className="k-help k-heatkey" aria-hidden="true">
          <i className="at" /> adesso <i className="to" /> con il previsto
          {means && (
            <>
              {" "}
              <i className="mean" /> media della settimana
            </>
          )}
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
                        {i.strip ? (
                          <Heat strip={i.strip} />
                        ) : (
                          <span className="k-bar">
                            <i style={{ width: i.w, background: i.color }} />
                          </span>
                        )}
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
