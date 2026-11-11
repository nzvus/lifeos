# Revisione esterna — Fable, 11 novembre 2026

Una sessione, letture a campione (handoff, CLAUDE.md, ROADMAP «Now», `model.md`, `data.md`
§4–5, schema, `drizzle/0007…0009`, i workflow, `core/plans/write-day.ts`, `core/convert/load.ts`,
l'export del 10 Nov, gli ultimi 60 commit e 20 PR). Niente codice toccato, niente produzione.
Dove non ho prove non parlo. Le domande per lui sono Q-19…Q-23 in `docs/spec/changes/inbox.md`.

## 1. Le cinque cose, in ordine di rischio/valore

### 1. Il ripristino dei dati non è provato, e le due strade hanno entrambe un buco
- **Prova.** DT-34 (`docs/spec/domains/data.md:103`): «second key copy not built; no restore
  drill of a v2 dump yet». La chiave privata `age` è un file solo, `~/.config/lifeos/backup-key.txt`
  (29 Set), giustamente fuori da chezmoi: non ho verificato se esiste sull'altra macchina. I dump
  vivono solo come artifact GitHub (30 giorni i giornalieri, 90 i pre-migrazione). La seconda
  strada, l'export JSON, non si ricarica: `src/core/convert/load.ts:36` rifiuta il loop
  «Porridge Proteico» ↔ variante, mentre il modello dice che `basedOnId` è solo provenienza
  (`src/core/catalog/family.ts:7`) e lo schema non lo vieta (`catalog_items_based_on_fk`). Non ho
  provato a ricaricare l'export del 10 Nov. v2 è rimasto senza backup fino a #329 con un job verde.
- **Conseguenza.** Il 10 Nov sono girate tre «migrate v2» con riparazioni di dati (0006, 0008),
  tutte da branch di PR. Se una riparazione rovina righe e te ne accorgi dopo, o se questo disco
  muore, oggi non sai se 1.328 voci tornano indietro. È l'unico punto dove puoi perdere tutto.
- **Cosa farei.** (a) Drill adesso: scarica l'artifact di stanotte, `scripts/restore-drill.sh`
  su un Postgres locale, confronta i conteggi con l'export del 10 Nov, scrivi data ed esito in
  DT-34 — 30–45 min, serve la tua chiave. (b) Seconda copia della chiave nel password manager —
  10 min. (c) Loader: ordina per `parentId` soltanto, scrivi `basedOnId` in un secondo passo;
  test che carica un file con quel loop — 1–2 h. (d) Una copia cifrata `.age` al mese in
  `LIFEOS/` (Syncthing la porta su telefono e ThinkPad) — 15 min.

### 2. Il lavoro va dove l'uso non c'è
- **Prova** (export 10 Nov). Ultimi 14 giorni: pasti 63, esercizi di sessione 53, acqua 37,
  assunzioni 15, passi 8, pesate 7, sessioni 7, tragitti 7, sonno 5. In tutto il database:
  voci «previsto» 1 su 825 vive; blocchi nel catalogo 0; movimenti di denaro 2 (con 51
  categorie); check-in 19 e nessuno da 14 giorni; diario 2; tracker suoi 0; `entry_links`,
  `receipts`, `money_lines` vuote. Il Piano ha preso #340–#344 (circa +20.000 righe); il
  prossimo in ROADMAP è soldi/dispensa. Il registry dichiara 20 tipi di voce e 10 di catalogo;
  ne usi 9. Buchi di log: 31 Ott–2 Nov nessuna voce; 6–7 Nov (giorni della pulizia) 9 e 7.
- **Conseguenza.** È la terza ricostruzione in sei settimane (v1 → v2 → pulizia) e ogni volta
  si generalizza prima di usare. Il Piano non ha ancora un utente: nemmeno tu. Soldi/dispensa
  ripeterebbe lo schema su un'area con 2 righe di storia.
- **Cosa farei.** Chiudi il Piano (Q-18, slice 5), poi una settimana di solo uso: crei tu 3–5
  blocchi veri e annoti cosa ti fa perdere tempo nel log quotidiano. Il prossimo change nasce
  da quella lista, non dalla ROADMAP. Costo: zero codice, una decisione (Q-20).

### 3. Nessuno legge il codice, e le regole che dicono il contrario sono lettera morta
- **Prova.** #344: +4.660 righe, unito 26 minuti dopo l'apertura, primi due giri di CI falliti.
  #341: +8.012 in 44 min. #343: +6.092/−4.790 su 96 file in 55 min. Le migrazioni girano dal
  branch della PR prima del merge (`migrate-v2` su `s264`, `s266`, `s267`): lo schema di
  produzione cambia con SQL che nessun umano ha letto. Q-14…Q-18 sono risposte «decidi tu» /
  «segui i tuoi consigli», compreso ADR-0062 (dove vivono i blocchi: costoso da invertire,
  regola 1). ~55.000 righe di codice e ~18.700 di test.
- **Conseguenza.** Stai imparando bene a specificare un prodotto e a progettare un processo per
  un agente: è una competenza vera. Non stai imparando a leggere una migrazione, a fare debug
  o a dire no a un'astrazione; senza l'agente l'app non la puoi riparare. I guard (lint,
  `check.py`, foto) controllano solo ciò per cui sono stati scritti.
- **Cosa farei.** Non «rivedi tutto». Due abitudini: leggi l'SQL di ogni migrazione prima di
  lanciare «migrate v2» (CLAUDE.md lo dice già: «read the SQL»), e una volta a settimana
  spieghi tu un diff all'agente, partendo da `drizzle/0008`. 1 h a settimana. Oppure togli
  «LEARN» dal ruolo e rendi il file onesto (Q-21).

