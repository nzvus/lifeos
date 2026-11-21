"use client";
/**
 * A pasto's kinship rows in its Elenco box (PAT-103, MOD-23): «Genitori» and «Figli» from its
 * row's kin, a stored parent's «× k» stepped by ¼, «+ genitore» searching the other pasti,
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
}: {
  id: string;
  kin: MealKin | undefined;
  /** Every pasto of the list, for «+ genitore». */
  pasti: readonly { id: string; name: string; uses: number }[];
  server: NonNullable<VerbServer["kin"]>;
  onChild: (name: string) => void;
}) {
  const parents = kin?.parents ?? [];
  const children = kin?.children ?? [];
  const chip = (x: KinLink, parent: boolean): KinChip => ({
    key: x.id,
    name: x.name,
    k: "× " + F.input(x.k, 2),
    href: "/cibo/pasto/" + x.id,
    ...(parent && x.stored
      ? {
          step: {
            minus: w.less(x.name),
            plus: w.more(x.name),
            onMinus: () => {
              if (x.k > STEP) void server.step(id, x.id, x.k - STEP);
            },
            onPlus: () => void server.step(id, x.id, x.k + STEP),
          },
        }
      : {}),
  });
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
