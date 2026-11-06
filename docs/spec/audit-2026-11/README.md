# Audit 6 nov 2026 — fase 1 del piano di pulizia

Ledger: PROD-35…39. Piano: ROADMAP «Now». Istantanea: non si aggiorna; la verità nuova sarà la
spec della fase 2. Foto: `LIFEOS/review/audit-2026-11/` (77 pagine a 390 px + 7 tavole per verbo).

| File | Cosa |
|---|---|
| `needs.md` | **da leggere tu**: le tue richieste rilette per bisogno, 13 gruppi con verdetto, conflitti, sintomi, fuori misura |
| `ledger-A.md` | PROD, DATA, PLAN, PLAT, KEEP, CONTRA (136 righe) verificate nel codice |
| `ledger-B.md` | FOOD, TRAIN, BODY, HOME (130 righe) |
| `ledger-C.md` | UI (103 righe), ognuna marcata «pattern» o «schermata» |

## 1. Il ledger contro il codice (369 righe, verifiche a campione, ±3)

| Verdetto | Righe | Note |
|---|---|---|
| costruito | ~158 | motori, dati, export, sonno, palestra, cibo: la base è buona |
| parziale | ~102 | quasi tutti **pattern**: scritti, presenti in un posto, non nel kit |
| non costruito | ~13 | PLAN-01/33…35 (in archivio), KEEP-14, DATA-13, TRAIN-23, BODY-17/31, UI-103 |
| contraddetto dal codice | ~5 | «Duplica» (PLAN-14), «routine» ~149 volte (CONTRA-04/UI-45), testi non in i18n (DATA-16), UI-26, UI-66 |
| superato ma ancora D | ~15 | BODY-18/21/25 (fattore a mano → BODY-30), FOOD-19 (→ FOOD-34), PLAN-22, PLAT-01, UI-20/34/60/62 |
| futuro | ~58 | alcuni F sono già costruiti (FOOD-13, TRAIN-12/13/31, BODY-07/10/12/14/27, UI-88/94) |
| regole di processo | ~16 | 11 seguite, 1 no (PROD-31: togliere ciò che si sostituisce nello stesso PR) |
| aperte (?) | 3 + 6 | CONTRA-05/06/07; CONTRA-08 di fatto chiusa da ADR-0059 |

UI: 69 righe su 103 sono **pattern**, 34 sono **correzioni di una schermata** (quasi tutte
UI-70…102). Le stesse lamentele tornano: box che sbordano (UI-84/85/91/99/102), liste senza tetto
(UI-41 = UI-100), navigazione del periodo (UI-76/87/98), chip del voto (UI-03/75/102), acqua
(UI-04/85/91). Duplicati: ~25 coppie o gruppi (elenco nelle tabelle).

## 2. Pagine × azioni comuni (codice + foto)

| Azione | Implementazioni diverse | Dove si vede |
|---|---|---|
| Crea un oggetto | 9 form propri (cibo, pasto, esercizio, tragitto, abitudine, assunzione, obiettivo, spesa, tracker) | «Salva» in fondo fisso, dentro il box (abitudine), o assente (cibo); date come testo «AAAA-MM-GG», selettore o ora |
| Pagina dell'oggetto | 8 pagine fatte a mano | cibo: «Modifica» in alto; pasto: 5 bottoni; esercizio: nessuna azione; ciclo e giornata: già modulo |
| Modifica | in pagina (ciclo, giornata), pagina `/modifica` (cibo, pasto, vietata da P2), foglio (voce) | |
| Archivia / elimina / cestino | 11 azioni, 7 percorsi, ~8 stili di bottone; ripristino solo per 3 tipi; 1 conferma in tutta l'app | |
| Annulla (toast) | 4 copie | solo righe del giorno e palestra |
| Cerca | 5 campi, 4 logiche, 3 `fold` | ordinamento cibi = tendina, esercizi = segmenti |
| Parti da / variante | 6 meccanismi | nessuno per esercizi, schede, cicli, abitudini |
| Unisci / doppioni | 2 pagine copiate + 1 pagina doppioni per area, 3 rilevatori | |
| Elenco | 1 componente `List` (il pezzo più coerente) | Mente · Elenco e Soldi · Elenco sono pagine vuote |
| Registra (⊕) | 1 generico (`EntrySheet`, 13 tipi) + 7 percorsi propri | un pasto ha 4 porte nel ⊕ |
| Grafico | `Chart` del kit usato 1 volta, 5 grafici a mano | |
| Guscio di pagina | NavBar copiata in 17 pagine, 4 nomi per «indietro», 6 layout copiati | |

## 3. Cosa va bene e resta (da qui si riparte)
- **Motori** `core/engines/*` (tempo, metriche, giudizi, fasce, sonno a pezzi, allenamento,
  correlazioni, qualità dei dati) con 144 test; direzione degli import pulita.
- **Registro dei tipi** `core/kinds` + `EntrySheet`: il seme del modello unico.
- **Famiglie di catalogo** `core/catalog/family.ts`, `merge.ts` (ADR-0060): un motore, da esporre
  con un solo livello di verbi.
- **Kit**: `Box`, `List`, `Field`, `DateNav`, `Nutrients`, `F` (formattazione unica), `Glyph`.
- **Principi** P1–P9 (interaction.md) e la mappa D (ADR-0059): 5 aree × 4 schede.
- **Dati**: export/import, riparazioni, backup; i tuoi dati in v2 dal 17 ott.

## 4. Il punto
Le richieste del nucleo (cibo, palestra, corpo, sonno, acqua) erano quasi tutte giuste; molte
nascevano da pattern mancanti. Sei pattern orizzontali coprono quasi tutto: **Tipo** (registro),
**Verbi comuni**, **Voce** (intestazione e stati), **Metrica con «Perché?»**, **Fascia con
copertura**, **Ricorrenza** (+ relazioni nel tempo). La fase 2 decide questi, non le schermate.

## 5. Cosa serve da te (STOP della fase 1)
Per ognuno dei 13 gruppi di `needs.md`: d'accordo col verdetto, oppure no e perché. Poi i 13
conflitti (§2) e la lista «fuori misura» (§4). La pagina di revisione raccoglie le risposte.
