# Le tue richieste, rilette: i bisogni dietro, cosa tenere, cosa ripensare, cosa lasciare

Revisione critica del 6 nov 2026. Fonte della domanda, le tue parole (PROD-37):
«va capito se quello che ho richiesto è giusto o meno o comunque vada ripensato e rivisto. Dato che
molte idee nascevano solo dal fatto che molte cose sono semplicemente scomode e o confusionarie e o
troppo semplici. E che si adattano poco alla estendibilità».

Fonti lette: `considerations.txt`, `considerations2`, `docs/spec/v2/ledger.md` (tutte le righe con
le tue citazioni), dossier §2 e §9 (objects, plan, capture, training, session, movement, sleep,
pantry, costs), `design-register.md` §V e §N, `interaction.md` P1–P9, il piano del 6 nov
(`a-che-punto-siamo-deep-star.md`, diagnosi). Controlli nel codice: `apps/v2/src`, `packages/kit/src`.
Controllo sui dati: l'export v2 del 4 nov (`LIFEOS/exports/v2/lifeos-2026-11-04.json`), contato
con uno script fuori dal repo. Nessun file del repo è stato modificato.

## 0. Cosa dicono i tuoi dati (dal passaggio a v2, 17 ott → 4 nov)

Questa tabella pesa su tutti i verdetti. Mostra cosa usi davvero.

| Cosa | Uso reale |
|---|---|
| Giorni con qualcosa registrato | 16 su 19 (vuoti 31 ott, 1 e 2 nov) |
| Pasti, caffè/creatina, peso, sonno, passi, palestra | quasi ogni giorno: è il tuo **nucleo** |
| Check-in («come stai») | 8 giorni su 16 |
| RIR sulle serie | 35 serie su 281 (12 %); prima di v2: 0 su 509 |
| Ruolo del pasto scelto da te | 3 volte su 55; 52 volte dedotto dall'ora |
| Cibi con due o più marche | **0** su 113 (62 prodotti, uno per cibo) |
| Varianti di catalogo create | 8 |
| Abitudini | 0 · tracker tuoi: 0 · voci previste per i giorni futuri: 0 |
| Giornata tipo «Rec» | 3 blocchi (prima del 3 nov: 0) |
| Soldi | 2 movimenti, 0 scontrini · dispensa: 0 acquisti (anche in v1) |
| Tragitti | 5 percorsi, 6 viaggi (5 nello stesso giorno, 4 nov: una prova) |
| Obiettivi su studio, libri, risparmio | esistono (16 ott); **nessun dato** che li alimenti |

Lettura in una frase: usi bene un nucleo stretto (cibo, palestra, corpo, sonno). Quasi tutte le
richieste nate da attrito su quel nucleo sono giuste. Quasi tutte quelle su domini nuovi
(piano a strati, soldi, dispensa, tragitti, correlazioni) chiedono strutture per dati che non hai.

---

## 1. I bisogni (13 gruppi)

### 1. Registrare in un attimo ciò che faccio davvero
- **Bisogno:** mettere un pasto, un caffè, una stima in pochi secondi, con numeri giusti, senza
  pensare a dove si trova il bottone.
- **Attrito:** scomodo.
- **Le tue parole:**
  - «caffè e creatina sono ancora segnati come pasti, non posso creare assunzioni?» (FOOD-44)
  - «quando aggiungo le stime non riesco a mettere tutti i valori» (FOOD-41)
  - «stime, dovremmo poter essere in grado di registrarle in libreria col senno di poi» (FOOD-32)
  - «non riesco a fare focus alla barra del codice a barre» (FOOD-43)
  - «la scansione dei bar code non funziona perché la fotocamera non riesce a mettere a fovcus.
    inoltre dovrei poterla caricare dai file» (FOOD-39)
  - «comunque il bar code deve precompilare tutto il possibile che trova» (FOOD-48)
- **Costruito:** ⊕ ordinato per abitudine (`app/(app)/aggiungi/page.tsx`, `features/add/rank.ts`,
  `features/add/search.ts`); assunzioni come tipo a sé (`core/food/intake.ts`,
  `features/day/QuickIntakes.tsx`, ADR-0060); stima con tutti i campi dell'etichetta
  (`features/food/EstimateFields.tsx`); barcode con focus, foto, «non trovato» separato da «OFF non
  risponde» (`features/library/BarcodeBox.tsx`, `core/food/off.ts`).
- **Risolto?** In gran parte sì. Restano: un pasto si apre da 4 porte diverse nel ⊕ (capture.md §2);
  la stima è un tipo di voce diverso dal pasto salvato; scontrini non fatti.
- **Verdetto: TENERE.** È il cuore dell'app: lo usi ogni giorno. Ma è già quasi risolto; il resto è
  togliere porte, non aggiungere funzioni. Scontrini: vedi §4.
- **Meccanismo unico:** *Cattura = trova + quanto + quando.* Una sola ricerca su tutti i tipi e gli
  oggetti, ordinata per «di solito a quest'ora»; un tocco registra con gli ultimi valori; un toast
  «Annulla». Una cosa sconosciuta diventa subito un oggetto «stima» con confidenza bassa: alla volta
  dopo esce nella ricerca. Così «salvare col senno di poi» non serve più come funzione: succede da sé.
- **Come lo fanno altri:** il «Quick Add» di MyFitnessPal e MacroFactor (calorie e macro a mano);
  qui la differenza giusta è che la stima diventa un oggetto riusabile.

### 2. Correggere in fretta ciò che ho registrato
- **Bisogno:** sistemare quantità, ora, stato di una voce senza aprire pagine e senza perdere il
  colpo d'occhio sulla giornata.
