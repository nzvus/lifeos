/**
 * A blocco's own sections on the generic ObjectPage (PAT-30; PL-01…03, PL-20; change
 * 2026-11-07-piano): how often under its title, «Cambia che cosa» (its Composer), and what it
 * holds — one object, a rotation («A turno», PL-02) or a type with its defaults (PL-03), each
 * row opening its page. When, area and how often are its values, edited in place.
 */
import { Box, List, readRecurrence, recurrenceText, type BoxEntry } from "@lifeos/kit";
import { readUserKinds } from "@/core/day";
import { areaSlug, typeOfItem, typeSlug } from "@/core/kinds/catalog";
import { readBlockWhat } from "@/core/plans";
import { readObject } from "@/core/verbs";
import { ACTIVITY, NAMES } from "@/features/day/words";
import { plan } from "@/i18n/plan";
import type { Build } from "./extras";

const w = plan.block;

export const blockExtra: Build = async (db, owner, id) => {
  const [what, o, mine] = await Promise.all([
    readBlockWhat(db, owner, id),
    readObject(db, owner, "block", id),
    readUserKinds(db, owner),
  ]);
  if (!what || !o) return null;
  const r = o.values["recurrence"];
  const rows: BoxEntry[] = what.items.map((x) => {
    const t = typeOfItem(x.catalog);
    return {
      fam: t?.hue ?? "day",
      title: x.name,
      meta: [t?.name, x.quantity ? w.servings(Number(x.quantity)) : null]
        .filter(Boolean)
        .join(" · "),
      ...(t ? { href: `/${areaSlug(t)}/${typeSlug(t)}/${x.id}` } : {}),
    };
  });
  if (what.kind)
    rows.push({
      fam: "habit",
      title: NAMES[what.kind] ?? mine.find((k) => k.key === what.kind)?.name ?? what.kind,
      // Its default values said with it: «tipo · Studio».
      meta: [w.kind, ACTIVITY[what.defaults["category"] ?? ""]]
        .filter(Boolean)
        .join(" · "),
    });
  const rotation = what.items.length > 1;
  return {
    ...(typeof r === "string" ? { meta: recurrenceText(readRecurrence(r)) } : {}),
    summary: (
      <a className="k-btn secondary" href={"/oggi/blocco/" + id + "/componi"}>
        {w.compose}
      </a>
    ),
    parts: [
      {
        title: rotation ? w.rotation : w.what,
        node:
          rows.length === 0 ? (
            <p className="k-meta">{w.nothing}</p>
          ) : (
            <div className="k-stack g2">
              {rotation && <p className="k-help">{w.rotationHelp}</p>}
              <List label={rotation ? w.rotation : w.what}>
                {rows.map((x, i) => (
                  <Box key={i} density="row" rail={false} entry={x} />
                ))}
              </List>
            </div>
          ),
      },
    ],
  };
};
