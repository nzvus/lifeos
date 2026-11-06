/**
 * EmptyState (PAT-70): the type's glyph, what is missing, one action to fill it. Never a
 * placeholder page: a tab with nothing shows this.
 */
import { Glyph } from "./Glyph";
import type { GlyphOf } from "./glyph";

export function EmptyState({
  glyph,
  title,
  body,
  action,
}: {
  glyph: GlyphOf;
  title: string;
  body: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="k-empty">
      <Glyph of={glyph} size="xl" decorative />
      <span className="t">{title}</span>
      <span className="k-body">{body}</span>
      {action && (
        <a className="k-btn primary" href={action.href}>
          {action.label}
        </a>
      )}
    </div>
  );
}
