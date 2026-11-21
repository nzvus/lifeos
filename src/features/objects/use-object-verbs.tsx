"use client";
/**
 * A catalog object's verbs (PAT-16…24, MOD-20), shared by its page and by its box in the Elenco
 * (PAT-101): «Parti da» and «Variante» open the type's form from it, «Unisci» its sheet, the rest
 * run through `core/verbs` and answer with a toast and «Annulla» (PAT-21, PAT-74).
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MergeSheet,
  useToast,
  WORDS,
  type ObjectVerb,
  type PlanAction,
} from "@lifeos/kit";
import type { Undo } from "@/core/verbs";
import { common } from "@/i18n/common";
import { objects } from "@/i18n/objects";

export type Answer =
  | { ok: true; undo: Undo | null }
  /** `offer`: the verb that would do instead («archive» for a thing in use). */
  | { ok: false; refused: string; offer?: string };

/** The server's side of the verbs, passed down from the page (server actions). */
export type VerbServer = {
  run: (type: string, id: string, verb: string) => Promise<Answer>;
  revert: (u: Undo) => Promise<Answer>;
  mergePreview: (type: string, keep: string, gone: string) => Promise<string[]>;
  merge: (type: string, keep: string, gone: string) => Promise<Answer>;
  /** Kinship between pasti (MOD-23, PAT-103): where the Elenco draws it. */
  kin?: {
    step: (childId: string, parentId: string, k: number) => Promise<boolean>;
    addParent: (childId: string, parentId: string) => Promise<boolean>;
    addChild: (parentId: string) => Promise<string | null>;
    /** A food's grams set, added, or taken out (null) in the pasto's box (§169). */
    food: (pastoId: string, key: string, quantity: number | null) => Promise<boolean>;
  };
};

/** The object a verb is done on. */
export type VerbTarget = {
  type: string;
  id: string;
  title: string;
  /** The type's create form: «Parti da…» and «Variante» open it from this object. */
  newHref: string;
  /** The other objects of its type, for «Unisci» (PAT-18). */
  others: readonly { id: string; name: string }[];
  typeName: string;
};

const DONE: Partial<Record<ObjectVerb, string>> = {
  archive: common.states.archived,
  restore: common.states.restored,
  trash: common.states.deleted,
  delete: common.states.deleted,
};
const DANGER = new Set<string>(["delete", "trash"]);

/**
 * The verbs of a box's actions row (PAT-101), in the type's order: «Ripristina» only on an
 * archived object (not in a list), «Unisci» only with another of its type, one «Elimina».
 */
export function rowVerbs(
  verbs: readonly string[],
  hasOthers: boolean,
): { verb: ObjectVerb; danger: boolean }[] {
  return (
    verbs
      .filter((v) => v !== "restore" && (v !== "merge" || hasOthers))
      .filter((v) => !(v === "trash" && verbs.includes("delete")))
      // the trash absorbs «Archivia» (his §169): a thing in use is archived by it
      .filter((v) => !(v === "archive" && verbs.includes("delete")))
      .map((v) => ({ verb: v as ObjectVerb, danger: DANGER.has(v) }))
  );
}

export const refusal = (r: string) =>
  objects.refused[r as keyof typeof objects.refused] ?? objects.refused.other;

export function useObjectVerbs(server: VerbServer) {
  const router = useRouter();
  const { say, toast } = useToast();
  const [merging, setMerging] = useState<VerbTarget | null>(null);
  const [hour] = useState(() => new Date().getHours());

  const act = async (t: VerbTarget, verb: ObjectVerb) => {
    let v = verb;
    if (v === "merge") return setMerging(t);
    if (v === "startFrom" || v === "variant")
      return router.push(`${t.newHref}?${v === "startFrom" ? "da" : "variante"}=${t.id}`);
    let r = await server.run(t.type, t.id, v);
    // The trash absorbs «Archivia» (his §169): a thing already used is archived, not refused
    // (MOD-20: delete only if unused, else archive); the toast says which, with «Annulla».
    if (!r.ok && v === "delete" && r.refused === "in_use" && r.offer === "archive") {
      v = "archive";
      r = await server.run(t.type, t.id, v);
    }
    if (!r.ok) return say(refusal(r.refused));
    const u = r.undo;
    say(
      DONE[v] ?? common.states.saved,
      u ? () => server.revert(u).then(() => router.refresh()) : undefined,
    );
    return v;
  };

  /** A box's actions row from its verbs (PAT-101): every verb in one row, «Altro» gone. */
  const actions = (t: VerbTarget, verbs: readonly string[]): PlanAction[] =>
    rowVerbs(verbs, t.others.length > 0).map(({ verb, danger }) => {
      const label = WORDS.verbs[verb] ?? verb;
      return {
        key: verb,
        label,
        aria: label + " " + t.title,
        ...(danger ? { danger: "delete" as const } : {}),
        // «Unisci» an icon in its own colour, with the row's other icons (his §172)
        ...(verb === "merge" ? { icon: "merge" as const } : {}),
        onClick: () =>
          void act(t, verb).then((done) => {
            if (done) router.refresh();
          }),
      };
    });

  const sheet = (
    <MergeSheet
      open={merging !== null}
      keep={merging?.title ?? ""}
      candidates={merging?.others ?? []}
      hour={hour}
      findLabel={objects.find(merging?.typeName ?? "")}
      preview={(o) =>
        merging
          ? server.mergePreview(merging.type, merging.id, o.id)
          : Promise.resolve([])
      }
      onConfirm={async (o) => {
        if (!merging) return null;
        const r = await server.merge(merging.type, merging.id, o.id);
        if (!r.ok) return refusal(r.refused);
        say(objects.merged);
        router.refresh();
        return null;
      }}
      onClose={() => setMerging(null)}
    />
  );

  return { act, actions, sheet, toast, say };
}
