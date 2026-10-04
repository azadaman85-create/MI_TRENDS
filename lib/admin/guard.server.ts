import { cookies } from "next/headers";

import { ADMIN_SESSION_COOKIE, readAdminSessionToken, type AdminUser } from "@/lib/admin/session.server";

/**
 * Authorization for the admin data APIs.
 *
 * `proxy.ts` gates the admin *pages* (`/admin/*`), but these routes live under `/api/admin/*`,
 * which that matcher's page check doesn't cover — so each one checks the session itself.
 * Never rely on the page guard to protect an API route.
 */
export async function requireAdmin(): Promise<AdminUser | null> {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  return readAdminSessionToken(token);
}
