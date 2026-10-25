# Dossier — movement (steps, trips, routes)

Status: **draft for the developer's review** (2026-10-23). **Slice 1 built
(2026-10-25, the agent deciding §9.1 for now: distances typed, no routing
service, so no ADR yet)**: routes in Libreria → Tragitti (how, km, usual
minutes, metres on foot, a Maps link), ⊕ → Tragitto logs one with a tap,
Oggi names a trip by its route. Not yet: the trip's walking into E3's
steps, a route's own glyph (icons.json in the boards). Method:
`../method.md`. Touches: kinds.md "Training and movement" (steps, walk/run/
ride), engines.md E3 (expenditure: steps by cadence band, seated blocks),
E11 (data quality), the Libreria (ADR-0054).

## 1. Question
"How much did I move today, when, and how — precisely enough to trust the
energy it adds?" The developer: «il sistema attuale [è] molto impreciso»;
proposes «fasce orarie di movimento» in the day and **routes in the library**
like the other catalogs, «compatibile con google maps», to add or record
trips at once (considerations2).

## 2. Today
**Code.** v1 asks a day "level" (sitting / mixed / on feet), walking minutes
and steps; when steps are missing it estimates them (≈ 110 steps a minute of
walking plus a base by level, confidence low). v2 converts them into a
`steps` entry per day; E3 turns steps into energy by cadence band
(incidental 2.0–2.5 MET, brisk walks 3.0–3.8).

**Data** (16 days logged, 30 Sep → 15 Oct):
- Steps are round guesses: 4000, 6000, 7000 ×3, 10000, 12000 ×2, 13000 ×2…
- Contradictions: 14 Oct "sitting" with 16 500 steps; 10 Oct 0 walking
  minutes with 12 000 steps; walking minutes missing on 9 of 16 days.
- Two days are the app's own estimates (provenance "bassa").
So the expenditure's step term rests on numbers that are neither measured nor
consistent: the complaint is right.

## 3. Evidence and feasibility
- **How much matters.** Mortality risk falls as daily steps rise and levels
  off at ~8 000–10 000 a day under 60 (M: Paluch 2022, Lancet Public Health
  7:e219–e228); 10 000 itself has little specific evidence (same).
- **Energy.** METs by walking speed and incline from the 2024 Adult
  Compendium (G: Herrmann 2024, J Sport Health Sci 13(1):6–12,
  pacompendium.com); stride ≈ 0.41 × height to turn distance into steps (C).
- **A web app cannot count steps.** No browser API reads the phone's step
  counter; the Geolocation API works only while the page is open (no
  background tracking). Health Connect (Android) has no web API.
- **The phone already counts.** Google Fit / Samsung Health / the phone's
  own counter give an exact daily number; typing it once a day is more
  precise than any estimate the app can make (C, and E11's ranking).
- **Google Maps.**
  - *Maps URLs* (open directions in Maps, no key, free): we can link every
    route to `google.com/maps/dir/?api=1&origin=…&destination=…&travelmode=walking`.
  - *Routes API* (distance and duration for a pair of places): needs a key
    and a billing account; since 1 Mar 2025 "Compute Routes Essentials" has
    10 000 free calls a month per SKU (developers.google.com/maps/billing-and-pricing/pricing).
    One person's routes stay far below it.
  - *Free alternative:* OpenRouteService (OSM data, free key, daily quota) or
    typing the distance.
  - *Timeline:* Google moved Maps Timeline to the device in 2024–25; Takeout
    may hold only recent data, and the phone's export (Settings › Location ›
    Timeline) is a per-device JSON with its own format (community reports,
    no official doc found). Importable as a file, with care.

