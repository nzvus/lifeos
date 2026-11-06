"use client";
/**
 * The generic page of a catalog object (PAT-04, PAT-30): the kit's ObjectPage with the values
 * the registry declares and the verbs it allows, each answered by a toast with «Annulla»
 * (PAT-21, PAT-74). Every type moves onto it in its own change (phase 4).
 */
import { useRouter } from "next/navigation";
import {
  InPlace,
  ObjectActions,
  ObjectPage,
  useToast,
  type ObjectVerb,
} from "@lifeos/kit";
import type { Undo } from "@/core/verbs";
import { common } from "@/i18n/common";
import { objects } from "@/i18n/objects";
import type { ObjectField } from "./present";

type Answer = { ok: true; undo: Undo | null } | { ok: false; refused: string };

const DONE: Partial<Record<ObjectVerb, string>> = {
  archive: common.states.archived,
  restore: common.states.restored,
  trash: common.states.deleted,
  delete: common.states.deleted,
};

export function ObjectView({
  back,
  title,
  meta,
  fields,
  verbs,
  archived,
  type,
  id,
  run,
  save,
  revert,
}: {
  back: { label: string; href: string };
  title: string;
  meta: string;
  fields: readonly ObjectField[];
  verbs: readonly string[];
  archived: boolean;
  type: string;
  id: string;
  run: (type: string, id: string, verb: string) => Promise<Answer>;
  save: (
    type: string,
    id: string,
    key: string,
    value: string | number | boolean | null,
  ) => Promise<Answer>;
  revert: (u: Undo) => Promise<Answer>;
}) {
  const router = useRouter();
  const { say, toast } = useToast();
  const onVerb = async (v: ObjectVerb) => {
    const r = await run(type, id, v);
    if (!r.ok) {
      const why = objects.refused[r.refused as keyof typeof objects.refused];
      say(why ?? objects.refused.other);
      return;
    }
    const u = r.undo;
    say(
      DONE[v] ?? common.states.saved,
      u ? () => revert(u).then(() => router.refresh()) : undefined,
    );
    if (v === "delete" || v === "trash") router.push(back.href);
    else router.refresh();
  };
  return (
    <ObjectPage
      back={back}
      title={title}
      meta={meta}
      values={
        fields.length ? (
          <div className="k-stack">
            {fields.map((f) => (
              <InPlace
                key={f.spec.key}
                spec={f.spec}
                value={f.value}
                shown={f.shown}
                onSave={async (v) => {
                  const r = await save(type, id, f.spec.key, v);
                  if (!r.ok)
                    return (
                      objects.refused[r.refused as keyof typeof objects.refused] ??
                      objects.refused.other
                    );
                  const u = r.undo;
                  say(
                    common.states.saved,
                    u ? () => revert(u).then(() => router.refresh()) : undefined,
                  );
                  router.refresh();
                  return null;
                }}
              />
            ))}
          </div>
        ) : (
          <span className="k-body">{objects.noValues}</span>
        )
      }
      actions={
        <ObjectActions
          title={title}
          verbs={verbs}
          archived={archived}
          onVerb={(v) => void onVerb(v)}
        />
      }
      toast={toast}
    />
  );
}
