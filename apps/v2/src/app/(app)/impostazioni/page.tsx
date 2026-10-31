/**
 * Impostazioni (V-14; the board Settings): sections with their drawing and
 * a line of why — Account (who is signed in, «Esci»), Corpo e giornata
 * (sex, birth year, height, time zone, when the day starts; what today's
 * targets are and where they come from), Tracker e tipi (your kinds, the
 * foods), Aspetto, I tuoi dati (export, the trash with its count).
 */
import { Box, F, Glyph, PageHeader, type GlyphOf } from "@lifeos/kit";
import type { ReactNode } from "react";
import { getSession, requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { readSettingsCounts } from "@/core/account/counts";
import { readSettings } from "@/core/account/settings";
import { readDayTargets } from "@/core/day";
import { logicalDay } from "@/core/engines/time";
import { readDayModel } from "@/core/plans";
import { SettingsForm } from "@/features/account/SettingsForm";
import { SignOut } from "@/features/account/SignOut";
import { FromV1 } from "@/features/account/FromV1";
import { ThemePicker } from "@/features/account/ThemePicker";
import { savePlaceForm, saveSettingsForm } from "./actions";
import { readPlace } from "@/core/account/place";
import { readUserKinds } from "@/core/day";
import { enterable } from "@/core/entries";
import { kindRegistry } from "@/core/kinds";
import { kindRows } from "@/features/day/entry-form";

function Section({
  name,
  of,
  help,
  children,
}: {
  name: string;
  of: GlyphOf;
  help?: string;
  children: ReactNode;
}) {
  return (
    <section className="k-section g3" aria-label={name}>
      <h2>
        <span className="k-hicon">
          <Glyph of={of} size="m" />
        </span>
        {name}
      </h2>
      {help && <span className="k-meta">{help}</span>}
      {children}
    </section>
  );
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ luogo?: string | string[] }>;
}) {
  const { luogo } = await searchParams;
  const owner = await requireOwner();
  const session = await getSession();
  const db = await getDb();
  const s = await readSettings(db, owner);
  const today = logicalDay(new Date(), {
    timeZone: s.timeZone,
    boundaryMin: s.boundaryMin,
  });
  const [counts, targets, place] = await Promise.all([
    readSettingsCounts(db, owner, new Date()),
    readDayModel(db, owner, today).then((m) => readDayTargets(db, owner, today, m)),
    readPlace(db, owner),
  ]);
  // «Un foglio per tipo»: the specialised kinds, then those ⊕ enters (the person's own too).
  const userKinds = (await readUserKinds(db, owner)).filter((k) => !k.archivedAt);
  const csvKinds = [
    { key: "meal", title: "Pasti" },
    { key: "session", title: "Allenamenti" },
    { key: "movement", title: "Spese" },
    ...kindRows(kindRegistry(userKinds).all.filter(enterable), (k) => k).map((r) => ({
      key: r.key,
      title: r.entry.title,
    })),
  ];
  return (
    <main className="k-page has-bd">
      <PageHeader
        title="Impostazioni"
        context="tutto ciò che vale per ogni giorno"
        back={{ label: "Oggi", href: "/oggi" }}
        of={{ place: "impostazioni" }}
      />
      <Section name="Account" of={{ fam: "settings", kind: "account" }}>
        <div className="k-line between">
          <span className="k-body">{session?.user.email}</span>
          <SignOut />
        </div>
      </Section>
      <Section
        name="Corpo e giornata"
        of={{ fam: "body" }}
        help="Servono al motore degli obiettivi: le kcal e le proteine di ogni giorno nascono da qui."
      >
        <Box
          density="row"
          rail={false}
          entry={{
            fam: "body",
            sub: "weight",
            title: "Obiettivi di oggi",
            value: targets ? F.num(targets.kcal, "kcal") : "da calcolare",
            meta: targets
              ? (targets.protein ? F.num(targets.protein, "g") + " proteine · " : "") +
                "dall’obiettivo e dal modello del giorno, non a mano"
              : "servono pesate e sesso, anno e altezza qui sotto",
            href: "/andamento/obiettivi",
            hrefLabel: "Apri gli obiettivi",
          }}
        />
        <SettingsForm
          action={saveSettingsForm}
          initial={{
            sex: s.sex ?? "",
            birthYear: s.birthYear === null ? "" : String(s.birthYear),
            heightCm: s.heightCm === null ? "" : F.input(Number(s.heightCm), 1),
            timeZone: s.timeZone,
            boundary: F.time(s.boundaryMin),
          }}
        />
      </Section>
      <Section name="Tracker e tipi" of={{ fam: "catalog", kind: "types" }}>
        <Box
          density="row"
          rail={false}
          entry={{
            fam: "catalog",
            title: "Cibi",
            value: F.n(counts.foods, 0),
            meta: "ingredienti e prodotti",
            href: "/oggi/elenco?vista=cibi",
            hrefLabel: "Apri i cibi in Libreria",
          }}
        />
        <Box
          density="row"
          rail={false}
          entry={{
            fam: "settings",
            title: "I tuoi tipi",
            value: F.n(counts.kinds, 0),
            meta: counts.kinds
              ? "tracker tuoi, oltre a quelli di base"
              : "per ora solo quelli di base",
            href: "/impostazioni/tipi",
            hrefLabel: "I tuoi tracker, e uno nuovo",
          }}
        />
      </Section>
      <Section
        name="Il tempo"
        of={{ fam: "env", kind: "weather" }}
        help="La tua città: su Oggi la temperatura, l’umidità, l’aria e la luce del giorno (Open-Meteo)."
      >
        <form action={savePlaceForm} className="k-line g2">
          <input
            className="k-text"
            style={{ flex: 1, minWidth: 0 }}
            name="city"
            defaultValue={place?.name ?? ""}
            placeholder="per esempio: Bologna"
            aria-label="La tua città"
          />
          <button type="submit" className="k-btn secondary">
            Salva
          </button>
        </form>
        {luogo === "nontrovato" && (
          <p className="k-help" role="alert">
            Non trovo questa città: prova col nome in italiano o in inglese.
          </p>
        )}
        {luogo === "ok" && place && (
          <p className="k-help" role="status">
            Fatto: {place.name}.
          </p>
        )}
      </Section>
      <Section name="Aspetto" of={{ ui: "theme" }}>
        <ThemePicker />
      </Section>
      <Section
        name="I tuoi dati"
        of={{ fam: "settings", kind: "data" }}
        help="Sempre tuoi: scaricali quando vuoi."
      >
        <a className="k-plain" href="/impostazioni/esporta" download>
          <Box
            density="row"
            rail={false}
            entry={{
              fam: "settings",
              sub: "data",
              title: "Scarica tutto",
              value: "JSON",
              meta: "ogni tabella, anche il cestino",
            }}
          />
        </a>
        <form action="/impostazioni/csv" method="get" className="k-stack g1">
          <label className="k-label" htmlFor="f-csv">
            Un foglio per tipo
          </label>
          <span className="k-help">
            Le voci di un tipo come foglio di calcolo (CSV): una riga per voce, un pasto
            una riga per cibo con i suoi valori.
          </span>
          <div className="k-line g2">
            <select
              id="f-csv"
              name="tipo"
              className="k-select"
              style={{ flex: 1, minWidth: 0 }}
            >
              {csvKinds.map((k) => (
                <option key={k.key} value={k.key}>
                  {k.title}
                </option>
              ))}
            </select>
            <button type="submit" className="k-btn secondary">
              Scarica
            </button>
          </div>
        </form>
        <div className="k-stack g1">
          <span className="k-label">Porta i dati da v1</span>
          <span className="k-help">
            Scegli l’export di v1 (Impostazioni → Esporta): vedi cosa arriverebbe, poi
            «Aggiungi». Entra solo ciò che v2 non ha; niente in v2 cambia.
          </span>
          <FromV1 />
        </div>
        <Box
          density="row"
          rail={false}
          entry={{
            fam: "settings",
            sub: "trash",
            title: "Cestino",
            value: F.n(counts.trash, 0),
            meta: "si svuota da solo dopo 30 giorni",
            href: "/impostazioni/cestino",
            hrefLabel: "Apri il cestino",
          }}
        />
      </Section>
    </main>
  );
}
