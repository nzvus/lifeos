/**
 * «Unisci» a food (capture.md §4; interaction.md §3: a consequential action,
 * said before it is done): what moves from the food that goes to the one kept,
 * then «Unisci» or back. `?con=<id>` is the one that goes.
 */
import { notFound } from "next/navigation";
import { F, PageHeader } from "@lifeos/kit";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { mergePreview } from "@/core/catalog/merge";
import { logicalDay } from "@/core/engines/time";
import { readFoodChoices } from "@/core/food/catalog";
import { mergeFood } from "../modifica/actions";

export default async function MergeFoodPage({
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
  const { clock } = await ownerClock();
  const foods = await readFoodChoices(db, owner, logicalDay(new Date(), clock));
  const food = (fid: string) =>
    foods.find((f) => f.foodId === fid && f.productId === null);
  const keep = food(id);
  const gone = typeof con === "string" ? food(con) : undefined;
  if (!keep || !gone || keep.foodId === gone.foodId) notFound();
  const n = await mergePreview(db, owner, gone.foodId!);
  const products = foods.filter(
    (f) => f.foodId === gone.foodId && f.productId !== null,
  ).length;
  const back = "/libreria/cibo/" + id;
  return (
    <main className="k-page">
      <PageHeader
        title={"Unisci «" + gone.name + "»"}
        context={"in «" + keep.name + "»"}
        back={{ label: keep.name, href: back }}
        of={{ fam: "food" }}
      />
      <section className="k-section g3" aria-label="Cosa succede">
        <h2>Cosa succede</h2>
        <ul className="k-stack g2 k-body">
          <li>
            {n.lines > 0
              ? F.plural(n.lines, "riga di pasto passa", "righe di pasti passano") +
                " a «" +
                keep.name +
                "»: i valori registrati restano quelli di allora."
              : "«" + gone.name + "» non è in nessun pasto: nessuno si sposta."}
          </li>
          {products > 0 && (
            <li>
              {products === 1
                ? "Il suo prodotto passa sotto «" + keep.name + "», con i suoi prezzi."
                : F.plural(products, "prodotto passa", "prodotti passano") +
                  " sotto «" +
                  keep.name +
                  "», con i loro prezzi."}
            </li>
          )}
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
            I valori che «{keep.name}» non ha li prende da «{gone.name}».
          </li>
        </ul>
      </section>
      <form action={mergeFood.bind(null, id, gone.foodId!)} className="k-section">
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
