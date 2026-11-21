"use client";
/**
 * A pasto's kinship rows in its Elenco box (PAT-103, MOD-23): «Genitori» and «Figli» from its
 * row's kin, a chip's «× k» stepped by ¼ (a found link is stored first), its name showing that
 * pasto in the list, «+ genitore» searching the other pasti,
 * «+ figlio» a copy whose name then fills the list's search, so the new pasto is in view.
 */
import { F, KinRows, type KinChip } from "@lifeos/kit";
import type { VerbServer } from "@/features/objects/use-object-verbs";
import { food } from "@/i18n/food";
import type { KinLink, MealKin } from "./kin";

const w = food.meal.kin;
const STEP = 0.25;

export function MealKin({
  id,
  kin,
  pasti,
  server,
  onChild,
  onGo,
}: {
  id: string;
  kin: MealKin | undefined;
  /** Every pasto of the list, for «+ genitore». */
  pasti: readonly { id: string; name: string; uses: number }[];
  server: NonNullable<VerbServer["kin"]>;
  onChild: (name: string) => void;
  /** A kin's name tapped: the list shows that pasto (in place, PAT-30). */
  onGo: (name: string) => void;
}) {
  const parents = kin?.parents ?? [];
  const children = kin?.children ?? [];
  // Both rows alike (his §160): «× k» opens to step it, the name shows that pasto in the list.
  const chip = (x: KinLink, parent: boolean): KinChip => {
    const set = (k: number) =>
      void (parent ? server.step(id, x.id, k) : server.step(x.id, id, k));
    return {
      key: x.id,
      name: x.name,
      k: "×\u00a0" + F.input(x.k, 2),
      onGo: () => onGo(x.name),
      step: {
        minus: w.less(x.name),
        plus: w.more(x.name),
        onMinus: () => {
          if (x.k > STEP) set(x.k - STEP);
        },
        onPlus: () => set(x.k + STEP),
      },
    };
  };
  const kinIds = new Set([id, ...parents.map((p) => p.id), ...children.map((c) => c.id)]);
  return (
    <KinRows
      words={w}
      hour={new Date().getHours()}
      parents={parents.map((p) => chip(p, true))}
      children={children.map((c) => chip(c, false))}
      candidates={pasti.filter((p) => !kinIds.has(p.id))}
      onAddParent={(parent) => void server.addParent(id, parent)}
      onAddChild={() =>
        void server.addChild(id).then((name) => {
          if (name) onChild(name);
        })
      }
    />
  );
}