- **Attrito:** scomodo + confuso.
- **Le tue parole:**
  - «il moltiplicatore e il simbolo delete dovrebbero stare piu in alto e non prendere spazio alla
    barra dei macro principale» (FOOD-38)
  - «elimina i puntini… e sostituisci con un semplice simbolo di reset» (FOOD-38)
  - «le tendine dei pasti e cibi nella giornata, da aperte, dovrebbero essere piu modulari e non
    aprirsi completamente… piu compatte ma con la stessa quantitià di info» (FOOD-38)
  - «va migliorata l'usabilità della modifica degli ingredienti e delle porzioni e degli orari e
    dei momenti» (FOOD-37)
  - «dove sono finiti i moltiplicatori??» (FOOD-47)
  - «me la mette sempre alle 17.30, che senso ha, dovrei poter essere in grado di spostarla» (TRAIN-34)
- **Costruito:** «× porzioni» in cima (`features/day/servings.ts`, `OpenBox.tsx`); ora di default
  dall'ultima usata (E3, `core/engines/planning`); voce aperta a livelli (`EntrySheet.tsx`).
  **Non costruito:** il reset «aggiorna ai valori attuali» (in v2 non esiste fuori da
  `features/plan/ModelEditor.tsx`). Esistono ancora pagine `…/cibo/[id]/modifica` e
  `…/pasto/[id]/modifica`, che P2 vieta. I dati: 12 voci su 70 cancellate e rifatte; un pasto
  previsto e poi «Fatto» restava all'ora prevista, e tu lo rifacevi da capo (capture.md §2).
- **Verdetto: TENERE, ma generalizzare.** Le tue richieste sono giuste nel merito. Il limite è che
  sono pensate solo per il pasto. Lo stesso problema c'è per la sessione (ora sbagliata), il sonno
  (giorno sbagliato), l'assunzione. «Compatto ma con la stessa informazione» non si ottiene
  stringendo: si ottiene con livelli (chiuso = una riga; aperto = dettaglio).
