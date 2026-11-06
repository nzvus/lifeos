/** Better Auth's endpoints (sign-in, sign-up, sign-out, session) under /api/auth/. */
import { getAuth } from "@/app/_server/runtime";

export async function GET(request: Request): Promise<Response> {
  return (await getAuth()).handler(request);
}

export async function POST(request: Request): Promise<Response> {
  return (await getAuth()).handler(request);
}
