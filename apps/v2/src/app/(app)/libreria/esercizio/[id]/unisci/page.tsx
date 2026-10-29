/**
 * «Unisci» (capture.md §4; interaction.md §3: a consequential action, said
 * before it is done): what moves from the exercise that goes to the one kept,
 * then «Unisci» or back. `?con=<id>` is the one that goes.
 */
import { notFound } from "next/navigation";
import { F, PageHeader } from "@lifeos/kit";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { mergePreview } from "@/core/catalog/merge";
import { readExercises } from "@/core/training";
import { mergeExercise } from "../actions";

export default async function MergeExercisePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ con?: string | string[] }>;
}) {
  const owner = await requireOwner();
  const db = await getDb();
  const { id } = await params;
  const { con } = await searchParams;
  const all = await readExercises(db, owner);
  const keep = all.find((e) => e.id === id);
  const gone = typeof con === "string" ? all.find((e) => e.id === con) : undefined;
  if (!keep || !gone || keep.id === gone.id) notFound();
  const n = await mergePreview(db, owner, gone.id);
  const back = "/libreria/esercizio/" + keep.id;
  return (
    <main className="k-page">
      <PageHeader
        title={"Unisci «" + gone.name + "»"}
        context={"in «" + keep.name + "»"}
        back={{ label: keep.name, href: back }}
        of={{ fam: "train" }}
      />
      <section className="k-section g3" aria-label="Cosa succede">
        <h2>Cosa succede</h2>
        <ul className="k-stack g2 k-body">
          <li>
            {n.entries > 0
              ? F.plural(
                  n.entries,
                  "volta in cui l’hai fatto passa",
                  "volte in cui l’hai fatto passano",
                ) +
                " a «" +
                keep.name +
                "»: un solo andamento, un solo record."
              : "«" + gone.name + "» non è in nessuna sessione: nessuna si sposta."}
          </li>
          {n.plans > 0 && (
            <li>
              {F.plural(n.plans, "posto nel Piano usa", "posti nel Piano usano")} «
              {keep.name}» al suo posto.
            </li>
          )}
          <li>
            «{gone.name}» esce dalla Libreria e resta salvato come altro nome di «
            {keep.name}», archiviato e mai cancellato.
          </li>
          <li>
            Le note e la guida che «{keep.name}» non ha le prende da «{gone.name}».
          </li>
        </ul>
      </section>
      <form action={mergeExercise.bind(null, keep.id, gone.id)} className="k-section">
        <div className="k-line g2">
          <a className="k-btn secondary" href={back}>
            Lascia stare
          </a>
          <button type="submit" className="k-btn primary">
            Unisci
          </button>
        </div>
      </form>
    </main>
  );
}
