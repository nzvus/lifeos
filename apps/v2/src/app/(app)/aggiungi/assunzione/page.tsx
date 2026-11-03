/**
 * ⊕ → «Assunzione» (FOOD-44, ADR-0060): caffè, creatina, integratori — each one
 * tap at its dose, most used first; a mix (a coffee with milk) still goes
 * through the composer; «+ Nuova assunzione» makes a new one.
 */
import { Box, F, List, PageHeader } from "@lifeos/kit";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { readFoodChoices } from "@/core/food/catalog";
import { doseWords } from "@/features/day/QuickIntakes";
import { addContext } from "../kinds";
import { logIntakeAndBack } from "./actions";

export default async function IntakePage({
  searchParams,
}: {
  searchParams: Promise<{ giorno?: string | string[] }>;
}) {
  const owner = await requireOwner();
  const db = await getDb();
  const { day, today } = await addContext(db, owner, (await searchParams).giorno);
  const items = (await readFoodChoices(db, owner, today))
    .filter((c) => c.intake && c.foodId)
    .sort((a, b) => b.uses - a.uses || a.name.localeCompare(b.name, "it"));
  return (
    <main className="k-page">
      <PageHeader
        title="Assunzione"
        context={(day === today ? "oggi" : F.Day(day)) + " · adesso, un tocco"}
        back={{ label: "Aggiungi", href: "/aggiungi?giorno=" + day }}
        of={{ fam: "drink", kind: "supplement" }}
      />
      <section className="k-section g2" aria-label="Le tue assunzioni">
        {items.length === 0 ? (
          <p className="k-empty k-meta">
            Ancora nessuna: un caffè, la creatina, un integratore. Creane una qui sotto.
          </p>
        ) : (
          <List label="Le tue assunzioni">
            {items.map((c) => (
              <form key={c.key} action={logIntakeAndBack.bind(null, day, c.foodId!)}>
                <button type="submit" className="k-pick">
                  <Box
                    density="row"
                    rail={false}
                    entry={{
                      fam: "drink",
                      ...(c.drawing ? { of: c.drawing } : { of: { kind: "supplement" } }),
                      title: c.name,
                      meta:
                        doseWords(c.intake!.dose, c.unit, c.intake!.doseName) +
                        (c.uses
                          ? " · " + F.plural(c.uses, "volta", "volte") + " in 90 giorni"
                          : ""),
                      value: "+",
                    }}
                  />
                </button>
              </form>
            ))}
          </List>
        )}
        <a className="k-btn secondary" href={"/aggiungi/assunzione/nuova?giorno=" + day}>
          + Nuova assunzione
        </a>
        <a className="k-link" href={"/aggiungi/pasto?giorno=" + day + "&per=assunzione"}>
          Più cose insieme (un caffè col latte): dal compositore
        </a>
      </section>
    </main>
  );
}
