"use client";
/**
 * The generic page of a catalog object (PAT-04, PAT-30): the kit's ObjectPage with the values
 * the registry declares and the verbs it allows, each answered by a toast with «Annulla»
 * (PAT-21, PAT-74). Every type moves onto it in its own change (phase 4).
 */
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { InPlace, ObjectActions, ObjectPage, type ObjectVerb } from "@lifeos/kit";
import type { Undo } from "@/core/verbs";
import { common } from "@/i18n/common";
import { objects } from "@/i18n/objects";
import type { ObjectField } from "./present";
import { refusal, useObjectVerbs, type Answer } from "./use-object-verbs";

export function ObjectView({
  back,
  title,
  meta,
  fields,
  summary,
  first,
  fold,
  parts,
  progress,
  usedIn,
  others,
  typeName,
  verbs,
  archived,
  type,
  id,
  run,
  save,
  revert,
  rename,
  mergePreview,
  merge,
  newHref,
}: {
  back: { label: string; href: string };
  title: string;
  meta: string;
  fields: readonly ObjectField[];
  /** A type's own sections (its specialisation): a judgement of its values (a food's voto),
   *  its parts, its progress, where it is used. */
  summary?: ReactNode;
  /** ObjectPage's `first` and `fold` (a ciclo: «Questa volta» first, «Regole» folded). */
  first?: ReactNode;
  fold?: string;
  parts?: readonly { title: string; node: ReactNode }[];
  progress?: ReactNode;
  usedIn?: ReactNode;
  /** The other objects of its type, for «Unisci» (PAT-18). */
  others: readonly { id: string; name: string }[];
  typeName: string;
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
  rename: (type: string, id: string, name: string) => Promise<Answer>;
  mergePreview: (type: string, keep: string, gone: string) => Promise<string[]>;
  merge: (type: string, keep: string, gone: string) => Promise<Answer>;
  /** The type's create form: «Parti da…» and «Variante» open it from this object (PAT-16, PAT-17). */
  newHref: string;
}) {
  const router = useRouter();
  const { act, sheet, toast, say } = useObjectVerbs({ run, revert, mergePreview, merge });
  const target = { type, id, title, newHref, others, typeName };
  /** PAT-13: a value saved in place — its refusal in words, or «Salvato · Annulla». */
  const saved = async (answer: Promise<Answer>): Promise<string | null> => {
    const r = await answer;
    if (!r.ok) return refusal(r.refused);
    const u = r.undo;
    say(
      common.states.saved,
      u ? () => revert(u).then(() => router.refresh()) : undefined,
    );
    router.refresh();
    return null;
  };
  const onVerb = async (v: ObjectVerb) => {
    const done = await act(target, v);
    if (done === "delete" || done === "trash") router.push(back.href);
    else if (done) router.refresh();
  };
  return (
    <ObjectPage
      back={back}
      title={title}
      meta={meta}
      values={
        <div className="k-stack">
          <InPlace
            spec={{ key: "name", label: objects.name, type: "text", required: true }}
            value={title}
            shown={title}
            onSave={(v) => saved(rename(type, id, String(v ?? "")))}
          />
          {fields.map((f) => (
            <InPlace
              key={f.spec.key}
              spec={f.spec}
              value={f.value}
              shown={f.shown}
              onSave={(v) => saved(save(type, id, f.spec.key, v))}
            />
          ))}
          {summary}
        </div>
      }
      {...(parts ? { parts } : {})}
      {...(first ? { first } : {})}
      {...(fold ? { fold } : {})}
      {...(progress ? { progress } : {})}
      {...(usedIn ? { usedIn } : {})}
      actions={
        <ObjectActions
          title={title}
          verbs={verbs}
          archived={archived}
          onVerb={(v) => void onVerb(v)}
        />
      }
      toast={
        <>
          {sheet}
          {toast}
        </>
      }
    />
  );
}
