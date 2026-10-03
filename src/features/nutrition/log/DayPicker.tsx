/**
 * features/nutrition/log/DayPicker.tsx — a calendar button next to the
 * day's title: opens the browser's own date picker and goes to the chosen
 * day (/?day=…). Replaces the old "Go to [date] Go" row (S20): one icon in
 * the navigation row instead of a second row of controls.
 * Client component: it opens the picker and navigates.
 */
"use client";

import { CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { buttonClass } from "@/ui/button";
import { useViewHref } from "@/ui/ViewSwitch";

export function DayPicker({ day, label }: { day: string; label: string }) {
  const router = useRouter();
  // The open view goes along to the chosen day (ADR-0033).
  const withView = useViewHref();
  const input = useRef<HTMLInputElement>(null);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={() => {
          const el = input.current;
          if (!el) return;
          // showPicker() where supported; focusing the field is the fallback.
          if (typeof el.showPicker === "function") el.showPicker();
          else el.focus();
        }}
        className={buttonClass({ variant: "quiet", iconOnly: true })}
      >
        <CalendarDays size={20} aria-hidden="true" />
      </button>
      <input
        ref={input}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        defaultValue={day}
        onChange={(e) => {
          if (e.target.value) router.push(withView(`/?day=${e.target.value}`));
        }}
        // Invisible, under the button: the picker opens anchored here.
        className="pointer-events-none absolute inset-0 opacity-0"
      />
    </span>
  );
}