## 4. Data
| Datum | How | Confidence (E11) |
|---|---|---|
| **Daily steps from the phone** | typed once a day (or tomorrow morning for yesterday), source "telefono" | high |
| **Route** (library) | name, from place, to place, mode (walk, bike, bus, train, car, mixed), distance, usual duration, walking part in metres; optional Maps link | — |
| **Trip** (entry, kind `trip`) | a route at a time, actual duration; or «Parto»/«Arrivato» taps that take the position at both ends (foreground only) | medium |
| Imported trips | Timeline export file, parsed in the browser; only trips (mode, start, end, distance) are sent | medium |
| Walking minutes | derived from trips; typed only for walks without a route | medium |
| Day "level" | **dropped**: replaced by trips + seated blocks (E3) | — |

Places are catalog items (`place`): home, gym, work…, with coordinates only
when the person sets them (privacy: nothing is tracked otherwise).

## 5. Model
- **Steps of a day, converged (E11):**
  1. the phone's count when typed (it already includes the trips);
  2. else Σ walking metres of trips ÷ stride + an incidental baseline
     learnt from days that have both a phone count and trips (median of
     count − trip steps; before that, 3 000, C);
  3. else nothing — never the level-based guess.
  When both 1 and 2 exist and differ by > 30 %, the day says so.
- **Movement bands on the day:** every trip is a span on the timeline
  rail, coloured by mode; walking spans give cadence ≈ trip steps ÷
  minutes, so E3 can put them in the brisk band (≥ 100 steps/min) instead
  of the incidental one.
- **Energy (E3):** walking trips by speed (distance ÷ duration) at the
  Compendium's MET for that speed; the rest of the steps at the incidental
  band; cycling by the Compendium's leisure-cycling MET.
- **Aggregation:** trip → day (steps, walking minutes by band, active
  transport km) → week (steps on target days, trend) → goal (V-09 steps a
  day, already built).

## 6. Experience
- **Oggi:** a «Passi dal telefono» field on the day's Box (one number, the
  day before offered in the morning); trips on the rail as bands; ⊕ →
  «Tragitto»: the most used routes first (like saved meals), one tap logs
  it now with its usual duration, editable.
- **«Parto» / «Arrivato»:** two taps with the page open; the app proposes
  the route whose ends are nearest, or a new one.
- **Libreria › Tragitti:** routes with distance, duration, times used,
  «Apri in Maps»; a new route from two places (distance from the routing
  service or typed), or pasting a Google Maps directions link (origin and
  destination read from it).
- **Andamento:** steps vs target days, walking minutes by band, km by mode.

## 7. Edge cases
A trip with two modes (walk + bus): a route with a walking part. The phone
count missing on some days: the converged value falls back and says so. A
route changed (roadworks): a new route, the old archived. Travel abroad:
trips without places are fine (distance typed). A treadmill session: a
training session, not a trip (no double counting: the phone count does
include it, so E3 subtracts training steps when both exist).

## 8. Acceptance tests
1. 14 Oct: level "sitting", 16 500 steps typed → the level no longer exists;
   the steps stand as typed, source "telefono" only if marked so.
2. A day with a phone count 9 000 and trips with 3 200 walking steps →
   steps 9 000; baseline sample 5 800 stored for learning.
3. A day with trips only (2 walking trips, 1.6 km each, stride 0.73 m) and
   baseline 3 000 → ≈ 7 400 steps, confidence medium, "stimati dai tragitti".
4. Walking trip 1.6 km in 16 min (6 km/h, ~137 steps/min) → brisk band in E3.
5. A Google Maps link `…/maps/dir/Casa/Palestra/…` → a route draft with
   those ends; distance asked from the service or typed.
6. Phone 9 000 vs trips + baseline 12 500 (> 30 % apart) → the day shows
   the gap.

## 9. Questions for the developer
1. **Distance for routes: Google Routes API** (key + billing account, free up
   to 10 000 calls a month), **OpenRouteService** (free key, OSM), or
   **typed only**? Recommended: OpenRouteService first (no billing account),
   Google later if its distances disagree. An external service → an ADR.
2. **Type the phone's step count once a day?** Recommended: yes — it is the
   only precise source a web app can have.
3. **Import your Timeline export** (past trips, from the phone's file)?
   Recommended: later, after routes work by hand.
4. **Drop the day "level"?** Recommended: yes; trips and seated blocks
   replace it.
