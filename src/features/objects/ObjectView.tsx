"use client";
/**
 * The generic page of a catalog object (PAT-04, PAT-30): the kit's ObjectPage with the values
 * the registry declares and the verbs it allows, each answered by a toast with «Annulla»
 * (PAT-21, PAT-74). Every type moves onto it in its own change (phase 4).
 */
import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  InPlace,
  MergeSheet,
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
  parts,
  progress,
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
}: {
  back: { label: string; href: string };
  title: string;
  meta: string;
  fields: readonly ObjectField[];
  /** A type's own sections (its specialisation): its parts and its progress. */
  parts?: { title: string; node: ReactNode };
  progress?: ReactNode;
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
}) {
  const router = useRouter();
  const { say, toast } = useToast();
  const [merging, setMerging] = useState(false);
  const [hour] = useState(() => new Date().getHours());
  const refusal = (r: string) =>
    objects.refused[r as keyof typeof objects.refused] ?? objects.refused.other;
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
    if (v === "merge") return setMerging(true);
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
        </div>
      }
      {...(parts ? { parts } : {})}
      {...(progress ? { progress } : {})}
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
          <MergeSheet
            open={merging}
            keep={title}
            candidates={others}
            hour={hour}
            findLabel={objects.find(typeName)}
            preview={(o) => mergePreview(type, id, o.id)}
            onConfirm={async (o) => {
              const r = await merge(type, id, o.id);
              if (!r.ok) return refusal(r.refused);
              say(objects.merged);
              router.refresh();
              return null;
            }}
            onClose={() => setMerging(false)}
          />
          {toast}
        </>
      }
    />
  );
}
