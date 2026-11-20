"use client";
/** The box's actions row in the gallery (PAT-101): a stepped value, a verb, the trash last. */
import { useState } from "react";
import { ActionRow, F } from "@lifeos/kit";

export function ActionSample() {
  const [n, setN] = useState(0.5);
  return (
    <ActionRow
      actions={[
        { key: "delete", label: "Elimina", danger: "delete", onClick: () => setN(1) },
        {
          key: "servings",
          label: "Porzioni",
          step: {
            value: "× " + F.input(n, 2),
            minus: "Meno porzioni",
            plus: "Più porzioni",
          },
          onMinus: () => setN((x) => Math.max(0.25, x - 0.25)),
          onPlus: () => setN((x) => x + 0.25),
        },
        { key: "save", label: "Salva come pasto", href: "#azioni-box" },
      ]}
    />
  );
}
