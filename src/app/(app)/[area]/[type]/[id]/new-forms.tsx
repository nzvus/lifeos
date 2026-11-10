/**
 * `/{area}/{type}/nuovo` (PAT-11): a type's create form, looked up by type key in this one map
 * (PAT-90). A type with plain declared fields will get the generated `ObjectForm` here; a type
 * with a specialisation brings its own editor (PAT-61).
 */
import { PageHeader } from "@lifeos/kit";
import { TrackerForm } from "@/features/account/TrackerForm";
import { tracker } from "@/i18n/tracker";
import { ExerciseForm } from "@/features/library/ExerciseForm";
import { composeBlock, newBlock } from "./block-forms";
import { composeCycle, newCycle } from "./cycle-forms";
import { saveExercise } from "./exercise-actions";
import { newFood, newProduct } from "./food-forms";
import { composeRecipe, newRecipe } from "./recipe-forms";
import { composeRoutine, newRoutine } from "./routine-forms";
import { createTracker } from "./tracker-actions";

/** Where the form goes back to, and the address's query (`da`, `variante`, `di`). */
export type NewFormRender = (
  back: { label: string; href: string },
  query: Readonly<Record<string, string | undefined>>,
) => React.ReactNode | Promise<React.ReactNode>;

/**
 * A type's create form. `from`: the verbs it can start from an object (PAT-16 «Parti da»:
 * `?da=<id>`, PAT-17 «Variante»: `?variante=<id>`); the generic page offers only those.
 */
export type NewForm = {
  render: NewFormRender;
  from?: readonly ("startFrom" | "variant")[];
};

const trackerNew: NewFormRender = (back) => (
  <main className="k-page">
    <PageHeader title={tracker.page.newTitle} back={back} of={{ fam: "habit" }} />
    <section className="k-section g3" aria-label={tracker.page.newTitle}>
      <TrackerForm action={createTracker} />
    </section>
  </main>
);

export const NEW_FORMS: Record<string, NewForm> = {
  tracker: { render: trackerNew },
  food: { render: newFood, from: ["startFrom"] },
  product: { render: newProduct },
  recipe: { render: newRecipe, from: ["startFrom", "variant"] },
  exercise: { render: () => <ExerciseForm action={saveExercise} /> },
  routine: { render: newRoutine, from: ["startFrom"] },
  cycle: { render: newCycle },
  block: { render: newBlock },
};

/**
 * `/{area}/{type}/{id}/componi` (PAT-04, PAT-62): the Composer of a type with lines, by type
 * key; composing its lines is not a value edited in place (PRD-11), so it keeps a page.
 */
export const COMPOSERS: Record<
  string,
  (id: string) => React.ReactNode | Promise<React.ReactNode>
> = {
  recipe: composeRecipe,
  routine: composeRoutine,
  cycle: composeCycle,
  block: composeBlock,
};

/** The query word of each starting verb (PAT-16, PAT-17). */
export const FROM_QUERY = { startFrom: "da", variant: "variante" } as const;
