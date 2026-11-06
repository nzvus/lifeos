"use client";
/**
 * The generic page of a catalog object (PAT-04, PAT-30): the kit's ObjectPage with the values
 * the registry declares and the verbs it allows, each answered by a toast with «Annulla»
 * (PAT-21, PAT-74). Every type moves onto it in its own change (phase 4).
 */
import { useRouter } from "next/navigation";
import { ObjectActions, ObjectPage, useToast, type ObjectVerb } from "@lifeos/kit";
import type { Undo } from "@/core/verbs";
import { common } from "@/i18n/common";
import { objects } from "@/i18n/objects";
import type { ValueRow } from "./present";

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
  rows,
  verbs,
  archived,
  type,
  id,
  run,
  revert,
}: {
  back: { label: string; href: string };
  title: string;
  meta: string;
  rows: readonly ValueRow[];
  verbs: readonly string[];
  archived: boolean;
  type: string;
  id: string;
  run: (type: string, id: string, verb: string) => Promise<Answer>;
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
        rows.length ? (
          <dl className="k-stack g1">
            {rows.map((r) => (
              <div key={r.key} className="k-stack">
                <dt className="k-label">{r.label}</dt>
                <dd className="k-body">
                  {r.href ? (
                    <a href={r.href} target="_blank" rel="noreferrer">
                      {r.value}
                    </a>
                  ) : (
                    r.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
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
