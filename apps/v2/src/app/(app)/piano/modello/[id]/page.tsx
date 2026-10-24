/**
 * Piano · «Giornata tipo» (dossiers/day-templates.md slice b; the board
 * ModelEditor): one day model with its base resolved (core/plans), its
 * targets in force today (core/day), its blocks with what each holds of the
 * day, the person's own meal split over the last 4 weeks as a hint.
 */
import { notFound } from "next/navigation";
import { NavBar, PageHeader, F } from "@lifeos/kit";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { readDayTargets } from "@/core/day";
import { addDays, logicalDay } from "@/core/engines/time";
import {
  historyShares,
  inheritedTargets,
  possibleBases,
  readModelBook,
  readRoleDays,
  resolveModel,
  toModels,
  type ResolvedBlock,
} from "@/core/plans";
import { MEAL_ROLE_WORDS } from "@/features/day/words";
import { blockName, blockRow, sharesWords } from "@/features/plan/model-form";
import { ModelEditor, type EditorBlock } from "@/features/plan/ModelEditor";
import { PLACES } from "@/features/places";
import {
  archiveForm,
  copyForm,
  removeBlockForm,
  resetTarget,
  restoreBlockForm,
  saveBlockForm,
  saveModelForm,
  sharesFromHistory,
  weekdaysForm,
} from "./actions";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ROLE_ORDER = ["breakfast", "lunch", "snack", "dinner"];
/** The blocks in the day's order: by time; an untimed meal where its role usually falls. */
const ROLE_AT: Record<string, number> = {
  breakfast: 480,
  lunch: 780,
  snack: 990,
  dinner: 1200,
};
const sortKey = (b: ResolvedBlock) =>
  b.when.type === "at"
    ? b.when.min
    : (ROLE_AT[String(b.defaults?.["role"] ?? "")] ?? 1440);

export default async function ModelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const owner = await requireOwner();
  const db = await getDb();
  const known = await ownerClock();
  const today = logicalDay(new Date(), known.clock);
  const [book, roleDays] = await Promise.all([
    readModelBook(db, owner),
    readRoleDays(db, owner, addDays(today, -28), addDays(today, -1), known),
  ]);
  const me = book.models.find((m) => m.id === id);
  if (!me) notFound();
  const models = toModels(book.models, book.rows);
  const resolved = resolveModel(id, models) ?? { blocks: [], removed: [], stale: [] };
  const t = inheritedTargets(id, book.models);
  const baseName = book.models.find((m) => m.id === me.extendsId)?.name ?? null;
  // What the day's numbers would be today with this model: the rows say «≈ 972 kcal».
  const day = await readDayTargets(db, owner, today, {
    name: me.name,
    targets: t.targets,
  });
  const names = new Map(resolved.blocks.map((b) => [b.id, blockName(b)]));
  const pct = (v: number | undefined) => (v === undefined ? "" : F.n(v * 100, 1));
  const editorBlock = (b: ResolvedBlock): EditorBlock => ({
    id: b.id,
    origin: b.origin,
    row: blockRow(
      b,
      names,
      baseName,
      day ? { kcal: day.kcal, protein: day.protein } : null,
    ),
    form: {
      kind: b.kind === "session" ? "session" : "meal",
      role: String(b.defaults?.["role"] ?? ""),
      at: b.when.type === "at" ? F.time(b.when.min) : "",
      kcalShare: pct(b.shares?.kcal),
      proteinShare: pct(b.shares?.protein),
      durationMin: b.durationMin ? String(b.durationMin) : "",
    },
  });
  const shares = historyShares(roleDays);
  const days = Math.max(0, ...Object.values(shares).map((s) => s.days));
  const history = days
    ? "Le tue ultime 4 settimane (" +
      F.plural(days, "giorno", "giorni") +
      "): " +
      ROLE_ORDER.filter((r) => shares[r])
        .map((r) => MEAL_ROLE_WORDS[r] + " " + F.num(shares[r]!.kcal * 100, "%"))
        .join(" · ")
    : null;
  const mine = [...book.week].filter(([, m]) => m === id).map(([d]) => d);
  const others = Object.fromEntries(
    [...book.week]
      .filter(([, m]) => m !== id)
      .map(([d, m]) => [d, book.models.find((x) => x.id === m)?.name ?? ""]),
  );
  const value = (k: string) => {
    const v = t.targets?.[k];
    return v === undefined || v === null ? "" : F.n(Number(v), 2).replace(/\./g, "");
  };
  const mode = t.targets?.["mode"] === "fixed" ? "fixed" : "dynamic";

  return (
    <main className="k-page has-bd">
      <PageHeader
        title={me.name}
        context={
          "giornata tipo" +
          (baseName ? " · costruita su «" + baseName + "»" : "") +
          (me.active ? "" : " · archiviata")
        }
        back={{ label: "Modelli", href: "/piano/modelli" }}
        of={{ fam: "day" }}
      />
      <ModelEditor
        name={me.name}
        base={me.extendsId ?? ""}
        bases={possibleBases(id, book.models)
          .filter((m) => m.active || m.id === me.extendsId)
          .map((m) => ({ value: m.id, label: m.name }))}
        mode={mode}
        values={Object.fromEntries(
          [
            "deficitKcal",
            "proteinGPerKg",
            "fatGPerKg",
            "kcal",
            "protein",
            "carbs",
            "fat",
            "fibre",
          ].map((k) => [k, value(k)]),
        )}
        inheritedFrom={Object.fromEntries(
          Object.entries(t.from).filter(([k]) => !t.own.includes(k)),
        )}
        own={t.own}
        blocks={[...resolved.blocks]
          .sort((a, b) => sortKey(a) - sortKey(b))
          .map(editorBlock)}
        removed={resolved.removed.map(editorBlock)}
        shares={sharesWords(resolved.blocks)}
        history={history}
        weekdays={mine}
        others={others}
        active={me.active}
        actions={{
          save: saveModelForm.bind(null, id),
          resetTarget: resetTarget.bind(null, id),
          saveBlock: saveBlockForm.bind(null, id),
          removeBlock: removeBlockForm.bind(null, id),
          restoreBlock: restoreBlockForm.bind(null, id),
          shares: sharesFromHistory.bind(null, id),
          weekdays: weekdaysForm.bind(null, id),
          archive: archiveForm.bind(null, id),
          copy: copyForm.bind(null, id),
        }}
      />
      <div className="k-nav k-stick">
        <NavBar active="plan" hrefs={PLACES} addHref="/aggiungi" />
      </div>
    </main>
  );
}
