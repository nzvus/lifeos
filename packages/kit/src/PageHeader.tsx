/**
 * PageHeader (kit.md §3) — top level: the title and the gear to Settings;
 * a sub-page: "‹ parent" naming where it goes, then the title. An optional
 * action on the right (the day's model on Oggi).
 */
import { Glyph } from "./Glyph";
import type { GlyphOf } from "./glyph";

type Link = { label: string; href: string };

export function PageHeader({
  title,
  context,
  back,
  action,
  of,
  settingsHref = "/impostazioni",
}: {
  title: string;
  context?: string;
  back?: Link;
  action?: Link;
  of?: GlyphOf;
  settingsHref?: string;
}) {
  const heading = (
    <h1 className="k-ph-t">
      {of && <Glyph of={of} size="l" />}
      <span>{title}</span>
    </h1>
  );
  return (
    <header className={"k-ph" + (back ? " sub" : "")}>
      <div className="bar">
        {back ? (
          <a className="k-back" href={back.href}>
            <Glyph of={{ ui: "back" }} size="m" />
            {back.label}
          </a>
        ) : (
          heading
        )}
        <span className="k-line g1">
          {action && (
            <a className="k-back k-act-link" href={action.href}>
              {action.label}
            </a>
          )}
          {!back && (
            <a className="k-btn icon" href={settingsHref} aria-label="Impostazioni">
              <Glyph of={{ ui: "settings" }} size="m" />
            </a>
          )}
        </span>
      </div>
      {back && heading}
      {context && <span className="k-meta">{context}</span>}
    </header>
  );
}
