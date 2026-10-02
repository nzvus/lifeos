# ADR-0034: Friends join by invitation, and every account starts from a starter pack copied into its own rows; packs can also be imported

**Status:** accepted (the developer chose "invitation" and "copy at sign-up" on 2026-10-02, and approved the details on 2026-10-03)
**Date:** 2026-10-02

## Context
The developer wants friends to use the app, starting from a shared set of
exercises, routines, programs and foods, and wants their own account
expanded with a second, personal set built from their data. Sign-up is
closed today (`ALLOW_SIGNUP=false`, ADR-0006), and every row belongs to one
user, isolated at the `core/` boundary. The hosting is free tiers (Vercel
Hobby, which is for non-commercial use; Neon free), and the assistant costs
money per use. The developer chose: friends join **by invitation**, and the
starter data is **copied into each new account** (no shared tables). Still
open: how an invitation works, and how a set of data reaches an account that
already exists.

## Options considered
### Invitations
#### A. Invite codes in a new table, created by an admin
- A table `invites`: a hash of the code, who created it, when it expires,
  who used it and when. The sign-up form asks for the code. The server
  checks it before the account is created and marks it used after.
- Admins are the emails in `ADMIN_EMAILS` (env). They create codes in
  Settings, one per friend, and send them as a link (`/sign-up?invite=…`).
- Pros: no window where anyone can sign up; one code is one person; it can
  be revoked; the developer needs nobody's help.
- Cons: a migration (a new table, as the migration-merge-order lesson asks),
  and an admin notion that did not exist.
#### B. Open sign-up for a few minutes while a friend registers
- Pros: no code, no table.
- Cons: anyone with the link can register while it is open, and every
  opening is a redeploy (the env changes).
#### C. The developer creates each account with a script and sends the password
- Pros: no table, no new screen.
- Cons: the developer handles friends' passwords; production is touched
  from a laptop.

### How data reaches an account
#### A. Packs: versioned JSON, added only where missing; starter at sign-up, any pack by import
- A **pack** (`core/catalog`) lists exercises (with their guides),
  routines, programs, ingredients and meals. It is validated with zod and
  versioned.
- `applyPack` adds only what the account does not have, matching on the
  normalised name. Routines, programs and meals point at exercises and
  ingredients by name, and the links are resolved after the copy. Nothing
  that exists is changed.
- The **starter pack** lives in the repo, reviewed in PRs, and is applied
  once, right after an account is created.
- **Settings → Import a pack** (a file) applies any pack. The developer's
  personal expansion is generated locally from their export and imported
  by them; it never enters the repository.
- Pros: one mechanism for friends, for the developer and for later packs,
  which friends can also share with each other. No writes to production
  from outside the app.
- Cons: a format to keep stable (the version field); an import to validate
  carefully, since it reads a user's file.
#### B. Starter at sign-up; the personal expansion written into production by a script
- Cons: breaks "the agent never writes to production"; nothing reusable.

## Decision
**A and A.**
- Invitations are the developer's choice and keep the free tiers safe.
- Packs make "starter for everyone" and "more for me" the same code path.

Tripwires:
- If friends ask to share their own routines, packs already allow it.
  Reconsider a shared catalog (rejected by the developer) only if keeping
  copies in sync becomes a real need.
- If the assistant's cost grows with the friends, add a daily cap per user
  before inviting more.

## Consequences
- **Two PRs:**
  1. Packs and the starter, with no migration.
  2. Invites, with a migration, merged only after migrate.yml.
- **Sign-up:** with invites, `ALLOW_SIGNUP` stays the master switch. When it
  is on, a valid code is required too.
- **Content:** the starter pack's content (exercises with guides, routines,
  programs, spices, herbs, sauces, condiments and toppings with nutrition
  per 100 g) is reviewed like code. Its sources are named in the pack.
- **Personal expansion:** the developer's pack (more exercises and
  activities, routines, programs, condiments, and meals scored on macros,
  processing, flavour and amounts) stays a local file.

## What I learned
<!-- developer: write 1–3 sentences in your own words -->
