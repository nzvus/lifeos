"use client";
/**
 * The day's water inside the timeline (the Main board): one box for every
 * drink, at the last one's time (or now), with +250 and +500 ml as its row
 * actions. One tap logs, and the toast says it with «Annulla», as every «assunzione» does (his
 * 15 Nov: no «Ancora +500?», «trattate tutte allo stesso modo»). Open, each drink is a row with
 * its time and a stepper: the amount is changed there, not only added (his 15 Nov «permetti di
 * poter modificare le quantità messe successivamente»; MOD-11).
 */
import { useEffect, useRef, useState, useTransition } from "react";
import { Box, Stepper, useToast, type BoxEntry } from "@lifeos/kit";

export type Water = {
  entry: BoxEntry;
  minute: number;
  drinks: { id: string; time: string; ml: number }[];
  /** The server action, bound to the day: the new drink's id, for «Annulla». */
  add: (ml: 250 | 500) => Promise<string | null>;
  /** A drink's ml changed; undefined when refused. */
  setMl: (id: string, ml: number) => Promise<number | null | undefined>;
  remove: (id: string) => Promise<boolean>;
};

/**
 * +250 and +500 ml as two actions (the box's and the dock's): one tap logs, the toast offers
 * «Annulla» (its own short time, the kit's toast).
 */
export function useWaterSteps(
  addMl: Water["add"],
  remove: Water["remove"],
  say: (text: string, undo?: () => unknown) => void,
) {
  const [busy, start] = useTransition();
  const act = (ml: 250 | 500) => ({
    label: "+" + ml,
    aria: "Aggiungi " + ml + " ml",
    onClick: () =>
      start(async () => {
        const id = await addMl(ml).catch(() => null);
        if (id) say("Acqua · " + ml + " ml", () => remove(id));
        else say("Non è stato salvato. Riprova.");
      }),
  });
  return { busy, steps: [act(250), act(500)] };
}

/** One drink: its time and its amount in a stepper; a change is saved after a short pause. */
function Drink({ d, setMl }: { d: Water["drinks"][number]; setMl: Water["setMl"] }) {
  const [v, setV] = useState(String(d.ml));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const change = (x: string) => {
    setV(x);
    if (timer.current) clearTimeout(timer.current);
    const n = Number(x);
    if (!Number.isInteger(n) || n < 1 || n === d.ml) return;
    timer.current = setTimeout(() => void setMl(d.id, n), 700);
  };
  return (
    <div className="k-line between g2">
      {/* Its page still one tap away: there he removes it or changes its time (audit 15 Nov:
          the link was dropped with the stepper); the time is the link, no «›» (his 19 Nov). */}
      <a
        className="k-link k-body"
        href={"/voce/" + d.id}
        aria-label={"Apri la bevuta delle " + d.time}
      >
        {d.time}
      </a>
      <Stepper
        id={"ml-" + d.id}
        name="ml"
        label={"Acqua delle " + d.time}
        value={v}
        onChange={change}
        unit="ml"
        step={50}
      />
    </div>
  );
}

export function WaterRow({
  water,
  mode = "compact",
  onRail,
  rail = true,
}: {
  water: Water;
  mode?: "compact" | "times";
  onRail?: () => void;
  /** Off at the top of the day (P4, visual.md §5): no time rail there. */
  rail?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { say, toast } = useToast();
  const { busy, steps } = useWaterSteps(water.add, water.remove, say);
  return (
    <>
      <Box
        entry={water.entry}
        mode={mode}
        rail={rail}
        {...(onRail ? { onRail } : {})}
        acts={busy ? [] : steps}
        expanded={open}
        onToggle={() => setOpen(!open)}
      >
        {open && water.drinks.length > 0 && (
          <div className="k-stack g1" aria-label="Bevute">
            {water.drinks.map((d) => (
              <Drink key={d.id} d={d} setMl={water.setMl} />
            ))}
          </div>
        )}
      </Box>
      {toast}
    </>
  );
}
