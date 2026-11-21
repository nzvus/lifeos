"use client";
/** Kinship rows in the gallery (PAT-103): a stored parent stepped, a found one, a long name, «+». */
import { useState } from "react";
import { F, KinRows } from "@lifeos/kit";
import { food } from "@/i18n/food";

export function KinSample() {
  const [k, setK] = useState(1.5);
  return (
    <div className="k-stack g3">
      <KinRows
        words={food.meal.kin}
        hour={12}
        candidates={[
          { id: "a", name: "Porridge Proteico", uses: 12 },
          { id: "b", name: "Gnocchi alla sorrentina", uses: 3 },
        ]}
        parents={[
          {
            key: "g",
            name: "Gelato Proteico",
            k: F.input(k, 2),
            onGo: () => {},
            step: {
              minus: "Meno Gelato Proteico",
              plus: "Più Gelato Proteico",
              onMinus: () => setK((x) => Math.max(0.25, x - 0.25)),
              onPlus: () => setK((x) => x + 0.25),
            },
          },
          { key: "p", name: "Porridge Proteico", k: "1", onGo: () => {} },
        ]}
        children={[
          {
            key: "c1",
            name: "GELATO proteico cioccolato e nocciola",
            k: "1",
            href: "#kin",
          },
          { key: "c2", name: "GELATO proteico al pistacchio", k: "1", onGo: () => {} },
        ]}
        onAddParent={() => {}}
        onAddChild={() => {}}
      />
      {/* no kin yet: each row is its «+» alone, wide, its words written (§163) */}
      <KinRows
        words={food.meal.kin}
        hour={12}
        candidates={[]}
        parents={[]}
        children={[]}
        onAddParent={() => {}}
        onAddChild={() => {}}
      />
    </div>
  );
}
