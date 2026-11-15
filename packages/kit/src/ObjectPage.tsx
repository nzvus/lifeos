/**
 * ObjectPage (PAT-30): the same page for every catalog type — header (PAT-02), the values that
 * matter as editable rows, its parts, «Andamento» (MOD-50), «Usato in», and the actions row at
 * the end. A type fills the slots; it never draws a page of its own (PRD-18).
 */
import type { ReactNode } from "react";
import type { GlyphOf } from "./glyph";
import { PageHeader } from "./PageHeader";
import { WORDS } from "./words";

export function ObjectPage({
  back,
  title,
  meta,
  of,
  values,
  parts,
  progress,
  usedIn,
  actions,
  toast,
  first,
  fold,
}: {
  back: { label: string; href: string };
  title: string;
  /** One line under the title. */
  meta?: string;
  of?: GlyphOf;
  /** The values that matter, as editable rows (PAT-13). */
  values: ReactNode;
  /** Its parts, each a titled section (a food's brands, what is at home). */
  parts?: readonly { title: string; node: ReactNode }[];
  progress?: ReactNode;
  usedIn?: ReactNode;
  /** `ObjectActions`. */
  actions: ReactNode;
  /** `useToast()`'s toast: inside the page, last, as the shell's rules expect (PAT-74). */
  toast?: ReactNode;
  /** A section right under the header, before everything (a ciclo's «Questa volta»). */
  first?: ReactNode;
  /**
   * The values folded under this word and put after the parts: a type whose parts matter more
   * than its settings (a ciclo: its steps first, «Regole» folded; his 15 Nov «fatti male»).
   */
  fold?: string;
}) {
  return (
    <main className="k-page k-objpage">
      <PageHeader
        back={back}
        title={title}
        {...(meta ? { context: meta } : {})}
        {...(of ? { of } : {})}
      />
      {first && (
        <section className="k-section g2" aria-label={title}>
          {first}
        </section>
      )}
      {!fold && (
        <section className="k-section g2" aria-label={title}>
          {values}
        </section>
      )}
      {parts?.map((p) => (
        <section key={p.title} className="k-section g2" aria-label={p.title}>
          <h2>{p.title}</h2>
          {p.node}
        </section>
      ))}
      {fold && (
        <section className="k-section g2" aria-label={fold}>
          <details className="k-fold">
            <summary>{fold}</summary>
            <div className="k-foldbody">{values}</div>
          </details>
        </section>
      )}
      {progress && (
        <section className="k-section g2" aria-label={WORDS.sections.progress}>
          <h2>{WORDS.sections.progress}</h2>
          {progress}
        </section>
      )}
      {usedIn && (
        <section className="k-section g2" aria-label={WORDS.sections.usedIn}>
          <h2>{WORDS.sections.usedIn}</h2>
          {usedIn}
        </section>
      )}
      {actions}
      {toast}
    </main>
  );
}
