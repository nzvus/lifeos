/**
 * Box (kit.md §3) — every item anywhere: the same markup and classes as the
 * boards' Box, so kit.css draws it the same. This first part covers what the
 * day's timeline needs: the time rail (compact or times), the family's
 * silhouette and drawing, title and value, a meta line, pills, the strip,
 * the icons of what it is made of, and the link to its page.
 * What a Box holds inline (the day's Nutrients L1) comes as `children`.
 * Score parts come with the slices that compute them.
 *
 * No state: a page that lets the rail switch modes passes `onRail` from a
 * client component (never from a server page: a function cannot cross);
 * the same for `acts`, the row's actions (tick, skip) in its trail.
 */
import type { CSSProperties, ReactNode } from "react";
import { Glyph } from "./Glyph";
import type { GlyphOf } from "./glyph";
import { F, type State } from "./format";

export type BoxEntry = {
  fam: string;
  sub?: string;
  /** Data for the drawing (kind, dish, group, pattern…); the resolver picks it. */
  of?: GlyphOf;
  title: string;
  value?: string;
  meta?: string;
  /** "08:05": written by F before it gets here. */
  time?: string;
  planned?: boolean;
  faded?: boolean;
  pills?: { t: string; state?: State; of?: GlyphOf }[];
  /** A full-width strip of shares (muscles, water): width in %, colour token. */
  strip?: { w: number; c: string }[];
  /** What it is made of, in order (a session's exercises). */
  members?: (GlyphOf & { title?: string })[];
  href?: string;
  hrefLabel?: string;
  /** Its score (E7): the skyline behind it, the parts when it opens; missing parts named. */
  score?: {
    value: number | null;
    parts: { name: string; score: number; weight: number }[];
    missing: string[];
  };
};

export type BoxAct = {
  label: string;
  aria?: string;
  onClick: () => void;
  danger?: boolean;
};

