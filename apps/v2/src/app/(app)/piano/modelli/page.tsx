/**
 * Piano · Modelli («Le regole», the board Models; dossiers/day-templates.md
 * §6): the week type (each weekday's model), the day models with what they
 * hold, the archived ones apart, «Nuovo modello». Cycles and habits join
 * with slices c and d.
 */
import { Box, NavBar, PageHeader, F, type BoxEntry } from "@lifeos/kit";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import {
  inheritedTargets,
  readModelBook,
  resolveModel,
  toModels,
  type ModelRow,
} from "@/core/plans";
import { WEEKDAYS } from "@/features/plan/model-form";
import { PLACES } from "@/features/places";
import { newModel } from "../modello/[id]/actions";

export default async function ModelsPage() {
  const owner = await requireOwner();
  const db = await getDb();
  const book = await readModelBook(db, owner);
  const models = toModels(book.models, book.rows);
  const name = (id: string | null) => book.models.find((m) => m.id === id)?.name ?? "";
  const row = (m: ModelRow): BoxEntry => {
    const r = resolveModel(m.id, models);
    const t = inheritedTargets(m.id, book.models).targets;
    const days = WEEKDAYS.filter(([d]) => book.week.get(d) === m.id).map(([, l]) => l);
    const meals = r?.blocks.filter((b) => b.kind === "meal").length ?? 0;
    const sessions = r?.blocks.filter((b) => b.kind === "session").length ?? 0;
    return {
      fam: "day",
      title: m.name,
      value: days.length === 7 ? "ogni giorno" : days.join(""),
      meta: [
        m.extendsId ? "su «" + name(m.extendsId) + "»" : "",
        t?.["mode"] === "fixed" && t["kcal"]
          ? F.num(Number(t["kcal"]), "kcal") + " fisse"
          : "segue l’obiettivo",
        meals ? F.plural(meals, "pasto", "pasti") : "",
        sessions ? F.plural(sessions, "allenamento", "allenamenti") : "",
      ]
        .filter(Boolean)
        .join(" · "),
      href: "/piano/modello/" + m.id,
      hrefLabel: "Apri " + m.name,
      ...(m.active ? {} : { faded: true }),
    };
  };
  const live = book.models.filter((m) => m.active);
  const archived = book.models.filter((m) => !m.active);

  return (
    <main className="k-page has-bd">
      <PageHeader
        title="Modelli"
        context="le giornate tipo e la settimana"
        back={{ label: "Piano", href: "/piano" }}
        of={{ place: "piano" }}
      />
      <section className="k-section g3" aria-label="Settimana tipo">
        <h2>Settimana tipo</h2>
        <div className="k-grid" style={{ "--cols": 7 } as React.CSSProperties}>
          {WEEKDAYS.map(([d, l]) => (
            <span key={d} className="k-stack g0" style={{ textAlign: "center" }}>
              <span className="k-cap">{l}</span>
              <span className="k-help k-clip">
                {name(book.week.get(d) ?? null) || "—"}
              </span>
            </span>
          ))}
        </div>
        <span className="k-help">
          Ogni giorno prende il suo modello; lo cambi dal modello, in «Dove si applica».
        </span>
      </section>
      <section className="k-section g3" aria-label="Giornate tipo">
        <h2>
          Giornate tipo <span className="k-meta">{live.length}</span>
        </h2>
        {live.length === 0 && <p className="k-empty k-meta">Nessun modello ancora.</p>}
        {live.map((m) => (
          <Box key={m.id} entry={row(m)} density="row" rail={false} />
        ))}
        <form action={newModel} className="k-stack g2 k-panel">
          <label className="k-stack g1">
            <span className="k-label">Nuovo modello</span>
            <input className="k-text" name="name" placeholder="per esempio: Lavoro" />
          </label>
          {live.length > 0 && (
            <label className="k-stack g1">
              <span className="k-help">Costruito su</span>
              <select className="k-select" name="base" defaultValue="">
                <option value="">nessuno: da zero</option>
                {live.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="k-line end">
            <button type="submit" className="k-btn primary">
              Crea
            </button>
          </div>
        </form>
      </section>
      {archived.length > 0 && (
        <section className="k-section g3" aria-label="Archiviati">
          <h2>
            Archiviati <span className="k-meta">{archived.length}</span>
          </h2>
          {archived.map((m) => (
            <Box key={m.id} entry={row(m)} density="row" rail={false} />
          ))}
        </section>
      )}
      <div className="k-nav k-stick">
        <NavBar active="plan" hrefs={PLACES} addHref="/aggiungi" />
      </div>
    </main>
  );
}
