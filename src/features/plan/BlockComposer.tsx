"use client";
/**
 * What a blocco holds, composed (PAT-62; PL-01…03): its objects on the kit's `Composer` with
 * their servings — one object, or several = a rotation («A turno», PL-02, its order is the
 * rotation's) — or one type with no quantity (a fixed line: an abitudine is a tracker's blocco,
 * PL-03). The search holds both: picking a type puts it alone, picking an object takes the
 * type away. «Annulla» + «Salva»; a refused save comes back with the lines and its words.
 */
import { useActionState, useState } from "react";
import {
  Banner,
  Composer,
  Find,
  PageHeader,
  type ComposerLine,
  type FindItem,
} from "@lifeos/kit";
import { plan } from "@/i18n/plan";
import { KIND_KEY } from "./block-keys";

/** A line as the page gives it: an object (`id`) with servings, or a type (`kind:<key>`). */
export type BlockLine = {
  key: string;
  name: string;
  meta: string;
  quantity: string;
  /** Its type's family, for its glyph (a pasto is food). */
  fam: string;
};
export type BlockOption = FindItem & { fam: string };
export type BlockState = {
  errors: Record<string, string>;
  lines: BlockLine[];
  n: number;
};

const w = plan.block;

export function BlockComposer({
  title,
  back,
  options,
  initial,
  hour,
  action,
}: {
  title: string;
  back: { label: string; href: string };
  /** His objects a blocco may hold and the types, a type's id `kind:<key>`. */
  options: readonly BlockOption[];
  initial: BlockLine[];
  hour: number;
  action: (prev: BlockState, data: FormData) => Promise<BlockState>;
}) {
  const [state, submit, pending] = useActionState(action, {
    errors: {},
    lines: initial,
    n: 0,
  });
  return (
    <Draft key={state.n} {...{ title, back, options, hour, state, submit, pending }} />
  );
}

function Draft({
  title,
  back,
  options,
  hour,
  state,
  submit,
  pending,
}: {
  title: string;
  back: { label: string; href: string };
  options: readonly BlockOption[];
  hour: number;
  state: BlockState;
  submit: (data: FormData) => void;
  pending: boolean;
}) {
  const line = (l: BlockLine): ComposerLine => {
    const kind = l.key.startsWith(KIND_KEY);
    return {
      key: l.key,
      quantity: kind ? "1" : l.quantity,
      unit: kind ? "" : w.servingUnit,
      step: 0.5,
      ...(kind ? { fixed: true } : {}),
      entry: { fam: l.fam, title: l.name, meta: l.meta },
    };
  };
  const [lines, setLines] = useState<ComposerLine[]>(() => state.lines.map(line));
  const pick = (x: BlockOption) => {
    const l = line({
      key: x.id,
      name: x.name,
      meta: x.meta ?? "",
      quantity: "1",
      fam: x.fam,
    });
    setLines((ls) =>
      x.id.startsWith(KIND_KEY)
        ? [l]
        : [...ls.filter((y) => !y.key.startsWith(KIND_KEY) && y.key !== x.id), l],
    );
  };
  const e = state.errors;
  const rotation = lines.length > 1;
  return (
    <main className="k-page">
      <Composer
        lines={lines}
        onLines={setLines}
        candidates={options}
        hour={hour}
        findLabel={w.find}
        search={
          <Find
            items={options.filter((o) => !lines.some((l) => l.key === o.id))}
            label={w.find}
            hour={hour}
            clearOnPick
            onPick={pick}
          />
        }
        head={
          <>
            <PageHeader title={title} back={back} of={{ fam: "day" }} />
            {e["form"] && <Banner text={e["form"]} />}
            {rotation && (
              <div className="k-block">
                <p className="k-help">{w.rotationHelp}</p>
              </div>
            )}
          </>
        }
        title={{
          label: rotation ? w.rotation : w.what,
          node: rotation ? w.rotation : w.what,
        }}
        empty={<p className="k-help">{e["lines"] ?? w.nothing}</p>}
        errors={e}
        saveLabel={w.save}
        cancelHref={back.href}
        action={submit}
        busy={pending}
      />
    </main>
  );
}
