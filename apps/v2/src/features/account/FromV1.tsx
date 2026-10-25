"use client";
/**
 * «Porta i dati da v1» (Impostazioni → I tuoi dati): pick v1's export, see
 * what would come in (a dry run: per kind, the days, what v2 already has
 * and keeps), then «Aggiungi». Nothing in v2 is changed or removed.
 */
import { useState } from "react";
import { F } from "@lifeos/kit";
import type { MergeSummary } from "@/core/convert/merge";

const KIND_WORDS: Record<string, [string, string]> = {
  meal: ["pasto", "pasti"],
  session: ["allenamento", "allenamenti"],
  weigh_in: ["pesata", "pesate"],
  sleep: ["notte", "notti"],
  steps: ["giorno di passi", "giorni di passi"],
  water: ["acqua", "acque"],
  checkin: ["come stai", "come stai"],
  movement: ["movimento", "movimenti"],
};
const words = (counts: Record<string, number>) =>
  Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => {
      const w = KIND_WORDS[k];
      return w ? F.plural(n, w[0], w[1]) : n + " × " + k;
    })
    .join(", ");

export function FromV1() {
  const [text, setText] = useState<string | null>(null);
  const [state, setState] = useState<
    | { at: "idle" }
    | { at: "busy" }
    | { at: "seen"; summary: MergeSummary }
    | { at: "done"; summary: MergeSummary }
    | { at: "error"; error: string }
  >({ at: "idle" });
  const send = async (dry: boolean, body: string) => {
    setState({ at: "busy" });
    try {
      const r = await fetch("/impostazioni/da-v1" + (dry ? "?prova=1" : ""), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
      });
      const j = (await r.json()) as { summary?: MergeSummary; error?: string };
      if (!r.ok || !j.summary)
        return setState({ at: "error", error: j.error ?? "Non è andato." });
      setState({ at: dry ? "seen" : "done", summary: j.summary });
    } catch {
      setState({ at: "error", error: "Non è andato: niente è cambiato. Riprova." });
    }
  };
  const total = (s: MergeSummary) => Object.values(s.added).reduce((a, b) => a + b, 0);
  return (
    <div className="k-stack g2">
      <input
        type="file"
        accept="application/json,.json"
        aria-label="L'export di v1"
        className="k-text"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const t = await f.text();
          setText(t);
          await send(true, t);
        }}
      />
      {state.at === "busy" && <p className="k-help">Leggo il file…</p>}
      {state.at === "error" && (
        <p className="k-help" role="alert">
          {state.error}
        </p>
      )}
      {(state.at === "seen" || state.at === "done") && (
        <div className="k-stack g1" role="status">
          {total(state.summary) === 0 ? (
            <p className="k-body">
              Niente di nuovo: v2 ha già tutto quello che c’è nel file.
            </p>
          ) : (
            <p className="k-body">
              {state.at === "done" ? "Aggiunti: " : "Arriverebbero: "}
              {words(state.summary.added)}
              {state.summary.first &&
                ", " +
                  (state.summary.first === state.summary.last
                    ? "il " + F.date(state.summary.first)
                    : F.plural(state.summary.days, "giorno", "giorni") +
                      " dal " +
                      F.date(state.summary.first) +
                      " al " +
                      F.date(state.summary.last!))}
              .
            </p>
          )}
          {Object.keys(state.summary.kept).length > 0 && (
            <p className="k-help">
              Restano fuori, perché v2 ha già lo stesso tipo nello stesso giorno:{" "}
              {words(state.summary.kept)}.
            </p>
          )}
          {(state.summary.newItems > 0 || state.summary.byName > 0) && (
            <p className="k-help">
              {state.summary.newItems > 0 &&
                F.plural(state.summary.newItems, "voce nuova", "voci nuove") +
                  " in Libreria. "}
              {state.summary.byName > 0 &&
                F.plural(state.summary.byName, "voce", "voci") +
                  " già in v2 con lo stesso nome: si usano quelle."}
            </p>
          )}
          {state.at === "seen" && total(state.summary) > 0 && text && (
            <button
              type="button"
              className="k-btn primary"
              onClick={() => void send(false, text)}
            >
              Aggiungi
            </button>
          )}
          {state.at === "done" && (
            <a className="k-link" href="/oggi">
              Vai a Oggi ›
            </a>
          )}
        </div>
      )}
    </div>
  );
}