export function Box({
  entry: e,
  density = "card",
  mode = "compact",
  rail = true,
  onRail,
  acts = [],
  children,
  expanded,
  onToggle,
  chip: chipSlot,
}: {
  entry: BoxEntry;
  density?: "card" | "row";
  mode?: "compact" | "times";
  rail?: boolean;
  onRail?: () => void;
  acts?: BoxAct[];
  children?: ReactNode;
  /** The box opens (the boards' head button): the caller holds the state and the content. */
  expanded?: boolean;
  onToggle?: () => void;
  /** Replaces the score chip in the head (the visual study's round 2, UI-75). */
  chip?: ReactNode;
}) {
  const dense = density === "row";
  // The score as a small framed chart in the head (the developer's pick, 2026-10-25):
  // its number in the judgement's colour, a column per part (as wide as its weight,
  // as full as its score), the 70 dashed.
  const sc = e.score && e.score.parts.length > 0 && !dense ? e.score : null;
  const chip = chipSlot ? (
    chipSlot
  ) : sc ? (
    <span
      className="k-skyc"
      role="img"
      aria-label={
        "voto " +
        (sc.value ?? "") +
        ": " +
        sc.parts.map((q) => q.name + " " + Math.round(q.score * 100)).join(", ")
      }
    >
      <b style={{ color: F.judge(sc.value ?? undefined).tone }}>{sc.value}</b>
      <span className="k-sky chip" aria-hidden="true">
        {sc.parts.map((q) => (
          <span key={q.name} className="col" style={{ flexGrow: q.weight }}>
            <span className="fill" style={{ height: Math.round(q.score * 100) + "%" }} />
          </span>
        ))}
        <span className="line" />
      </span>
    </span>
  ) : null;
  const fam = " fam-" + e.fam + (e.sub ? " sub-" + e.sub : "");
  const of: GlyphOf = {
    ...e.of,
    fam: e.fam,
    ...(e.sub ? { sub: e.sub } : {}),
    title: e.title,
  };
  const members = e.members ?? [];
  const shown = members.slice(0, members.length > 8 ? 7 : 8);
  // Icons in dark (UI-81): bare in a row; a filled tile only where the row is a button.
  const badge = dense && members.length === 0;
  // One short action fits the head; more, or a long one («Ancora +500?»), get their
  // own line under the box: the head never pushes past the edge (the water row did).
  const inline = acts.length === 1 && acts[0]!.label.length <= 6;
  const headActs = inline ? acts : [];
  const lineActs = inline ? [] : acts;
  return (
    <div
      className={
        "k-row" +
        fam +
        (mode === "times" ? " times" : "") +
        (e.planned ? " planned" : "") +
        (e.faded ? " faded" : "") +
        (dense ? " dense" : "") +
        (rail ? "" : " norail")
      }
    >
      {rail && (
        <button
          type="button"
          className="k-rail"
          onClick={onRail}
          aria-label={
            (e.time ?? "") +
            " " +
            e.title +
            (e.planned ? ", previsto" : "") +
            ": tocca per " +
            (mode === "times" ? "compattare" : "mostrare gli orari")
          }
        >
          <span className="bar" />
          <span className="t">{e.time}</span>
          <span className="ico">
            <Glyph of={of} size="s" />
          </span>
        </button>
      )}
      <div className={"k-shape" + fam + (e.planned ? " planned" : "")}>
        <div
          className={
            "k-box " + e.fam + (e.sub ? " " + e.sub : "") + (expanded ? " is-open" : "")
          }
        >
          <span className="k-artclip" aria-hidden="true">
            <span className="k-art a1">
              <Glyph of={of} size="xl" />
            </span>
            <span className="k-art a2">
              <Glyph of={{ fam: e.fam }} size="xl" />
            </span>
          </span>
          <div className="k-line base g1">
            {onToggle ? (
              <button
                type="button"
                className="k-head"
                onClick={onToggle}
                aria-expanded={expanded ? "true" : "false"}
                aria-label={
                  e.title +
                  (e.value ? " " + e.value : "") +
                  (expanded ? ". Tocca per chiudere" : ". Tocca per aprire")
                }
              >
                <span className={"k-hlead" + (badge ? " badged" : "")}>
                  {badge ? (
                    <Glyph of={of} size="m" tile={!!e.href} />
                  ) : (
                    <span className="k-glyph-lead">
                      <Glyph of={of} size="m" />
                    </span>
                  )}
                  <span className="k-label k-title">{e.title}</span>
                </span>
                <span className="k-hright">
                  {chip}
                  <span className="k-num d4">{e.value}</span>
                </span>
              </button>
            ) : (
              <span className="k-head">
                <span className={"k-hlead" + (badge ? " badged" : "")}>
                  {badge ? (
                    <Glyph of={of} size="m" tile={!!e.href} />
                  ) : (
                    <span className="k-glyph-lead">
                      <Glyph of={of} size="m" />
                    </span>
                  )}
                  <span className="k-label k-title">{e.title}</span>
                </span>
                <span className="k-hright">
                  {chip}
                  <span className="k-num d4">{e.value}</span>
                </span>
              </span>
            )}
            {(e.href || headActs.length > 0 || (dense && e.score)) && (
              <span className="k-trail">
                {dense && e.score && e.score.parts.length > 0 && (
                  // A row's score: the board's mini skyline, beside its value.
                  <span className="k-sky mini" aria-hidden="true">
                    {e.score.parts.map((q) => (
                      <span
                        key={q.name}
                        className="col"
                        style={
                          {
                            flexGrow: q.weight,
                            "--mix": Math.round(22 + q.score * 40) + "%",
                          } as CSSProperties
                        }
                      >
                        <span
                          className="fill"
                          style={{ height: Math.round(q.score * 100) + "%" }}
                        />
                      </span>
                    ))}
                    <span className="line" />
                  </span>
                )}
                {headActs.map((a) => (
                  <button
                    key={a.label}
                    type="button"
                    className={"k-btn act" + (a.danger ? " danger" : "")}
                    aria-label={a.aria ?? a.label}
                    onClick={a.onClick}
                  >
                    {a.label}
                  </button>
                ))}
                {e.href && (
                  <a className="k-go" href={e.href} aria-label={e.hrefLabel ?? e.title}>
                    ›
                  </a>
                )}
              </span>
            )}
          </div>
          {e.meta && <span className="k-meta k-sub">{e.meta}</span>}
          {expanded && e.score && e.score.value !== null && (
            <div className="k-parts">
              <span className="k-num b2">
                {e.score.value}
                <span className="k-meta">
                  {" / 100"}
                  {e.score.missing.length > 0
                    ? " · senza: " + e.score.missing.join(", ")
                    : ""}
                </span>
              </span>
              {e.score.parts.map((q) => {
                const v = Math.round(q.score * 100);
                const j = F.judge(v);
                return (
                  <div key={q.name} className="k-part">
                    <span className={j.cls} role="img" aria-label={j.aria} />
                    <span className="k-body n">
                      {q.name}{" "}
                      <span className="k-help">{Math.round(q.weight * 100)} %</span>
                    </span>
                    <span className="k-bar">
                      <i
                        style={
                          {
                            width: v + "%",
                            "--mix": Math.round(30 + q.score * 50) + "%",
                          } as CSSProperties
                        }
                      />
                      <b />
                    </span>
                    <span className="k-num b2 k-right">{v}</span>
                  </div>
                );
              })}
            </div>
          )}
          {children && <div className="k-bin">{children}</div>}
          <div className="k-reveal on k-more">
            <div>
              {e.strip && e.strip.length > 0 && (
                <div className="k-ribbon k-bstrip" style={{ width: "54%" }}>
                  {e.strip.map((g, i) => (
                    <span key={i} style={{ width: g.w + "%", background: g.c }} />
                  ))}
                </div>
              )}
              {e.pills && e.pills.length > 0 && (
                <div className="k-chips k-bpills">
                  {e.pills.map((p, i) => (
                    <span
                      key={i}
                      className="k-pill"
                      style={{
                        color: p.state ? F.tone(p.state) : "var(--ink)",
                        borderColor: p.state ? F.tone(p.state) : "var(--hairline)",
                      }}
                    >
                      {p.of && <Glyph of={p.of} size="xs" />}
                      {p.t}
                    </span>
                  ))}
                </div>
              )}
              {members.length > 0 && (
                <span
                  className="k-icons"
                  role="img"
                  aria-label={
                    "Contiene: " +
                    members
                      .map((m) => m.title ?? "")
                      .filter(Boolean)
                      .join(", ")
                  }
                >
                  {shown.map((m, i) => (
                    <Glyph key={i} of={m} size="s" />
                  ))}
                  {members.length > 8 && (
                    <span className="k-meta">{"+" + (members.length - 7)}</span>
                  )}
                </span>
              )}
              {lineActs.length > 0 && (
                <div className="k-line end g2 k-acts">
                  {lineActs.map((a) => (
                    <button
                      key={a.label}
                      type="button"
                      className={"k-btn act" + (a.danger ? " danger" : "")}
                      aria-label={a.aria ?? a.label}
                      onClick={a.onClick}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
