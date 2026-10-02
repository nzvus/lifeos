/**
 * core/auth/invite-header.ts — the header the sign-up form puts the
 * invitation code in (ADR-0034). Its own module: the browser imports it,
 * and core/auth/auth.ts would bring the database along.
 */
export const INVITE_HEADER = "x-invite-code";