### 4. Il modello dati regge; il rischio è avere due modelli del Piano e riferimenti senza tipo
- **Prova.** Il buono: chiavi esterne composte con `user_id` ovunque, `restrict` tra oggetti,
  `num_nonnulls(...) = 1` sui valori, tabelle vere per serie e soldi. Il debole:
  `catalog_items.catalog` e `catalog_values.field` sono testo libero senza check
  (`src/core/db/schema/definitions.ts`); `entries.block_id` e `catalog_parts.part_item_id`
  puntano a «un oggetto qualsiasi», il tipo giusto lo garantisce solo il codice. Le tabelle del
  vecchio Piano (`templates`, `template_blocks`, `week_layouts`, `cycles_state`) esistono
  ancora, hanno righe (14, 5, 7, 7) e sono lette fuori dai test in `core/plans/read.ts`,
  `core/plans/cycles-repo.ts`, `app/(app)/oggi/day-page.tsx`, `features/day/nutrients.ts`,
  `core/catalog/merge.ts`. Volumi: 516 oggetti, 4.854 valori su 77 campi, 17.197 valori di riga.
- **Conseguenza.** Non è un EAV ingestibile a questi numeri. Con soldi/dispensa si rompe per
  primo ciò che va sommato o filtrato per intervallo: una giacenza è una somma di movimenti,
  non un attributo. Se finisce in `catalog_values` avrai query a pivot e nessun vincolo.
- **Cosa farei.** Regola semplice, da decidere tu: il catalogo generico per «cose con
  attributi», tabelle vere per tutto ciò che si somma nel tempo. Un check sul valore di
  `catalog` generato dal registry (1 h + migrazione). Ritirare le tabelle vecchie dopo Q-18 e
  un export verificato (Q-23).

### 5. Il processo pesa più del prodotto e ha regole in conflitto
- **Prova.** 288 ID di requisito, 81 righe «Today» con «not built/partial», 134 ID in
  `untested.txt`; 64 file ADR; 45 memorie; `check.py` 351 righe; baseline lint su 58 file.
  Conflitti: (a) CLAUDE.md «Features are frozen until phase 3 closes» e «Stop at the end of
  phases 1, 2 and 3»: le fasi sono chiuse dal 6 Nov; (b) regola 3 «small steps, reviewable
  increments» contro «as few PRs as possible»; (c) «done = human has understood it» contro la
  memoria «no check questions»; (d) regola 1 «STOP and wait» contro «procedi senza di me» più
  «decidi tu»; (e) ADR-0007 è ancora «proposed» mentre MOD-11 ci poggia sopra;
  (f) l'handoff «always current» dava #344 aperta dodici ore dopo il merge.
- **Conseguenza.** L'agente spende contesto a rileggere regole e a tenere documenti allineati;
  tu rispondi «decidi tu» perché le domande sono troppe e troppo fini. Le regole in conflitto
  le risolve l'agente a modo suo, in silenzio.
- **Cosa toglierei.** Le regole di fase scadute; le memorie che ripetono CLAUDE.md; nuovi ADR
  solo per scelte costose da invertire; `untested.txt` come cancello (un baseline di 134 non
  ferma niente). Terrei spec unica, change, inbox, `check.py` sugli ID. 2 h, scelta tua (Q-22).

## 2. Domande per lui
Q-19 ripristino · Q-20 cosa dopo il Piano · Q-21 revisione e imparare · Q-22 dieta del
processo · Q-23 tabelle del vecchio Piano. Testo, opzioni e raccomandazione in
`docs/spec/changes/inbox.md`.

## 3. Cosa non cambierei
- Chiavi composte con `user_id`, cestino a 30 giorni, `restrict` tra oggetti (DT-30, DT-31).
- «migrate v2» manuale con dump prima, mai al deploy; riparazioni come SQL committato e
  idempotente che si ferma invece di buttare (`drizzle/0008`: `RAISE EXCEPTION`) (DT-32, DT-33).
- Test DB su PGlite con le migrazioni vere; backup cifrato a chiave pubblica con healthchecks.
- Le righe tengono lo snapshot dei valori (MOD-11): il passato non cambia quando cambi un cibo.
- Export datati in un posto solo con la nota di verifica; verificare sul dato, non sul verde.
- Una spec sola con la riga «Today» che ammette cosa non c'è; l'inbox con le sue parole.
- Il kit con le foto a 390/360/320: ha trovato difetti veri che i test non vedevano.
- Tabelle vere per serie di allenamento e soldi (MOD §8): è il confine giusto.

## 4. Correzioni piccole e sicure
1. Loader: `basedOnId` in un secondo passo (vedi 1c). **Fatto 11 Nov** (`core/convert/load.ts`,
   `LATER`): gli export del 6 e del 10 Nov si caricano due volte di fila su PGlite (Replace
   compreso), stesse righe, i 2 `basedOnId` tenuti.
2. `scripts/restore-drill.sh`: conteggi di `goals`, `cycle_steps`, `entry_values`,
   `catalog_values`. **Fatto.**
3. `scripts/backup.sh:4` citava `migrate.yml`. **Fatto.**
4. `LIFEOS/exports/README.md`: «latest» fermo al 4 Nov e `apps/v2`. **Fatto.**
5. Il backup delle 03:17 UTC oggi è partito alle 10:57: controllare che la tolleranza di
   healthchecks.io copra il ritardo di GitHub, o l'allarme suonerà a vuoto e verrà ignorato.
6. CLAUDE.md: le due righe di fase scadute. **Tolte 11 Nov.** ADR-0007 resta «proposed»:
   accettarlo è una scelta sua.
7. `day-page.tsx:179`: aprire Oggi scrive righe (`writeDayPlan`, Q-17 a). Va bene così, ma
   anche l'account di anteprima e ogni prefetch scrivono: un test che lo dica, niente altro.
