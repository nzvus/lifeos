# Inbox — his words and open questions not yet in a change (PRD-43)

Every request, opinion or choice of the user goes here at once, in his words, with date and
source, unless a change is open (then into its `proposal.md`). Items: **W-nn** = his words to
turn into a change; **Q-nn** = a question only he can settle (never pick silently). When an item
moves into a change or is answered, delete it here (git keeps the history). The SessionStart
hook prints the open items.
A request Claude would do another way stays here with **«proposed differently: …»** and the
reason, never silently changed. Every «decided by Claude» note says how to undo it.

## Open
(Q-19…Q-24 answered 12 Nov by «ap yc», every recommendation taken: Q-19 → DT-34, Q-20 →
ROADMAP «Now», Q-21 → CLAUDE.md «Working agreements», Q-22 → CLAUDE.md rules 1 and 3 and done, Q-23/Q-24 →
`changes/2026-11-07-piano/proposal.md`.)

- **W-03** The user, 12 Nov: «you did not follow what was my original purposes, also, it is still
  redundunt and confusing, and messy, and slow». He wants a full, deep review (design, code, UI,
  process) and a refactor by Fable (`LIFEOS/review/fable-refactor-prompt.md`). The design part is
  change `2026-11-14-five-places` (with W-04 and W-05, moved there 14 Nov); open here: the code,
  speed («slow») and process review.
- **W-02** The user, 12 Nov: «lets skip q20». Q-20 (a) (a week of use only) is dropped; the next
  change is money/pantry as ROADMAP «Now» had it (Q-20 (b)). Goes into that change's proposal.
