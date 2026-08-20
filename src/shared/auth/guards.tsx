import { redirect } from "next/navigation";

import { hasPermission } from "@/shared/auth/permissions";
import { getSession, requireSession, type SessionUser } from "@/shared/auth/session";

export { requireSession };

export async function requirePermission(permission: string): Promise<SessionUser> {
  const session = await requireSession();
  if (!hasPermission(session, permission)) {
    redirect("/login");
  }
  return session;
}

export async function getOptionalSession(): Promise<SessionUser | null> {
  return getSession();
}
