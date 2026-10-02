/**
 * features/account/assistant/Thinking.tsx — the assistant at work, as chat
 * apps show it (developer, 2026-10-03): a bubble with its icon pulsing and
 * three dots rising in turn, and a line that says how far it is — thinking,
 * looking at your data, writing — then, past 15 s, that it is taking longer
 * than usual, with the seconds. The reply comes in one piece (a server
 * action), so the steps follow the time, not the server.
 * Motion only with motion-safe: (the phone's "reduce motion" turns it off).
 */
"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { fill, type Messages } from "@/i18n";

/** Seconds at which the line moves to the next step; the last is "slow". */
const STEPS_AT = [0, 3, 8];
const SLOW_AT = 15;

export function Thinking({ t }: { t: Messages["assistant"] }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const step = STEPS_AT.filter((at) => seconds >= at).length - 1;
  const line =
    seconds >= SLOW_AT
      ? fill(t.thinkingSlow, { s: String(seconds) })
      : t.thinkingSteps[step]!;
  return (
    <li className="mr-6 flex gap-2 motion-safe:animate-rise" aria-live="polite">
      <span className="section-icon mt-0.5 shrink-0 motion-safe:animate-pulse">
        <Sparkles size={16} aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-1">
        <span
          className="inline-flex w-fit items-center gap-1 rounded-surface bg-paper px-3 py-2.5"
          aria-hidden="true"
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-muted motion-safe:animate-typing"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </span>
        <span className="text-meta text-muted">{line}</span>
      </div>
    </li>
  );
}
