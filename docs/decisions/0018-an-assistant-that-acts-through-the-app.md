# ADR-0018: An AI assistant acts through the app's own core, with the user's OpenRouter key kept on the server

**Status:** accepted (the developer chose the four recommended options, 2026-10-01)
**Date:** 2026-10-01

## Context
The developer wants an assistant that does what the app can do when asked —
ingredients from a label, meals and preparations, imports, planned days,
gym sessions from notes like the ones used for the routines, tags,
exercises, ratings — and gives advice on how things are going. It must take
attachments (camera, gallery, files: photos, JSON, TXT). The developer will
provide an OpenRouter key on free plans. Facts that shape the choice
(checked 2026-10-01): free models allow 20 requests/minute and **50/day**
without purchased credits, **1000/day** after 10 credits (OpenRouter docs);
the `openrouter/free` router picks a free model that supports the request's
needs (images, tools, structured output). Tesseract.js reads printed text in
the browser (nutrition labels: ~1.6 % character errors in a published
study). Invariants: a user never reads another user's data; logged data is
never silently corrupted.

## Options considered
### Where the key and the calls live
- **A. Server, key encrypted at rest** — pasted in Settings, stored encrypted with a server secret, calls made by the server; the assistant's tools are core repositories called with the session's `Owner`, so isolation and validation are the app's own. Works on every device. Cons: a secret to guard and rotate on the server.
- **B. Browser only** — key in localStorage, the browser calls OpenRouter and then our actions. No secret on the server; but per device, and readable by any script on the page.
- **C. One Vercel env key** — simplest; shared by every account.
### How much it does alone
- **A. Mixed** — reads and creates on its own, every change listed with Undo (ADR-0015); deletes, replacements and large imports ask first with a preview.
- **B. Proposals only** — nothing written without a tap. Safest, slowest.
- **C. Everything alone** — fastest, riskiest with free models.
### Attachments
- **A. Text by default, photo by choice** — photos from camera, gallery or files have their text read on the phone (Tesseract.js) and only the text is sent; a switch sends the photo to a vision model. JSON/TXT are read in the browser and sent as text. The phone's own text recognition (copy, paste) always works too.
- **B. Always the photo** — simpler; slower, the photo leaves the phone, fewer free vision models.
- **C. Text only** — never a photo.
### Conversation history
- **A. In the database** — on every device, in the export and the trash; one migration.
- **B. In the browser** — no table; lost across devices.

## Decision
**A, A, A, A.**

- The key is encrypted (AES-256-GCM) with a new server secret
  (`ASSISTANT_KEY_SECRET`, Vercel env) and never sent back to the browser —
  Settings shows only "set / not set" and its last 4 characters.
- The assistant runs on the server: one route streams the conversation;
  the model gets **tools** that are thin wrappers over core repositories and
  validation (the same zod inputs as the forms), always with the session's
  `Owner`. Creates and edits run and are listed with Undo; deletes,
  replacements and imports return a preview the user confirms.
- Photos: text extracted on the phone by default (Tesseract.js, loaded only
  when used); "send the photo" is an explicit switch per message.
- Conversations and messages are stored per user (trash, export).
- Model: `openrouter/free` by default, the model id configurable; a request
  budget is shown (free plans: 50 or 1000 a day).

Decisive: A keeps every write behind the same owner checks and validation
as the forms, so an assistant mistake can never reach another user's data
or bypass a rule; mixed autonomy matches "it does it for me" while keeping
irreversible actions behind a tap.
Tripwires: if free models fail tool calls often (> 1 in 5), add a
"proposals only" mode for writes; if the daily limit is hit regularly,
show the cost of the 10-credit tier or move to a paid model.

## Consequences
- Migration PR first: `user_settings` (encrypted key, model id),
  `assistant_conversations`, `assistant_messages` (role, text, tool calls
  and results as JSON, attachments as extracted text or a note).
- New env secret `ASSISTANT_KEY_SECRET` (Vercel, never in the repo).
- A tool catalogue in core, one tool per user action, each covered by tests
  with a fake model (no network in tests).
- Export gains the conversations (next version); the trash gains them.
- Advice ("how am I doing") reads the same analyses the Targets page shows.

## What I learned
<!-- developer: write 1–3 sentences in your own words -->
