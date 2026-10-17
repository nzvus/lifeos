/** Impostazioni → Cestino (V-14): what was removed in the last 30 days, each with «Ripristina». */
import { F, PageHeader } from "@lifeos/kit";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { readTrash, TRASH_DAYS } from "@/core/entries";
import { NAMES } from "@/features/day/words";
import { restoreFromTrash } from "./actions";

export default async function TrashPage() {
  const owner = await requireOwner();
  const trash = await readTrash(await getDb(), owner, new Date());
  return (
    <main className="k-page">
      <PageHeader
        title="Cestino"
        context={"ultimi " + TRASH_DAYS + " giorni"}
        back={{ label: "Impostazioni", href: "/impostazioni" }}
        of={{ place: "impostazioni" }}
      />
      <section className="k-section g2" aria-label="Voci eliminate">
        {trash.length === 0 && <p className="k-help">Il cestino è vuoto.</p>}
        {trash.map((t) => (
          <form
            key={t.id}
            action={restoreFromTrash.bind(null, t.id)}
            className="k-line between"
          >
            <span className="k-body">
              {NAMES[t.kind] ?? t.kind}
              <span className="k-meta"> · del {F.Day(t.day)}</span>
            </span>
            <button type="submit" className="k-chip">
              Ripristina
            </button>
          </form>
        ))}
      </section>
    </main>
  );
}
