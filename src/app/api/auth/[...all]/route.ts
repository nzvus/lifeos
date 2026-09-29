/**
 * app/api/auth/[...all]/route.ts — mounts Better Auth's HTTP endpoints.
 *
 * `[...all]` is a Next.js "catch-all" segment: every URL under /api/auth/
 * (sign-in/email, sign-up/email, sign-out, get-session, ...) lands here, and
 * Better Auth routes it internally. The browser side calls these URLs through
 * src/features/auth/auth-client.ts.
 *
 * A route handler exports one function per HTTP method. Better Auth's
 * `handler` takes a standard Request and returns a standard Response, so no
 * Next-specific adapter is needed.
 */
import { getAuth } from "@/app/_server/runtime";

export async function GET(request: Request): Promise<Response> {
  return getAuth().handler(request);
}

export async function POST(request: Request): Promise<Response> {
  return getAuth().handler(request);
}
