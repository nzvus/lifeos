/**
 * features/account/auth/auth-client.ts — the BROWSER side of Better Auth.
 *
 * `createAuthClient` gives functions (signIn.email, signUp.email, signOut)
 * that send HTTP requests to /api/auth/* (src/app/api/auth/[...all]/route.ts).
 * The server replies with a Set-Cookie header carrying the session token as
 * an HttpOnly cookie: JavaScript in the page can never read it, which blunts
 * token theft through injected scripts.
 *
 * No baseURL: the client calls the same origin the page was loaded from,
 * which works identically on localhost, previews and production.
 */
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();
