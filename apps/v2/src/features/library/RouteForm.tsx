"use client";
/** «Nuovo tragitto» (movement slice 1): name, how, km, usual minutes, metres on foot, a Maps link. */
import { useActionState } from "react";
import { Field, PageHeader } from "@lifeos/kit";

export type RouteState = {
  errors: Record<string, string>;
  values: Record<string, string>;
  n: number;
};

export function RouteForm({
  backHref,
  action,
}: {
  backHref: string;
  action: (s: RouteState, d: FormData) => Promise<RouteState>;
}) {
  const [state, submit, pending] = useActionState(action, {
    errors: {},
    values: { mode: "walk" },
    n: 0,
  });
  const v = state.values;
  const e = state.errors;
  return (
    <form key={state.n} action={submit} className="k-page">
      <PageHeader
        title="Nuovo tragitto"
        context="un percorso che fai spesso"
        back={{ label: "Indietro", href: backHref }}
        of={{ fam: "train", kind: "trip" }}
      />
      <section className="k-section g3" aria-label="Il tragitto">
        <Field
          name="name"
          label="Nome"
          type="text"
          required
          placeholder="per esempio: Casa → palestra"
          defaultValue={v["name"] ?? ""}
          error={e["name"]}
        />
        <Field
          name="mode"
          label="Come"
          type="choice"
          required
          defaultValue={v["mode"] ?? "walk"}
          options={[
            { value: "walk", label: "A piedi" },
            { value: "run", label: "Di corsa" },
            { value: "bike", label: "In bici" },
            { value: "bus", label: "Bus" },
            { value: "train", label: "Treno" },
            { value: "car", label: "Auto" },
            { value: "mixed", label: "Misto" },
          ]}
          error={e["mode"]}
        />
        <div className="k-grid">
          <Field
            name="distanceKm"
            label="Distanza"
            type="stepper"
            unit="km"
            step={0.1}
            defaultValue={v["distanceKm"] ?? ""}
            error={e["distanceKm"]}
          />
          <Field
            name="durationMin"
            label="Di solito"
            type="stepper"
            unit="min"
            step={1}
            defaultValue={v["durationMin"] ?? ""}
            error={e["durationMin"]}
          />
        </div>
        <Field
          name="walkingM"
          label="Di cui a piedi"
          type="stepper"
          unit="m"
          step={100}
          defaultValue={v["walkingM"] ?? ""}
          help="Vuoto a piedi o di corsa: tutto il tragitto. Con i mezzi: i metri fino alla fermata e dalla fermata."
          error={e["walkingM"]}
        />
        <Field
          name="mapsUrl"
          label="Link di Google Maps"
          type="text"
          placeholder="facoltativo"
          defaultValue={v["mapsUrl"] ?? ""}
          help="Dal tasto Condividi delle indicazioni in Maps."
          error={e["mapsUrl"]}
        />
      </section>
      <div className="k-pagefoot">
        <a className="k-btn secondary" href={backHref}>
          Annulla
        </a>
        <button type="submit" className="k-btn primary" aria-busy={pending}>
          Salva
        </button>
      </div>
    </form>
  );
}