- **Meccanismo unico:** *l'intestazione della voce*, uguale per ogni tipo: quanto (×), quando (ora,
  previsto/fatto/saltato), origine (↺ solo quando l'oggetto di catalogo è cambiato dopo la voce),
  elimina con Annulla. Sotto, il corpo modificabile sul posto. «Fatto» porta l'ora a adesso.
- **Come lo fanno altri:** in Hevy e Strong una serie si corregge toccandola, dentro la sessione,
  senza pagina di modifica.

### 3. Un catalogo senza doppioni, con basi e varianti
- **Bisogno:** che ogni cosa (cibo, pasto, esercizio, percorso) esista una volta sola, e che le
  versioni simili nascano da una base invece che da copie.
- **Attrito:** non estendibile + confuso.
- **Le tue parole:**
  - «si dovrebbe poter partire da una base di deafault di un altro ingrediento o pasto. cosi
    togliamo duplicate» (FOOD-33)
  - «un pasto porridge, con una base, e poi delle varianti» (FOOD-46)
  - «ci sono anche vari alimenti doppioni» (FOOD-46)
  - «una media pesata… tra i vari marchi» (FOOD-45)
  - «formati diversi con stesso marchio? quindi con prezzo al kg e confezione diversi?… insomma va
    pensata bene» (FOOD-48)
  - «molte cose semanticamente ridondanti, tipo i tragitti di corsa o l'allenamento corsa» (TRAIN-37)
  - «la modifica dei pasti e cibi fa schifo… non riesco a creare pasti» (FOOD-42)
- **Costruito:** ADR-0060, un modello di famiglia per ogni oggetto (`core/catalog/family.ts`),
  «Unisci» (`core/catalog/merge.ts`), «Parti da» (`core/food/copy.ts`), marche e formati
  (`core/food/brands.ts`, `choices.ts`), archivio (`core/catalog/archive.ts`).
- **Risolto?** Il modello sì. L'esperienza no: la diagnosi del 6 nov conta 6 meccanismi diversi per
  «Parti da», 11 azioni di archivia/elimina, ripristino solo per 3 tipi. E `parentId` vuol dire due
  cose (livello cibo›prodotto›formato, oppure variante) a seconda del catalogo del genitore: funziona,
  ma è un segno di complessità.
- **Verdetto:**
  - «Parti da», varianti, «Unisci»: **TENERE.** Il bisogno è reale: 7 «GELATO proteico» con la
    stessa base, 17 coppie quasi uguali.
  - Media pesata tra marche: **LASCIARE (rimandare).** Non hai nessun cibo con due marche. È una
    soluzione senza un caso. Basta: il cibo usa la marca che compri; la media appare solo quando un
    cibo ha davvero due prodotti usati.
  - Formati: **RIPENSARE** in un solo campo utile, il prezzo al kg. Il resto (formati nei pasti)
    aspetta un caso vero.
- **Meccanismo unico:** *un registro dei tipi di oggetto* con gli stessi verbi per tutti: crea,
  parti da, variante di, unisci, archivia, ripristina, elimina se non usato. Un tipo nuovo è una
  riga nel registro, non una pagina (è la fase 3 del piano).
- **Come lo fanno altri:** Cronometer tiene separati cibi propri e ricette; non conosco un'app
  diffusa che faccia la media tra marche, e c'è un motivo: serve di rado.

### 4. Pasti nel tempo, non in cassetti
- **Bisogno:** vedere e giudicare la giornata per ore (cosa ho mangiato prima e dopo la palestra,
  quanto la sera), non per categorie fisse che sbagliano.
- **Attrito:** sbagliato (il modello era rigido) + troppo semplice.
- **Le tue parole:**
  - «mi capita spesso che mi dica colazione saltata» (FOOD-34)
  - «togliere le 2 categorie come vere e proprie categorie e metterle come semplici tag per le 4
    principali, magari messe in automatico» (FOOD-34)
  - «gli snak dovrebbero essere visualizzati prima o dopo di altri pasti, anche separati, a seconda
    del loro orario» (FOOD-35)
  - «funzionalità degli importi caloorici e dei macro in determinate fasce orarie» (FOOD-36)
  - «continua a dare priorità alle categorie piuttosto che alle timeline» (29 ott, capture.md §2)
- **Costruito:** ruolo dedotto dall'ora e salvato (52 su 55 pasti); pre/post allenamento come
  relazioni calcolate (`core/engines/time/relations.ts`, usate in `core/day/timeline.ts`, mostrate
  come pillole in `features/day/present.ts`); assunzioni fuori dai pasti.
- **Risolto?** Quasi. Le etichette ci sono, ma non sono giudicate (FOOD-09/FOOD-34: «valutandone
  l'efficacia») e le fasce orarie (FOOD-36) non hanno ancora un uso.
- **Verdetto: TENERE.** Qui avevi ragione tu, e i dati lo confermano: non scegli quasi mai il ruolo.
  Il tempo è la verità; il ruolo è un'etichetta. **RIPENSARE** solo un punto: «colazione saltata»
  non deve mai comparire per un pasto che manca nel cassetto; un avviso vale solo se manca energia
  in una fascia rispetto al tuo solito.
- **Meccanismo unico:** *il tempo è il contenitore; ruoli e relazioni sono etichette derivate*
  (PROD-14). Una relazione si dichiara una volta (pre-allenamento 0–3 h, post 0–2 h, prima di
  dormire, caffeina 6 h prima di letto) e vale per ogni tipo. Le fasce orarie sono solo una finestra
  di una metrica (FOOD-36 diventa: «energia per fascia», niente di più).
- **Come lo fanno altri:** Cronometer permette di rinominare i gruppi del diario (non sono cassetti fissi); nessuna app seria fa giudizi pre/post allenamento automatici: qui saresti avanti, ma
  solo se resti su poche regole con fonte (ISSN 2017).

### 5. Capire da dove viene ogni numero
- **Bisogno:** fidarsi dei numeri (calorie spese, obiettivo, voto, creatina) perché si vede come
  nascono, in parole.
- **Attrito:** confuso.
- **Le tue parole:**
  - «rendere piu graduali e comprensibili le formule usate e non sovrastimare nulla e nemmeno
    sottostimare» (BODY-26)
  - «non capisco l'energia spesa... i range mostrati sono mostruosamente grossi? possibile?» (BODY-30)
  - «siamo sicuri che la creatina funzioni cosi?… i caffe mostrano sempre 23.30 ottimo: è normale?»
    (FOOD-40)
  - «non capisco durante la sessione cosa significhino quei valori indicativi di stima di forza»
    (TRAIN-36)
  - «hm mi sto confondendo, va capito, mi fido di te» (HOME-14)
  - «l'app è completamente inusabile, era molto più comprensibile v1» (design-register §V)
- **Costruito:** «come nasce questo numero» (PLAN-03); un numero tarato «≈ 2.740 kcal ± 200»
  (`features/day/burn.ts`); creatina come scorte e caffeina all'ora del tuo letto
  (`core/food/compounds.ts`, `creatine.ts`); ogni valore della palestra spiega se stesso al tocco.
- **Risolto?** Ogni caso singolo sì. Ma ogni volta dopo una tua lamentela, e ognuno con un testo
  scritto a mano. Il registro §V lo dice chiaro: v1 si capiva perché ogni numero aveva le sue parole.
- **Verdetto: TENERE il bisogno, RIPENSARE la risposta.** Meno numeri, non più spiegazioni. Un
  intervallo (± σ) è onesto ma non va mostrato per primo: prima un numero, la larghezza solo
  aprendo. Ogni numero che non serve a una decisione va tolto (UI-73).
- **Meccanismo unico:** *ogni numero derivato è una Metrica dichiarata* (fonte, formula, ingressi,
  confidenza, versione) e il kit ha un solo «Perché?» che la legge e scrive la frase. Nessuna
  pagina scrive a mano la spiegazione.
- **Come lo fanno altri:** MacroFactor mostra la spesa energetica come un solo numero con il suo
  grafico e spiega l'algoritmo in una pagina a parte; non mostra intervalli sul giorno.

### 6. Sapere se sto migliorando in palestra
- **Bisogno:** una risposta affidabile a «sono più forte di un mese fa?» e «oggi è andata normale o
  male, e perché?».
- **Attrito:** troppo semplice (in v1), poi confuso (in v2).
- **Le tue parole:**
  - «le percentuali di miglioramento o peggioramento, sembrano anche quelle fatte un po a caso»
    (TRAIN-33)
  - «ogni esercizio dovrebbe avere dati coerenti con gli altri… se per primo, o piu in la quando
    sono gia stanco» (TRAIN-33)
  - «la misurazione dei progressi cosi come l'utilizzo dei dati delle sessioni sembri molto fatto
    male, a caso, poco preciso. inoltre mostrato anche male» (TRAIN-33, considerations2)
  - «i consigli sulle serie da fare sono un po fatti a caso» (TRAIN-32)
  - «non capisco durante la sessione cosa significhino quei valori indicativi di stima di forza»
    (TRAIN-36)
- **Costruito:** E6 (`core/engines/training`, `core/training/advice.ts`, `context.ts`): trend di
  e1RM su 6 settimane, ripetizioni attese, effetto dell'ordine, «stabile / in crescita / in calo»,
  errore tipico; in sessione valori spiegati al tocco (`features/training/present.ts`).
- **Risolto?** La critica alla percentuale di una sola sessione era giusta: nei tuoi dati l'e1RM
  oscilla con deviazione standard 14,5 % da una sessione all'altra: quasi tutto rumore. Ma la risposta costruita è
  diventata un modello che tu non leggi (TRAIN-36). E poggia sul RIR, che metti sul 12 % delle serie.
- **Verdetto: TENERE il bisogno, RIPENSARE la risposta.** Lascia la precisione da laboratorio (RIR
  per serie, ordine come regressore, contesto che corregge il numero). Tieni confronti che si
  capiscono senza spiegazione.
- **Meccanismo unico:** *confronto a parità di contesto.* Una serie si confronta solo con serie
  passate dello stesso esercizio, stessa posizione nella sessione (primo / non primo), carico
  simile: «stesso carico, +2 ripetizioni», «record a 40 kg». Sopra, un solo trend per esercizio su
  settimane. Il contesto (sonno, ordine, pausa) si mostra accanto, non entra nel numero.
- **Come lo fanno altri:** Hevy e Strong mostrano, per ogni serie, la serie della volta prima nella
  stessa posizione («Previous»), i record (PR) e il grafico dell'e1RM. È semplice e funziona.

### 7. Allenarsi senza toccare il telefono
- **Bisogno:** che il telefono segua la sessione (pause giuste, partenza, lato, riscaldamento) senza
  doverlo toccare a ogni serie.
- **Attrito:** scomodo.
- **Le tue parole:**
  - «una modalità e un suo bottone toggle, per automatizzare il succedersi di pause e azioni, di
    modo che non debba toccare io il cell» (TRAIN-32)
  - «personalizzare a seconda dell'es dei secondi di scarto tra l'attivazione e l'effettivo
    inizio» (TRAIN-32)
  - «per gli es one side at a time, non credi che le pause intraset siano esagerate?» (TRAIN-32)
  - «insomma mi sembra tutto fatto a caso» (TRAIN-32)
  - «la palestra continua ad avere problemi con il design, l'ordine» (TRAIN-36)
- **Costruito:** modalità automatica, ritardo di partenza per esercizio, pause imparate dalla tua
  mediana (78 s), riscaldamenti generati, stati della sessione ricostruiti dagli istanti salvati
  (`features/training/Gym.tsx`, `GymClock.tsx`, `ExerciseSettings.tsx`; test
  `core/training/gym-auto.test.ts`).
- **Risolto?** Sul tempo sì. Le pause «esagerate» erano davvero esagerate per come ti alleni: i
  dati ti hanno dato ragione. Resta il rischio della modalità automatica: registra ripetizioni
  «presunte», cioè dati non osservati.
- **Verdetto: TENERE.** È un bisogno vero, ed è anche un modo per avere dati migliori (41 serie su
  400 senza ora d'inizio: quando costa un tocco, non lo fai). **RIPENSARE** un dettaglio: le
  ripetizioni presunte restano a confidenza bassa finché non le confermi, e non entrano nel trend
  di progresso senza conferma.
- **Meccanismo unico:** *un timer a stati riusabile* per ogni tipo con durata (serie, pausa,
  corsa, meditazione, studio): stati, istanti salvati, ripresa dopo chiusura, segnali sonori.
- **Come lo fanno altri:** Hevy e Strong avviano il timer della pausa da soli quando spunti la
  serie, con una pausa diversa per esercizio.

### 8. Usare il contesto: sonno, caffeina, creatina, stanchezza
- **Bisogno:** capire perché oggi va meglio o peggio, mettendo insieme dati che raccolgo già.
- **Attrito:** troppo semplice.
- **Le tue parole:**
  - «anche i dati di qualità dell'energia che si ha in quel momento dovrebbero essere forniti,
    aggregati di sonno, macro e stress… magari anche caffeina e creatine» (DATA-21)
  - «intrecciare tutto cio che puo essere rilevante» (DATA-21)
  - «molti altri dati che vengono raccolti non vengono usati come potrebbero, o se vengono raccolti,
    vengono raccolti male» (DATA-22)
  - «raffinamento delle informazioni come convergenza da piu fonti anche diverse di dati» (PROD-29)
- **Costruito:** «Legami» (correlazioni con n ≥ 21, `features/progress/links.ts`,
  `core/engines/correlations`); pillole di contesto in palestra (`core/training/context.ts`);
  prontezza, carico, deload scritti e testati, ma non collegati (session.md §2).
- **Risolto?** Tecnicamente sì, in pratica no: le correlazioni di una sola persona su 20–60 giorni
  sono quasi sempre rumore, e il check-in c'è in metà dei giorni.
- **Verdetto: RIPENSARE** in «mostrare accanto, non calcolare sopra». L'idea di «intrecciare tutto»
  è il punto dove il progetto si è allargato di più. Per un solo utente, con dati a buchi, il
  valore sta nel vedere il contesto vicino al fatto («prima: 5 h 30 di sonno, caffè 40 min fa»),
  non in punteggi di prontezza o correlazioni. Legami: tienili, ma con i 6 abbinamenti di default e
  nient'altro finché non hai 3 mesi di dati.
- **Meccanismo unico:** *finestre relative dichiarate* (le stesse del gruppo 4): «nelle 24 h prima
  di questa voce» si calcola per qualunque voce. Una sola riga di contesto, generica, sotto ogni voce
  aperta.
- **Come lo fanno altri:** Exist.io e Bearable fanno correlazioni personali, e le mostrano solo
  dopo settimane di dati quotidiani.

### 9. Ripetere le giornate che funzionano (il Piano)
- **Bisogno:** non riscrivere ogni giorno la stessa colazione, la stessa scheda, lo stesso caffè
  prima della palestra; avere la giornata già pronta e spostarla quando cambia.
- **Attrito:** non estendibile + confuso.
- **Le tue parole:**
  - «creare una sorta di sistema di programmazione delle routine per tutto quanto, non solo per la
    palestra. che sia anche piu intleligente ma comunque molto usabile» (PLAN-29)
  - «sistema delle giornate tipo… incrementali… intercambiare nel mentre che si fa» (PLAN-29)
  - «i tragitti, piani, modello, routine, abitudini, non si capisce nulla» (PLAN-33)
  - «dovrei poter pianificare in una giornata i pasti veri e propri, piuttosto che le percentuali»
    (PLAN-34)
  - «i piani e i modelli devono poter essere sovrapponibili e filtrabili… ci potrebbero essere cross
    dipendenze» (PLAN-35)
- **Costruito:** giornate tipo, cicli, settimana tipo, abitudini (`core/plans/*`,
  `features/plan/ModelEditor.tsx`, `CycleEditor.tsx`, `HabitForm.tsx`); ora di default intelligente
  (E3). Le regole tra strati (`plan_rules`) sono ferme in un branch d'archivio.
- **Risolto?** No. Cinque parole per idee sovrapposte (modello, giornata tipo, settimana tipo,
  ciclo, routine). Dati: un solo ciclo vivo (la scheda di palestra, che usi), «Rec» con 3 blocchi,
  0 abitudini, nessuna voce prevista per i giorni futuri, 34 pasti rimasti «previsti» nel passato.
- **Verdetto: RIPENSARE molto.**
  - Tieni: i pasti veri nei blocchi (PLAN-34, giustissimo: pianificavi percentuali in cui non pensi);
    il ciclo della palestra; «Copia ieri».
  - Lascia (per ora): strati sovrapponibili e regole incrociate (PLAN-35). È un motore di regole per
    un piano che ancora non usi. Prima deve servirti il piano semplice.
  - «Intelligente»: non con regole che scrivi tu, ma con proposte dalla tua storia («di solito il
    martedì alle 8: avena») che accetti con un tocco.
- **Meccanismo unico:** *la Ricorrenza*: un oggetto (o una rotazione di oggetti) + quando (ora,
  relativo a un'altra voce, passo di ciclo) + ogni quanto. Una giornata tipo è solo un insieme di
  ricorrenze con un nome. Un'abitudine è una ricorrenza con un solo blocco. Un ciclo è una
  ricorrenza che avanza. Una parola per l'utente: «Piano».
- **Come lo fanno altri:** Todoist e Things: un'attività con una ricorrenza, e nient'altro; la
  vista «Prossimi» mostra cosa arriva. Hevy e Strong: schede in cartelle, il programma è un ordine
  di schede.

### 10. Passi e spostamenti onesti
- **Bisogno:** che il movimento della giornata entri nella spesa energetica senza numeri inventati.
- **Attrito:** sbagliato (i passi erano stime tonde e contraddittorie).
- **Le tue parole:**
  - «e se invece aggiungessimo una specie di layer verticale all giornata che considera fasce
    orarie di movimento?» (BODY-27)
  - «registrare percorsi in libreria… compatibile con google maps» (BODY-27)
  - «qualcosa per sostiutire il sistema attuale molto impreciso» (BODY-27)
  - «i tragitti come si collegano ai passi giornalieri?… i passi dovrebbero essere considerati al
    netto» (BODY-31)
  - «tragitti di corsa o l'allenamento corsa» (TRAIN-37)
- **Costruito:** percorsi e viaggi (`core/movement/routes.ts`, `features/library/RouteForm.tsx`,
  #292); passi per giorno; ore in piedi come numero; spesa per cadenza.
- **Risolto?** La diagnosi era giusta: «seduto» con 16 500 passi, passi tondi a caso (movement.md
  §2). La cura costruita (percorsi, finestre coperte) chiede molto lavoro per poche calorie.
- **Verdetto: RIPENSARE in piccolo.** Il numero dei passi del telefono, scritto una volta al giorno,
  è la fonte più precisa che hai senza app nativa. I percorsi vanno bene per tragitti che ripeti
  (un tocco). Le finestre orarie coperte (BODY-31) e il livello verticale: **lasciare**. Motivo:
  la spesa energetica che impari dal peso (E4) assorbe già gli errori costanti; inseguire 100 kcal
  di passi con un modello a finestre non cambia l'obiettivo del giorno.
- **Meccanismo unico:** *una lettura con la sua fonte e confidenza* (contapassi, stima, percorso);
  vince la più affidabile, come per ogni altro valore.
- **Come lo fanno altri:** Apple Health e Health Connect tengono più fonti per i passi e ne scelgono
  una per priorità, non le sommano. MacroFactor calcola la spesa solo da cibo e peso, senza passi.

### 11. Giudicare il cibo con basi serie
- **Bisogno:** sapere se mangio bene (non solo quanto), con soglie che hanno una fonte.
- **Attrito:** troppo semplice (in v1).
- **Le tue parole:**
  - «quelli piu importanti devono avere range ottimali e di limiti veritieri e con fondamenti
    scientifici» (FOOD-30)
  - «rivedere… anche tutti i macronutrienti dipendentemente dalla loro origine e qualità, nel senso
    di assorbimento o veri e propri nutrienti, non ne ho idea» (FOOD-30)
  - «aggregati che dobbiamo mostrare in grafici nella pagina del giorno per qualità» (FOOD-30)
  - «tutto provato e conprovato su basi scientifiche o standard di settore» (PROD-29)
  - «a livello informativo meglio 1 e 3, una combinazione?» (UI-75)
- **Costruito:** voto del pasto v2 con parti e pesi (`core/food/score.ts`), fasce EFSA/WHO
  (`core/engines/targets`, ranges.md), micro con «n su m coperti» (`core/food/micros.ts`), tipi di
  macro nelle barre.
- **Risolto?** Le fasce sì, con fonti. Il limite è a monte: molti cibi e tutte le stime non hanno
  i micro. Un voto sui micro con dati scarsi è falsa precisione.
- **Verdetto: TENERE** le fasce e un voto. **RIPENSARE**: un micro si giudica solo quando la
  copertura del giorno è alta (es. ≥ 80 % delle kcal con quel valore), altrimenti si dice «non
  so». **LASCIARE** i macro giudicati per «assorbimento» oltre alla proteina (DIAAS): le prove a
  livello di singolo pasto sono deboli, e l'hai scritto tu stesso «non ne ho idea».
- **Meccanismo unico:** *la Fascia* (minimo / buono / massimo, con fonte) uguale per ogni cosa
  misurata (PLAN-26), più la *copertura*: nessun giudizio sotto una soglia di dati.
- **Come lo fanno altri:** Cronometer giudica i micro sui valori di riferimento (DRI) e funziona
  perché il suo database ha quasi tutti i micro; con dati da etichetta non ci prova.

### 12. Un'interfaccia dove ogni cosa ha una forma sola
- **Bisogno:** capire l'app al primo sguardo: lo stesso significato ha sempre lo stesso aspetto e
  lo stesso gesto, su ogni pagina.
- **Attrito:** confuso + non estendibile.
- **Le tue parole:**
  - «tutte le barre dei macro in ogni pagina dovrebbero far riferimento ad un unico tipo» (UI-68)
  - «la ui deve essere molto piu intelligente, semplice da usare ma contenente tutto» (UI-69)
  - «le pagine sono eccessive e ridondanti… l'astrazione delle feature non è attuata» (PROD-36)
  - «tutta l'app sembra fatta a caso, con allineamenti, padding, spaziature» (design-register §L)
  - «il tasto di aggiunta dell'acqua ha sempre sbordato e non te ne sei mai reso conto» (UI-84)
  - «non possiamo farne una verticale colorata… con gli orari in verticale molto molto snelli?»
    (UI-50, UI-77)
- **Costruito:** il kit (`packages/kit/src`: `Nutrients`, `Box`, `List`, `DateNav`, `Field`,
  `Chart`, `F`), principi P1–P9 scritti. Ma (diagnosi 6 nov): 17 form fatti a mano contro 1
  generico, 5 campi di ricerca con 4 logiche, 4 copie del toast «Annulla», NavBar copiata in 17
  pagine, `Chart` del kit usato 1 volta.
- **Verdetto: TENERE.** È la richiesta più importante di tutte, e la radice delle altre.
  **RIPENSARE** «contenente tutto»: non tutto in vista, tutto a un tocco, al massimo due livelli.
  Il binario verticale degli orari: l'hai deciso tu (UI-77); va bene, ma è estetica, viene dopo.
- **Meccanismo unico:** *registro dei tipi + livello dei verbi + kit* (fase 3 del piano): una
  pagina oggetto, una lista, una ricerca, un form, un toast. Le regole controllate da lint e foto,
  non scritte in prosa.
- **Come lo fanno altri:** Apple Health: ogni tipo di dato ha la stessa pagina (grafico G/S/M/6M/A,
  fonti, dettagli), e un tipo nuovo non porta una pagina nuova.

### 13. Ogni cosa tracciata trattata allo stesso modo (sonno, abitudini, tracker propri)
- **Bisogno:** aggiungere una cosa da seguire (sonno spezzato, studio, lettura) e avere subito
  registrazione, grafico, obiettivo, senza nuovo codice.
- **Attrito:** non estendibile.
- **Le tue parole:**
  - «vale anche per altri tracked non di cibo» (FOOD-46)
  - «non vedo grafici e cose per ogni tracker come vorrei» (UI-103)
  - «i tracker non riesco a vederli quando li clicco» (UI-101)
  - «quando dormo, poi mi sveglio e poi ridormo, accumulo ore di sonno, non so come funziona»
    (BODY-29)
  - «anche quando registri il sonno, non è molto chiaro il giorno eccetera. insomma un po un casino»
    (sleep.md §2)
  - «non dovrebbero comparire negli elenchi? anche poter essere eliminate? e le aggregazioni?»
    (PLAN-33)
- **Costruito:** il registro dei tipi (`core/kinds/registry.ts`, `builtins.ts`), `EntrySheet`
  generico (13 tipi su 20), pagina tracker (`features/progress/tracker.ts`), periodi di sonno
  ricostruiti dai pezzi (`core/engines/sleep/periods.ts`).
- **Risolto?** Il seme c'è ed è buono. Ma i tracker propri non li hai mai creati (0), e hai
  obiettivi su studio, libri e risparmio senza nessun dato.
- **Verdetto: TENERE il modello generico, FERMARE i domini nuovi.** Il modello giusto si dimostra
  sul nucleo che usi (cibo, palestra, peso, sonno, acqua). Gli obiettivi senza dati: o li
  registri, o li togli.
- **Meccanismo unico:** *il Tipo* (campi, istante o durata, metrica, fascia, grafico, verbi):
  registrazione, pagina, grafico e obiettivo vengono dal tipo. Il sonno è il caso di prova: «un
  periodo fatto di pezzi» vale anche per sessioni interrotte e digiuni.
- **Come lo fanno altri:** Apple Health (ogni dato è un campione di un tipo, con fonte); Exist.io
  per i tracker personalizzati.

---

## 2. Richieste in conflitto tra loro

| Coppia | Il conflitto | Proposta |
|---|---|---|
| UI-69 «semplice… ma contenente tutto» ↔ UI-73 / §V4 «niente che non serva a una decisione» | tutto in vista rende la pagina illeggibile (v2 «inusabile») | tutto a un tocco, mai tutto in vista; massimo due livelli (chiuso, aperto) |
| TRAIN-33 / DATA-21 (progresso con tutto il contesto) ↔ TRAIN-36 «non capisco… quei valori» | più contesto dentro il numero = numero che non si legge | il numero resta un confronto semplice; il contesto si mostra accanto (gruppi 6 e 8) |
| FOOD-34 (pre/post come etichette automatiche) ↔ FOOD-19 / ADR-0044 (momenti pre/post scelti, mai dall'ora) — CONTRA-07 | due modelli per la stessa cosa | vince FOOD-34 (già nel codice di v2): 4 ruoli dall'ora, pre/post solo relazioni; chiudere CONTRA-07 e superare FOOD-19 |
| PLAN-34 (pasti veri nei blocchi) ↔ PLAN-21 (giornata tipo = fasce con quote kcal/proteine) | il blocco contiene un oggetto o una percentuale? | il blocco contiene un oggetto; le quote si derivano dall'obiettivo e servono solo a giudicare |
| PLAN-35 (strati e regole incrociate) ↔ PLAN-29 «molto usabile» e P4 | un motore di regole non è usabile per chi non pianifica ancora | rimandare le regole; prima ricorrenze semplici e proposte dalla storia |
| BODY-27 / BODY-31 (passi precisi per finestre) ↔ BODY-18 / BODY-13 (spesa imparata dal peso) | se la spesa si tara sul peso, la precisione dei passi conta poco | passi del telefono una volta al giorno; la taratura fa il resto |
| BODY-18 / BODY-25 (il fattore si accetta a mano) ↔ BODY-13 (accettare sparisce) ↔ BODY-30 (numero già tarato) | tre righe per la stessa scelta | automatico e reversibile (come BODY-30); superare BODY-18/25 nel ledger |
| FOOD-45 (media pesata tra marche) ↔ FOOD-17 (solo il cibo conta) e i dati (0 cibi con 2 marche) | complessità senza un caso | il cibo usa la marca preferita; la media solo con ≥ 2 prodotti usati |
| TRAIN-12 / TRAIN-32 (automatico, ripetizioni presunte) ↔ DATA-14 / PROD-21 / TRAIN-17 (mai inventare dati) | l'automatico scrive fatti non osservati | presunte = confidenza bassa, fuori dal trend finché non confermate |
| PROD-24 (niente AI) ↔ HOME-05 / FOOD-39 (scontrini ed etichette che funzionano) | leggere scontrini italiani senza un modello è quasi impossibile | tenere barcode (deterministico, OFF); etichetta solo campo per campo; scontrini rimandati |
| UI-37 (salva da solo, niente «Salva») ↔ UI-67 («Salva» esplicito per le definizioni) ↔ CONTRA-05 | due modelli di salvataggio | salva da solo + «Annulla» ovunque; «Salva» solo mentre componi (pasto, serie) |
| PROD-25 (kit estratto solo quando serve) ↔ UI-26 (nessuna schermata disegna il suo box) | uno frena il kit, l'altro lo richiede prima | regola del tre: al terzo uso diventa kit; il registro parte da `EntrySheet`, che esiste già |
| UI-50 (orari in verticale nel binario) ↔ §V5 (orari letti in orizzontale) | deciso da te (UI-77) | resta chiuso; solo una nota: il binario deve guadagnare spazio, non toglierne (il tuo motivo originale) |

## 3. Richieste che sono sintomi di un pattern orizzontale mancante

Ognuna è nata su una schermata. Ognuna sparisce se esiste il pattern a destra.

- «Duplica» invece di «Parti da» (FOOD-33, PLAN-14; ancora in `ModelEditor.tsx`) → verbi comuni del catalogo.
- «dove sono finiti i moltiplicatori??» (FOOD-47), reset e elimina in alto (FOOD-38) → intestazione della voce, uguale per ogni tipo.
- «me la mette sempre alle 17.30» (TRAIN-34) e «Fatto» che tiene l'ora prevista (capture.md §2) → un verbo «previsto → fatto» e una regola di ora di default per ogni blocco.
- «caffè e creatina sono ancora segnati come pasti» (FOOD-44) → il tipo dichiara il suo modo di registrazione (un tocco, form, composer, timer).
- «i tracker non riesco a vederli quando li clicco» (UI-101) → la riga intera è il bersaglio (P3), nel componente lista.
- «liste non cappate da barre a scorrimento» (UI-100) → un solo `List` con finestra.
- «il tasto di aggiunta dell'acqua ha sempre sbordato» (UI-84), «il meteo ha ancora un pessimo padding» (UI-99) → primitive di layout e `Box` usati ovunque, con foto per pezzo.
- «non dovrebbero comparire negli elenchi? anche poter essere eliminate?» (PLAN-33) → matrice CRUD completa per ogni oggetto (P1).
- «non vedo grafici e cose per ogni tracker» (UI-103) → pagina generica del tipo con grafico.
- «non capisco l'energia spesa» (BODY-30), «23.30 ottimo: è normale?» (FOOD-40), «non capisco… stima di forza» (TRAIN-36) → la Metrica con il suo «Perché?».
- «da pc come si scorre tra le settimane, mesi» (UI-98) → un solo navigatore di periodo.
- «non vedo bene la miniatura delle valutazioni» (UI-102) → un solo chip del voto.
- «ci siamo dimenticati di mostrare i costi» (HOME-14) → il costo è un valore della riga come le kcal: si somma con lo stesso motore; non serve un dossier a parte.
- «registrarle in libreria col senno di poi» (FOOD-32) e «New from… da una voce» (FOOD-16) → «Salva come oggetto» da qualunque voce (un pasto diventa pasto salvato, una corsa diventa percorso, una sessione diventa scheda).
- barcode da fotocamera e da file (FOOD-39, FOOD-43, HOME-03) → un solo scanner.
- «tragitti di corsa o l'allenamento corsa» (TRAIN-37) → una parola e un significato per cosa, nel glossario.
- «colazione saltata» (FOOD-34) → gli avvisi nascono dalle metriche, non dai cassetti.

In tutto, 6 pattern coprono quasi tutto: **Tipo (registro)**, **Verbi comuni**, **Voce** (con
intestazione e stati), **Metrica con «Perché?»**, **Fascia con copertura**, **Ricorrenza**. Più le
**relazioni nel tempo** (finestre relative).

## 4. Fuori misura per un'app con un solo utente (lasciare o rimandare)

Criterio: costo alto, e nessun dato tuo che lo chieda oggi.

- **Lettura degli scontrini** (HOME-05, parte di FOOD-39). Senza AI (PROD-24) gli scontrini italiani
  (abbreviazioni, catene diverse) non si leggono bene. **Lasciare.** Barcode sì.
- **Conti, saldi, import da banca e PayPal, report mensile** (HOME-08, HOME-13, DATA-11). 2
  movimenti in 19 giorni. **Rimandare** finché non registri spese per un mese di fila. Se un giorno
  servirà: il modello YNAB (import + abbinamento ai movimenti già scritti) è quello giusto.
- **Dispensa che pianifica** (scadenze, posti, minimi, FEFO: HOME-01, HOME-04). Già costruita in
  v1 e mai usata (0 acquisti). **Rimandare.** Tieni solo il prezzo per formato, che serve al costo
  dei pasti.
- **Strati del piano con regole incrociate** (PLAN-35). **Rimandare** dopo un mese di piano semplice usato.
- **Passi per finestre coperte, livello verticale del movimento, percorsi da Google Maps**
  (BODY-31, BODY-27). **Lasciare** le finestre; i percorsi solo come scorciatoia.
- **Media tra marche e formati nei pasti** (FOOD-45, parte di FOOD-48). **Rimandare**: 0 casi.
- **Macro giudicati per origine e assorbimento oltre al DIAAS** (FOOD-30, seconda parte). **Lasciare.**
- **Correlazioni scelte da te, punteggio di recupero, prontezza misurata** (DATA-07 F, BODY-08,
  BODY-10, TRAIN-18). Servono dati quotidiani completi per mesi: hai check-in in metà dei giorni.
  **Rimandare.**
- **Fame 1–5 due ore dopo il pasto** (FOOD-12). Un input in più ogni giorno. **Lasciare** finché
  il check-in non è costante.
- **Pesi del voto regolabili con cursori («Come valutiamo»)** (DATA-06, V-16). Per un solo utente
  che dice «mi fido di te», è una pagina in più da mantenere. **Rimandare.**
- **Meteo salvato come voci** (BODY-06 F). La scheda va bene; salvarlo serve solo alle correlazioni.
  **Lasciare.**
- **Multiutente, amici, pacchetti** (PLAT-04, PLAT-09). **Rimandare**; tenere solo l'isolamento
  per utente che c'è già (costa poco e protegge).
- **Ponte Obsidian, ponte domotica, ricompense** (PLAT-07, PLAT-08). **Lasciare.**
- **Temi oltre a quello scuro** (UI-66; tu usi solo lo scuro, UI-74). **Congelare.**
- **Obiettivi su studio, libri, risparmio** (dati del 16 ott) senza registrazioni. **Togliere** o
  iniziare a registrare: un obiettivo senza dati mostra sempre «non so».
- **«Rifare l'app da 0»** (considerations.txt). Già deciso: no v3 (PROD-37). Giusto: rifare da
  capo ripeterebbe la causa (lavoro per schermata, non per pattern).

## 5. Sintesi in 10 righe

1. Il tuo nucleo reale è stretto: cibo, caffè/creatina, palestra, peso, sonno, passi, acqua. Lì quasi ogni richiesta era giusta.
2. Le richieste nate da «scomodo» (moltiplicatore, reset, assunzioni, stime, barcode, pause) erano sintomi di pattern mancanti, non di funzioni mancanti.
3. Sul tempo (pre/post come etichette, spuntini per ora) avevi ragione: scegli il ruolo 3 volte su 55.
4. Sul progresso in palestra avevi ragione sulla diagnosi, ma la cura costruita è troppo fine: RIR sul 12 % delle serie, oscillazione del 14,5 % tra sessioni. Servono confronti semplici, come Hevy e Strong.
5. «Intrecciare tutto» va ripensato: il contesto si mostra accanto al fatto, non entra nei numeri; correlazioni solo con mesi di dati.
6. Il Piano va rifatto piccolo: una Ricorrenza (oggetto + quando + ogni quanto) e proposte dalla tua storia; le regole tra strati dopo.
7. Passi: il numero del telefono una volta al giorno basta, perché la spesa imparata dal peso corregge il resto.
8. Media tra marche, formati, dispensa che pianifica, soldi, scontrini: costruiti o chiesti per dati che non hai. Rimandarli.
9. Sei pattern orizzontali (Tipo, Verbi, Voce, Metrica col «Perché?», Fascia con copertura, Ricorrenza) assorbono quasi tutte le 13 aree.
10. Prossimo passo: decidere in fase 2 questi pattern (non le schermate), poi provarli sul nucleo prima di aprire domini nuovi.
