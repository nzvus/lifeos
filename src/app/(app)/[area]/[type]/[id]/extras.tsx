/**
 * A type's own sections on the generic ObjectPage (PAT-04, PAT-30; model.md §8): looked up by
 * type key in this one map — never a comparison with a type key (PAT-90) — and built from the
 * type's specialisation. A type without one shows only its values and verbs.
 */
import type { Db } from "@/core/db/db";
import type { Owner } from "@/core/identity/owner";
import { readUserKind } from "@/core/kinds/user";
import { trackerHref } from "@/features/places";
import { tracker, wordOf } from "@/i18n/tracker";

export type Extra = {
  /** Said under the title, after the type's name. */
  meta?: string;
  parts?: { title: string; node: React.ReactNode };
  progress?: React.ReactNode;
};

type Build = (db: Db, owner: Owner, id: string) => Promise<Extra | null>;

const TYPE_WORD = Object.fromEntries(tracker.types);

/** A tracker (core/kinds/user): what it is, its shape, its fields, its Andamento. */
const trackerExtra: Build = async (db, owner, id) => {
  const k = await readUserKind(db, owner, id);
  if (!k) return null;
  const w = tracker.page;
  return {
    meta: `${wordOf(tracker.families, k.family)} · ${wordOf(tracker.shapes, k.shape).toLowerCase()}`,
    parts: {
      title: w.fields,
      node:
        k.fields.length === 0 ? (
          <p className="k-meta">{w.noFields}</p>
        ) : (
          <ul className="k-stack g1 k-body">
            {k.fields.map((f) => (
              <li key={f.label}>
                {f.label}{" "}
                <span className="k-meta">
                  · {TYPE_WORD[f.type] ?? f.type}
                  {f.unit ? " · " + f.unit : ""}
                </span>
              </li>
            ))}
          </ul>
        ),
    },
    progress: (
      <a className="k-btn link" href={trackerHref(k.key, k.domain)}>
        {w.open} ›
      </a>
    ),
  };
};

export const EXTRAS: Record<string, Build> = { tracker: trackerExtra };
