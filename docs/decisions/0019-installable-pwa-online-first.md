# ADR-0019: The phone app is the web app installed as a PWA, online first; offline logging later

**Status:** accepted (the developer chose the recommended option, 2026-10-01)
**Date:** 2026-10-01

## Context
The developer wants Lifeos as a phone app. The web app already works on a
phone browser; what is missing is the app experience (icon on the home
screen, full screen, quick to open) and, at the gym, logging without a
connection. Offline writes touch the data invariants: an entry saved on the
phone and one saved on the server can disagree, and nothing logged may be
lost or silently changed (PROJECT.md).

## Options considered
### A. Installable PWA now (online), offline logging later
- Pros: a manifest, icons and a small service worker make it installable on Android and iOS, full screen, with the shell cached; no data model change; ships in one slice.
- Cons: without a connection pages do not load data and nothing can be saved (an offline page says so).
### B. PWA with an offline queue now
- Pros: logs at the gym without signal from day one.
- Cons: a sync design (queue, retries, conflicts, what the UI shows) on top of every write path; a long, risky slice before the rest.
### C. Native wrapper (Capacitor)
- Pros: deeper device access, store presence.
- Cons: native builds and signing to maintain for one user; most of what is needed (camera, files, install) the web already gives.

## Decision
**A.** A web manifest (name, icons, theme colour, standalone display), a
service worker that caches the static shell and shows an offline page, and
nothing cached that contains user data. Offline logging gets its own ADR
when the gym shows it is needed.
Tripwire: if logging fails for lack of signal more than once a week, write
the offline ADR.

## Consequences
- `app/manifest.ts`, icons generated from the app mark, `public/sw.js`
  registered from the root layout; the shell only (no API or page HTML
  with data) in the cache.
- Every deploy updates the service worker; a stale shell must never hide a
  new version (network first for pages).

## What I learned
<!-- developer: write 1–3 sentences in your own words -->
