# Rules log: where the rules failed

Where CLAUDE.md, a rule file (`.claude/rules/`), a skill or a guard misled Claude or had to be repeated by the user. Any session appends 0–3 lines under **Open** when that happens; `/tune-rules` turns recurring ones into rule changes and moves them under **Applied**. (Idea from the study vault's RULES_LOG.md, via fleet P-007.)

Entry, one line: `- YYYY-MM-DD · <CLAUDE.md|rule|skill|guard> · <what went wrong or was repeated> · evidence: <his words, a review finding, a failed check> · idea: <possible fix>`

## Open
- 2026-11-12 · CLAUDE.md · reports to the user were lists of PRs, Q-ids and gates; the one action he had to take was lost · evidence: «i do not understand what hsould i do», then «what?» · idea: «Keep the user informed» adds: when the user must act, end with one «Your next step» in plain words (memory one-step-at-a-time).
- 2026-11-12 · CLAUDE.md · Claude suggested `! cat ~/.config/lifeos/backup-key.txt` to copy the key: the `!` output lands in the chat, so the secret went into the transcript · evidence: the key printed in the 12 Nov session · idea: a line «never route a secret through the chat (`!` output is in the transcript): tell the user to open the file themselves».
- 2026-11-12 · guard · two PRs open at once each kept CLAUDE.md within its 130-line budget, together 133: check.py would have failed main after both merged · evidence: #348 + the process-diet branch · idea: when two branches touch a budgeted file, check the sum (or keep the edits on one branch: «few PRs»).

- 2026-11-15 · CLAUDE.md · «Wait for CI in the background» broken four times in one session: `gh pr checks --watch` run in the foreground to have the result before replying · evidence: «ti avevo detto che dovevi farle in background… non segui mai le regole che ti imponi?» · idea: a PreToolUse hook that blocks `gh pr checks … --watch` and `gh run watch` unless `run_in_background` is set.
- 2026-11-15 · skill · `verify` had no step «open it in his browser», so the memory open-in-browser was skipped twice · evidence: «you did not write doen that rule apparently» · applied the same day: verify step 6 + CLAUDE.md line (PR #360).

aggiunto da me: molte pagine hanno versioni deprecate ancora, tipo quelle quando selezioni oggetti degli elenchi, che siano ingredienti, o pasti, o altre cose nell'elenco, hanno un design e feature fatte male e o inesistenti. anche l'elenco stesso. dovrebbe essere tutto uniformato con il kit, si potrebbero semplicemente riusare le schede che si usano in oggi o altrove, senza ripetere codice, e invece... 

inoltre capita molto spesso che graficamente ogni volta che la ui ti permette di modificare delle quantità sono dimensionate e spaziate male, oltre che icoerenti col design e gli allineamenti di tutta l'app e dei temi e stili della cosa di cui riguardano, del loro contesto eccetera.

poi per modificare qualcosa nell'elenco devi passare 3000 pagine diverse, è troppo inutile e borioso oltre che brutto da vedere. anche l'elenco stesso è fatto malissimo. ti ricordi la regola del mostrare cose estendibili? 

ma poi l'elenco doveva essere piu intelligente, con una gestione gerarchica delle varianti, delle marche e delle grammature, e anche nella visualizzazioni dei macro, micro, prezzi, dei voti anche, tutte cose che stanno gia altrove e non vengono riutilizzate per nessun motivo

dovremmo avere un approccio diverso in generale. ogni volta che configuriamo qualcosa di complesso, dovremmo pensare a come e dove si dovrebbe o potrebbe applicare o unificare o fondere in tutto il resto dell'app. mi spiego meglio,  ogni volta che emerge una problematica specifica, sicuramente è anche altrove ed è sistematica o comunque la sua soluzione, se riguarda un contesto simile, dovrebbe riguardare tutte quelle altre occorenze, di moto da unificare sempre di piu. mi hai capito? come puoi fare in modo di aggiungere regole ferree a riguardo? perché come ti dicevo anche quando aggiungi delle regole poi magari capita spesso che non le rispetti.
tornando al discorso di prima, il problema principale di questa app è che molte delle sue funzionalità sono reimplementate ogni volta in modo diverso a seconda del contesto quando è completamente non necessario, e la correzione dovrebbe essere sia dall'alto che dal basso, quindi sia avere un quadro generale di come e dove sono distribuite tutte le azioni e i design, ma anche ogni volta che si modifica qualcosa o si aggiunge, capire di conseguenza come potrebbe cambiare il resto dell'app, se possiamo sostituire quasi completamente altre parti con questa novità dopo opportuni cambiamenti a quest'ultima.

pensa a questo esempio banale: i pasti vengono visualizzati sia in oggi che in elenco, cosi come la loro modifica, è naturale pensare che tutto questo debba essere uniformato.

lo stesso vale delle pianificazioni di cui parlavamo prima e i problemi con la pagina Oggi e Piano. quindi o ripensiamo per l'ennesima volta a una divisione migliore di tutte le paine dell'app o non saprei.

forse, infatti, dovremmo smetterla di implementare codice. dobbiamo implementare una specifica come nei primi passi del software engineering, che però tenga traccia della convergenza delle pagine o dei comportamenti, delle azioni o delle visualizzazioni in generale. cosi rifiniamo quella per bene, pensiamo a ogni cosa nel dettaglio in un linguaggio naturale o semiformale o non saprei, cosi che lo sguardo sia gia completo di suo e non abbiamo sorprese. che ne pensi? come si potrebbe attuare una cosa simile? come si fa di solito? che tool puoi usare? ovviamente quello che abbiamo fatto adesso non si butta, non ricadiamo in questo errore, ma non dobbiamo nemmeno riciclare tutto, anzi, il fatto è che in questa repo vedo un sacco di file, script, documentazione, screenshot, immagini, e sono convinto che la maggior parte sia inutile o deprecato, o probabilmente dimenticato e inutilizzato quando invece dovrebbe esserlo




la pianificazione inoltre va ripensata anche in funzione di come si possa applicare anche per cose come sveglia, pesata, misure, passi, e altre cose.



## Applied
- 2026-11-14 · `.claude/rules/design.md` (new, always loaded) · each session drew from a summary and dropped the agreed v2 look and kit pieces; two artifact pages rejected · evidence: «why you are continueing to ignore all the discussions that we had for v2», «il modo in cui stiamo lavorando è sbagliato» · applied by his «yc»: one page of what v2 decided, no separate drawings, one screen at a time, yc/ap never cover design.