- **Q-25** Drop the old Piano tables (`templates`, `template_blocks`, `week_layouts`,
  `cycles_state`; Q-23 (a)'s second half). Since 12 Nov nothing in the app reads them; only the
  export, loading old files and merge still touch them, to keep their rows. Migration 0010 ran
  and the backup restores (drill of 12 Nov). (a) a migration that drops them after your next
  export, the export and loading code losing those tables too — recommended (it is a delete:
  outside «yc», so your answer); (b) keep them as history; (c) decide after the week of use.
- **W-01** One name per idea in every repo (12 Nov, his words: «I do not like that the same thing is
  called differently elsewhere»; the list is `~/Projects/fleet/GLOSSARY.md`). Done outside the spec on
  branch fleet/2026-11-12. Left for the next change, since one is open (PRD-41): «decided by Claude»
  in `domains/plan.md` (3 places; was the agent's wording) and «Claude» in `patterns.md` PAT-91 (was the same).
- **W-04** His note of 15 Nov, written by him in `RULES_LOG.md` («aggiunto da me»; moved out of
  that file on 16 Nov at his word, verbatim at the end of this inbox): the Elenco and its object pages are old and not built from the kit («si potrebbero
  semplicemente riusare le schede che si usano in oggi»); every place that changes a quantity is
  sized and spaced badly; changing something in the Elenco takes too many pages; the Elenco should
  show variants, brands and weights as a hierarchy and reuse the macro, micro, price and voto
  views; every specific problem is systemic and its fix must reach every like place («regole
  ferree… capita spesso che non le rispetti»); «dovremmo smetterla di implementare codice» — a
  specification first, tracking how pages, actions and views converge; and the repo holds files
  he believes useless or forgotten. His questions: «che ne pensi? come si potrebbe attuare… come
  si fa di solito? che tool puoi usare?» — answered in the reply of 15 Nov with options; the pick
  is his (CLAUDE.md rule 1).

## Notes folded (his raw notes outside the repo; `check.py` warns when one changes)
- considerations.txt 80c476d19294 — folded 30 Oct (file of 15 Oct)
- considerations2 0fed8b127b3f — folded 30 Oct (file of 22 Oct)

## W-04, his note verbatim (15 Nov; the last paragraph added 15–16 Nov)

Moved from `RULES_LOG.md` on 16 Nov (his words: «toglile da li dato che mi hai detto che non ci
devono stare»). `RULES_LOG.md` holds only one-line entries on where a rule failed; his words live
here or in the open change's proposal.

> aggiunto da me: molte pagine hanno versioni deprecate ancora, tipo quelle quando selezioni oggetti degli elenchi, che siano ingredienti, o pasti, o altre cose nell'elenco, hanno un design e feature fatte male e o inesistenti. anche l'elenco stesso. dovrebbe essere tutto uniformato con il kit, si potrebbero semplicemente riusare le schede che si usano in oggi o altrove, senza ripetere codice, e invece...
>
> inoltre capita molto spesso che graficamente ogni volta che la ui ti permette di modificare delle quantità sono dimensionate e spaziate male, oltre che icoerenti col design e gli allineamenti di tutta l'app e dei temi e stili della cosa di cui riguardano, del loro contesto eccetera.
>
> poi per modificare qualcosa nell'elenco devi passare 3000 pagine diverse, è troppo inutile e borioso oltre che brutto da vedere. anche l'elenco stesso è fatto malissimo. ti ricordi la regola del mostrare cose estendibili?
>
> ma poi l'elenco doveva essere piu intelligente, con una gestione gerarchica delle varianti, delle marche e delle grammature, e anche nella visualizzazioni dei macro, micro, prezzi, dei voti anche, tutte cose che stanno gia altrove e non vengono riutilizzate per nessun motivo
>
> dovremmo avere un approccio diverso in generale. ogni volta che configuriamo qualcosa di complesso, dovremmo pensare a come e dove si dovrebbe o potrebbe applicare o unificare o fondere in tutto il resto dell'app. mi spiego meglio,  ogni volta che emerge una problematica specifica, sicuramente è anche altrove ed è sistematica o comunque la sua soluzione, se riguarda un contesto simile, dovrebbe riguardare tutte quelle altre occorenze, di moto da unificare sempre di piu. mi hai capito? come puoi fare in modo di aggiungere regole ferree a riguardo? perché come ti dicevo anche quando aggiungi delle regole poi magari capita spesso che non le rispetti.
> tornando al discorso di prima, il problema principale di questa app è che molte delle sue funzionalità sono reimplementate ogni volta in modo diverso a seconda del contesto quando è completamente non necessario, e la correzione dovrebbe essere sia dall'alto che dal basso, quindi sia avere un quadro generale di come e dove sono distribuite tutte le azioni e i design, ma anche ogni volta che si modifica qualcosa o si aggiunge, capire di conseguenza come potrebbe cambiare il resto dell'app, se possiamo sostituire quasi completamente altre parti con questa novità dopo opportuni cambiamenti a quest'ultima.
>
> pensa a questo esempio banale: i pasti vengono visualizzati sia in oggi che in elenco, cosi come la loro modifica, è naturale pensare che tutto questo debba essere uniformato.
>
> lo stesso vale delle pianificazioni di cui parlavamo prima e i problemi con la pagina Oggi e Piano. quindi o ripensiamo per l'ennesima volta a una divisione migliore di tutte le paine dell'app o non saprei.
>
> forse, infatti, dovremmo smetterla di implementare codice. dobbiamo implementare una specifica come nei primi passi del software engineering, che però tenga traccia della convergenza delle pagine o dei comportamenti, delle azioni o delle visualizzazioni in generale. cosi rifiniamo quella per bene, pensiamo a ogni cosa nel dettaglio in un linguaggio naturale o semiformale o non saprei, cosi che lo sguardo sia gia completo di suo e non abbiamo sorprese. che ne pensi? come si potrebbe attuare una cosa simile? come si fa di solito? che tool puoi usare? ovviamente quello che abbiamo fatto adesso non si butta, non ricadiamo in questo errore, ma non dobbiamo nemmeno riciclare tutto, anzi, il fatto è che in questa repo vedo un sacco di file, script, documentazione, screenshot, immagini, e sono convinto che la maggior parte sia inutile o deprecato, o probabilmente dimenticato e inutilizzato quando invece dovrebbe esserlo
>
>
>
>
> la pianificazione inoltre va ripensata anche in funzione di come si possa applicare anche per cose come sveglia, pesata, misure, passi, e altre cose.
