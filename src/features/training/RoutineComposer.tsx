"use client";
/**
 * A scheda composed (PAT-62; change 2026-11-07-exercise-scheda): its name, then its exercises
 * in order on the kit's `Composer` without quantities («Su» / «Giù» / «Togli»), his exercises
 * to add from its `Find`; «Annulla» + «Salva». The sets come from the proposal (TR-30), not
 * from here. A refused save comes back with what was typed and the words of the refusal.
 */
import { useActionState, useState } from "react";
import {
  Banner,
  Composer,
  Field,
  PageHeader,
  type ComposerLine,
  type FindItem,
} from "@lifeos/kit";
import { training } from "@/i18n/training";

export type RoutineState = {
  errors: Record<string, string>;
  name: string;
  order: string[];
  n: number;
};

const w = training.routine;

export function RoutineComposer({
  title,
  back,
  exercises,
  initial,
  hour,
  action,
}: {
  title: string;
  back: { label: string; href: string };
  exercises: readonly FindItem[];
  initial: { name: string; order: string[] };
  hour: number;
  action: (prev: RoutineState, data: FormData) => Promise<RoutineState>;
}) {
  const [state, submit, pending] = useActionState(action, {
    errors: {},
    ...initial,
    n: 0,
  });
  return (
    <Draft key={state.n} {...{ title, back, exercises, hour, state, submit, pending }} />
  );
}

function Draft({
  title,
  back,
  exercises,
  hour,
  state,
  submit,
  pending,
}: {
  title: string;
  back: { label: string; href: string };
  exercises: readonly FindItem[];
  hour: number;
  state: RoutineState;
  submit: (data: FormData) => void;
  pending: boolean;
}) {
  const by = new Map(exercises.map((x) => [x.id, x]));
  const line = (x: FindItem): ComposerLine => ({
    key: x.id,
    quantity: "",
    unit: "",
    step: 1,
    entry: { fam: "train", title: x.name, ...(x.meta ? { meta: x.meta } : {}) },
  });
  const [lines, setLines] = useState<ComposerLine[]>(() =>
    state.order.flatMap((id) => (by.has(id) ? [line(by.get(id)!)] : [])),
  );
  const e = state.errors;
  return (
    <main className="k-page">
      <Composer
        counted={false}
        lines={lines}
        onLines={setLines}
        candidates={exercises}
        hour={hour}
        findLabel={w.find}
        toLine={line}
        head={
          <>
            <PageHeader title={title} back={back} of={{ fam: "train" }} />
            {e["form"] && <Banner text={e["form"]} />}
            <div className="k-section">
              <Field
                name="name"
                label={w.name}
                type="text"
                required
                placeholder={w.namePlaceholder}
                defaultValue={state.name}
                error={e["name"]}
              />
            </div>
          </>
        }
        title={{ label: w.exercises, node: w.exercises }}
        empty={<p className="k-help">{e["lines"] ?? w.empty}</p>}
        errors={e}
        canSave
        saveLabel={w.save}
        cancelHref={back.href}
        action={submit}
        busy={pending}
      />
    </main>
  );
}
