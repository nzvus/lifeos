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
import { FasciaBar } from "./Fascia";
import { F, MET, PART, type State } from "./format";
import { WORDS } from "./words";

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
  /** `href`: a pill that opens something (a ritmo's tag, proposal §32). */
  pills?: { t: string; state?: State; of?: GlyphOf; href?: string }[];
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
    /** What would raise it, in the day's words, when the app knows (UI-75). */
    action?: string;
  };
};

/** A door of an open Box: a chip that shows one panel, one open at a time («Oggi a livelli»). */
export type BoxDoor = {
  key: string;
  label: string;
  value?: string;
  /** Nothing behind it: a plain chip that only says its value. */
  panel?: ReactNode;
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
  doors,
  door = null,
  onDoor,
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
  /**
   * Levels (VIS-40, «Oggi a livelli»): closed = the head and its strip, nothing else but
   * the line's actions; open = what it says, `children`, then these doors (and «Voto» for
   * its score parts, first), one panel open at a time. Without `doors` it opens as before.
   */
  doors?: BoxDoor[];
  door?: string | null;
  onDoor?: (key: string) => void;
}) {
  const levels = doors !== undefined;
  const shut = levels && !expanded;
  const dense = density === "row";
  // The score (UI-75, decided 30 Oct combining the developer's picks): the skyline
  // without a frame, each column as wide as its weight, as full as its score and in
  // its band's colour (the ruler's zones), beside the number and its word.
  const sc = e.score && e.score.parts.length > 0 && !dense ? e.score : null;
  const judged = sc ? F.judge(sc.value ?? undefined) : null;
  const chip =
    sc && judged ? (
      <span
        className="k-vh"
        role="img"
        aria-label={
          "voto " +
          (sc.value ?? "") +
          ", " +
          SCORE_WORD[judged.level] +
          ": " +
          sc.parts.map((q) => q.name + " " + Math.round(q.score * 100)).join(", ")
        }
      >
        <span className="k-vsky" aria-hidden="true">
          {sc.parts.map((q) => (
            <span key={q.name} className="col" style={{ flexGrow: q.weight }}>
              <span
                className="fill"
                style={{
                  height: Math.round(q.score * 100) + "%",
                  background: band(q.score * 100),
                }}
              />
            </span>
          ))}
          <span className="ln" style={{ bottom: MET + "%" }} />
        </span>
        <span className="n" aria-hidden="true">
          {/* The number in its band's colour, no word (his 13 and 15 Nov, PAT-98): the
              word stays in the chip's label for screen readers. */}
          <b style={{ color: judged.tone }}>{sc.value}</b>
        </span>
      </span>
    ) : null;
  // No line under the head for the score: «è costata di più» is read from the voto and its
  // rulers (his 15 Nov: «non mi serve, lo posso vedere dai voti»; VIS-43 changed).
  const parts =
    e.score && e.score.value !== null ? (
      // Open: one row per criterion with the nutrients' own ruler (S12): filled to
      // its score, the bands 40 and 70 under it, the tip in its band's colour.
      <div className="k-parts">
        {e.score.missing.length > 0 && (
          <span className="k-meta">senza: {e.score.missing.join(", ")}</span>
        )}
        {e.score.parts.map((q) => {
          const v = Math.round(q.score * 100);
          const j = F.judge(v);
          return (
            <div key={q.name} className="k-stack g1">
              <span className="k-line base between">
                <span className="k-line base g1">
                  <span className={j.cls} role="img" aria-label={j.aria} />
                  <span className="k-body">{q.name}</span>
                  <span className="k-help">pesa {Math.round(q.weight * 100)} %</span>
                </span>
                <span className="k-num b2">{v}</span>
              </span>
              <FasciaBar score={v} label={q.name + " " + v + " su 100"} />
            </div>
          );
        })}
      </div>
    ) : null;
  const allDoors: BoxDoor[] = levels
    ? [
        // A row has its voto in the head's chip (no `sc`); its criteria open behind the same door.
        ...(parts && e.score && e.score.parts.length > 0
          ? [
              {
                key: "voto",
                label: WORDS.score,
                value: String(e.score.value),
                panel: parts,
              },
            ]
          : []),
        ...doors,
      ]
    : [];
  const openDoor = allDoors.find((d) => d.key === door);
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
  // A box that leads somewhere and does not open: the whole box is the link, its actions
  // stay above it (his 19 Nov: «interagibili per intero e non solo da una freccia»).
  const cover = !onToggle && !!e.href;
  const lineActs = inline ? [] : acts;
  // A box that opens and has a page: the page is «Apri», inside the open box, never an arrow.
  const page = onToggle && e.href && expanded;
  const actsLine =
    lineActs.length > 0 || page ? (
      <div className="k-line end g2 k-acts">
        {page && (
          <a className="k-btn act" href={e.href} aria-label={e.hrefLabel ?? e.title}>
            Apri
          </a>
        )}
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
    ) : null;
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
          // Closed, the whole box opens it, not only its head (his 19 Nov: «interagibili per
          // intero»); a tap on its own buttons and links stays theirs. Open, only the head
          // closes it, so a tap inside never shuts it.
          onClick={
            onToggle && !expanded
              ? (ev) => {
                  const t = ev.target as Element;
                  if (!t.closest("a, button, input, select, textarea, label")) onToggle();
                }
              : undefined
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
          {/* The head's parts on one centre line (his 15 Nov «i numeri rispetto alle
              intestazioni e i bottoni sono sfalsati»): title, number, score and action. */}
          <div className={"k-top" + (badge ? " badged" : "")}>
            {/* The icon is centred on the title and its meta line while the box is shut; open,
                it stays on the first line (his 16 Nov «centrare le icone… invece di metterle in
                alto», VIS-40). The head reaches under it, so a tap on the icon opens too. */}
            <span className="k-lead" aria-hidden="true">
              {badge ? (
                <Glyph of={of} size="m" tile={!!e.href} />
              ) : (
                <span className="k-glyph-lead">
                  <Glyph of={of} size="s" />
                </span>
              )}
            </span>
            <div className="k-line g1">
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
                    <span className="k-label k-title">{e.title}</span>
                  </span>
                  <span className="k-hright">
                    {chip}
                    <span className="k-num d4">{e.value}</span>
                  </span>
                </button>
              ) : cover ? (
                // A box that only leads somewhere is one link over its whole surface (P3,
                // ledger UI-101: «i tracker non riesco a vederli quando li clicco»).
                <a
                  className="k-head k-cover"
                  href={e.href}
                  aria-label={e.hrefLabel ?? e.title}
                >
                  <span className={"k-hlead" + (badge ? " badged" : "")}>
                    <span className="k-label k-title">{e.title}</span>
                  </span>
                  <span className="k-hright">
                    {chip}
                    <span className="k-num d4">{e.value}</span>
                  </span>
                </a>
              ) : (
                <span className="k-head">
                  <span className={"k-hlead" + (badge ? " badged" : "")}>
                    <span className="k-label k-title">{e.title}</span>
                  </span>
                  <span className="k-hright">
                    {chip}
                    <span className="k-num d4">{e.value}</span>
                  </span>
                </span>
              )}
              {(headActs.length > 0 || (dense && e.score)) && (
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
                  {dense && e.score && e.score.value !== null && (
                    // The number beside it, in its band's colour: kept when the drawing is
                    // too small to read (≤ 360 px), never a row with no score at all (UI-102).
                    <b className="k-vn" style={{ color: F.judge(e.score.value).tone }}>
                      {e.score.value}
                    </b>
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
                </span>
              )}
            </div>
            {!shut && e.meta && <span className="k-meta k-sub">{e.meta}</span>}
          </div>
          {!levels && expanded && parts}
          {shut && e.strip && e.strip.length > 0 && (
            // Closed: one line and its strip (for a meal, where its energy comes from).
            <div className="k-ribbon k-lvstrip">
              {e.strip.map((g, i) => (
                <span key={i} style={{ width: g.w + "%", background: g.c }} />
              ))}
            </div>
          )}
          {shut && e.pills?.some((p) => p.href) && (
            // A ritmo's tag stays on the closed line (his 15 Nov: «solo un tag che appare in
            // quell'aggiunta alla timeline»); the other pills wait for the open box.
            <div className="k-chips k-bpills">
              {e.pills
                .filter((p) => p.href)
                .map((p, i) => (
                  <a key={i} className="k-pill link" href={p.href}>
                    {p.t}
                  </a>
                ))}
            </div>
          )}
          {shut && actsLine}
          {!shut && children && <div className="k-bin">{children}</div>}
          {!shut && (
            <div className="k-reveal on k-more">
              <div>
                {!levels && e.strip && e.strip.length > 0 && (
                  <div className="k-ribbon k-bstrip" style={{ width: "54%" }}>
                    {e.strip.map((g, i) => (
                      <span key={i} style={{ width: g.w + "%", background: g.c }} />
                    ))}
                  </div>
                )}
                {e.pills && e.pills.length > 0 && (
                  <div className="k-chips k-bpills">
                    {e.pills.map((p, i) => {
                      const style = {
                        color: p.state ? F.tone(p.state) : "var(--ink)",
                        borderColor: p.state ? F.tone(p.state) : "var(--hairline)",
                      };
                      const inner = (
                        <>
                          {p.of && <Glyph of={p.of} size="xs" />}
                          {p.t}
                        </>
                      );
                      return p.href ? (
                        <a key={i} className="k-pill link" style={style} href={p.href}>
                          {inner}
                        </a>
                      ) : (
                        <span key={i} className="k-pill" style={style}>
                          {inner}
                        </span>
                      );
                    })}
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
                {actsLine}
              </div>
            </div>
          )}
          {levels && expanded && allDoors.length > 0 && (
            <div className="k-chips k-doors">
              {allDoors.map((d) =>
                d.panel ? (
                  <button
                    key={d.key}
                    type="button"
                    className="k-chip k-door"
                    aria-pressed={d.key === door}
                    onClick={onDoor ? () => onDoor(d.key) : undefined}
                  >
                    <span>{d.label}</span>
                    {d.value && <span className="k-meta">{d.value}</span>}
                  </button>
                ) : (
                  <span key={d.key} className="k-chip k-door static">
                    <span>{d.label}</span>
                    {d.value && <span className="k-meta">{d.value}</span>}
                  </span>
                ),
              )}
            </div>
          )}
          {levels && expanded && openDoor && (
            <div className="k-doorpanel">{openDoor.panel}</div>
          )}
        </div>
      </div>
    </div>
  );
}

const SCORE_WORD = { met: "bene", part: "così così", no: "male", none: "" } as const;
const band = (v: number) =>
  v >= MET ? "var(--heat-good)" : v >= PART ? "var(--heat-fair)" : "var(--heat-bad)";
