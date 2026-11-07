# Change 2026-11-07-food-meal — cibo and pasto onto the generic pieces (phase 4, step 3)

**Why.** Phase 4 (approved 6 Nov): each type moves onto the registry's generic pieces and its
bespoke pages go; next after the tracker is «food and meal → Composer, Capture» (ROADMAP «Now»).
PAT-60 says «`/aggiungi` moves onto it with the first type change», PAT-62 «the food composer
and the session move onto it in their types' changes». His words: «vai avanti senza chidermi
conferme per ora» (6 Nov); «procedi» (7 Nov) for this change; «vai avanti» (7 Nov, after
the report with Q-11 and Q-12: taken as «go on with slice 4», not as an answer to them).

**What.**
1. **Registry** (MOD-01, MOD-02): cibo and prodotto declare their label values per 100 (kcal,
   protein, carbs, sugars, fat, saturated, fibre, salt; NOVA 1–4) as fields, with the limits
   `core/food/edit.ts` checks today, so the generic page shows them and `act edit` saves them
   (PAT-13, PAT-24). The generic page offers «Parti da…» and «Variante» (PAT-16, PAT-17) for
   every type with a create form: they open `nuovo?da=<id>` / `nuovo?variante=<id>`.
2. **Cibo** on the generic ObjectPage `/cibo/cibo/<id>` (PAT-04, PAT-30): name and values in
   place; its own sections from `extras.tsx`: voto per 100 kcal (FD-50), «Così appare»,
   Marche with «+ Marca», «Nei pasti salvati», «In casa». «Unisci» is the kit `MergeSheet`
   (PAT-18). `cibo/nuovo` and «+ Marca» become `NEW_FORMS` (`/cibo/cibo/nuovo`,
   `/cibo/prodotto/nuovo?di=<cibo>`). Deleted: the food page, `/modifica`, `/unisci`,
   `/prodotto`.
3. **Pasto** on the generic ObjectPage `/cibo/pasto/<id>`: its sections: «Registra», its cibi,
   one porzione, Famiglia (base, varianti). «Parti da», «Variante», Archivia from
   `ObjectActions`. `pasto/nuovo` becomes its `NEW_FORMS` entry (the composer); changing its
   lines is the composer at `/cibo/pasto/<id>/componi` (PAT-62), served by the family route
   from one map by type key (the scheda will use it). Deleted: the pasto page, `/modifica`.
4. **Composer** (PAT-62): the food composer (`features/food/Composer.tsx`) draws its lines,
   search and sticky «Salva» with the kit `Composer`; the food parts (totals, «come sarà»,
   when, servings, stima) are its children and `totals`.
5. **Capture** (PAT-60): `/aggiungi` is the kit `Capture` (one `Find` over types and objects,
   ranked by habit at this hour); its hand-made list and search go.
6. **Elenco Cibo** (PAT-43): the food twins move onto `core/catalog/twins.ts`; «Possibili
   doppioni» opens the `MergeSheet`.

**Decided by the agent** (inside the spec):
- The editable label values are the 9 of today's food form; the other ~30 nutrients stay
  read-only in «Così appare» (they come from OFF/CIQUAL with their source, FD-04).
- The food's unit (g/ml) is shown in the meta, not editable: lines already logged read it.
- «In casa» (stock, «Comprato», «Ne ho…») moves unchanged onto the food page, its forms on the
  kit `ObjectForm` (PAT-61); its fate (x03: only price observations survive, FD-81) is the
  money/pantry change's, not this one's.
- Changing a pasto's lines is composing (PRD-11, PAT-14), so it keeps a page with «Salva»;
  its address says the verb, `/componi`, not `/modifica` (PAT-13).

**Not in this change.** FD-13 band advice; FD-41 micro coverage; FD-84 value sorts; FD-92
«stima becomes a cibo at once»; FD-94 old ratings/tags as fields; the assunzione's own page
(it moves with ⊕ only as a type to capture); the meal voce sheet (PAT-32: it already uses
`EntrySheet`).

**Count (each PR counts):** pages −7 expected (food page, food `/modifica`, `/unisci`,
`/prodotto`, `nuovo`; pasto page, pasto `/modifica`), archive implementations −2
(`archiveFood`, `archiveSaved`), merge implementations −1 (`mergeFood`).

**Answered.** His words, 7 Nov, on Q-11 and Q-12: «scegli tu» → the agent's picks, (a) both;
written into `delta.md` (PAT-43, PAT-60).

**Questions for him (asked at the end; the work goes on without them).**
- **Q-11** (slice 6; answered: a) Cibo · Possibili doppioni today does more than PAT-43's one detector: it
  proposes «X è una marca di Y» (a brand in the name) and «variante» for two pasti with mostly
  the same cibi (ADR-0060 slice f, his 17 near-duplicates). (a) keep those proposals and add the
  name detector beside them; (b) only the one name detector, the brand and variant proposals
  go; (c) the name detector in Elenco, the proposals stay on the doppioni page. Agent's pick:
  (a) — the proposals answer FOOD-46 and the name rule alone misses «GELATO proteico» variants.
- **Q-12** (slice 5; answered: a) ⊕ today is a page whose empty state is ranked rows: today's previsti to
  tick, what he eats at this hour, schede to start, water in one tap, the last meals; «Tutti i
  tipi» folded. PAT-60 says «with nothing typed it lists the types», and the kit `Capture` is a
  sheet. (a) ⊕ becomes the `Capture` sheet on every page, its empty state = those ranked rows,
  then the types; (b) as PAT-60 reads: only the types, the ranked rows go; (c) keep the page,
  its search is the kit `Find` (done in this change) and PAT-60 is rewritten to say so. Agent's
  pick: (a) — one tap from anywhere, and the ranked rows are his «di solito a quest'ora».

**Stop.** None inside his «procedi»; questions, if any, written here and asked at the end.
