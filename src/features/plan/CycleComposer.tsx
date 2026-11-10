"use client";
/**
 * A ciclo's steps composed (PAT-62 + «+ Riposo», Q-16 (a); PL-30): its steps in order on the
 * kit's `Composer` without quantities («Su» / «Giù» / «Togli»); under the lines the search of
 * his schede and a fixed «+ Riposo» that adds an empty step. The same scheda may come back
 * (Full body A, B, A): each line has its own key — a kept step its id, a new one `new.N.<what>`.
 * «Annulla» + «Salva». A refused save comes back with the lines as they were and its words.
 */
import { useActionState, useRef, useState } from "react";
import {
  Banner,
  Composer,
  Find,
  PageHeader,
  type ComposerLine,
  type FindItem,
} from "@lifeos/kit";
import { plan } from "@/i18n/plan";
import { newStepKey } from "./cycle-keys";

export type CycleStepLine = { key: string; itemId: string | null; label: string };
export type CycleState = {
  errors: Record<string, string>;
  lines: CycleStepLine[];
  n: number;
};

const w = plan.cycle;

export function CycleComposer({
  title,
  back,
  schede,
  initial,
  hour,
  action,
}: {
  title: string;
  back: { label: string; href: string };
  schede: readonly FindItem[];
  initial: CycleStepLine[];
  hour: number;
  action: (prev: CycleState, data: FormData) => Promise<CycleState>;
}) {
  const [state, submit, pending] = useActionState(action, {
    errors: {},
    lines: initial,
    n: 0,
  });
  return (
    <Draft key={state.n} {...{ title, back, schede, hour, state, submit, pending }} />
  );
}

function Draft({
  title,
  back,
  schede,
  hour,
  state,
  submit,
  pending,
}: {
  title: string;
  back: { label: string; href: string };
  schede: readonly FindItem[];
  hour: number;
  state: CycleState;
  submit: (data: FormData) => void;
  pending: boolean;
}) {
  const fresh = useRef(0);
  const line = (l: CycleStepLine): ComposerLine => ({
    key: l.key,
    quantity: "",
    unit: "",
    step: 1,
    entry: l.itemId
      ? { fam: "train", sub: "strength", title: l.label, meta: w.scheda }
      : { fam: "day", title: l.label || w.rest, meta: w.restMeta },
  });
  const [lines, setLines] = useState<ComposerLine[]>(() => state.lines.map(line));
  const add = (itemId: string | null, label: string) =>
    setLines((ls) => [
      ...ls,
      line({ key: newStepKey(fresh.current++, itemId), itemId, label }),
    ]);
  const e = state.errors;
  return (
    <main className="k-page">
      <Composer
        counted={false}
        lines={lines}
        onLines={setLines}
        candidates={schede}
        hour={hour}
        findLabel={w.find}
        search={
          <div className="k-stack g2">
            <Find
              items={schede}
              label={w.find}
              hour={hour}
              clearOnPick
              onPick={(x) => add(x.id, x.name)}
            />
            <button
              type="button"
              className="k-btn secondary"
              onClick={() => add(null, w.rest)}
            >
              {w.addRest}
            </button>
          </div>
        }
        head={
          <>
            <PageHeader title={title} back={back} of={{ fam: "day" }} />
            {e["form"] && <Banner text={e["form"]} />}
          </>
        }
        title={{ label: w.steps, node: w.steps }}
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
