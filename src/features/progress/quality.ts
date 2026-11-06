/**
 * features/progress/quality.ts — «Qualità dei dati» (E9) in words: for one
 * thing logged, how many days of the window have it, which are missing, the
 * values that look wrong (out of range, a doubled entry, a jump like a unit
 * slip) each with its entry to open, and the share of estimates. Pure.
 */
import { F, type BoxEntry } from "@lifeos/kit";
import type { QualityReport } from "@/core/engines/quality";

export type QualityLine = { text: string; href: string | null };

export function qualityBox(p: {
  fam: string;
  title: string;
  days: number;
  report: QualityReport;
  /** Formats a value for the issues («75,6 kg»). */
  show: (v: number) => string;
  dayOf: (id: string) => string | null;
  /** Speak of the estimates (meals). */
  estimates?: boolean;
}): { entry: BoxEntry; lines: QualityLine[] } {
  const r = p.report;
  const missing = r.issues.find((i) => i.type === "missing");
  const missed = missing && missing.type === "missing" ? missing.days : [];
  const have = p.days - missed.length;
  const lines: QualityLine[] = [];
  if (missed.length)
    lines.push({
      text:
        "Mancano " +
        F.plural(missed.length, "giorno", "giorni") +
        ": " +
        missed
          .slice(-6)
          .map((d) => F.date(d))
          .join(", ") +
        (missed.length > 6 ? "…" : ""),
      href: null,
    });
  for (const i of r.issues) {
    const day = (id: string) => (p.dayOf(id) ? " il " + F.date(p.dayOf(id)!) : "");
    if (i.type === "outOfRange")
      lines.push({
        text: "Valore fuori misura" + day(i.id) + ": " + p.show(i.value),
        href: "/voce/" + i.id,
      });
    if (i.type === "duplicate")
      lines.push({
        text: "Doppione" + day(i.id) + ": stessa ora, stesso valore",
        href: "/voce/" + i.id,
      });
    if (i.type === "unitJump")
      lines.push({
        text:
          "Salto strano" +
          day(i.id) +
          ": da " +
          p.show(i.previous) +
          " a " +
          p.show(i.value) +
          " (forse l’unità sbagliata)",
        href: "/voce/" + i.id,
      });
  }
  if (p.estimates && r.estimatedShare !== null && r.estimatedShare > 0)
    lines.push({
      text: F.num(r.estimatedShare * 100, "%") + " delle voci sono stime",
      href: null,
    });
  const share = p.days ? have / p.days : 0;
  return {
    entry: {
      fam: p.fam,
      title: p.title,
      value: have + "/" + p.days,
      meta:
        lines.length === 0
          ? "tutto a posto"
          : F.plural(lines.length, "cosa da guardare", "cose da guardare"),
      strip: [
        {
          w: Math.round(share * 100),
          c: F.tone(share >= 0.85 ? "good" : share >= 0.5 ? "warn" : "bad"),
        },
      ],
    },
    lines,
  };
}
