import type { ReactNode } from "react";

import { AccessDenied } from "@/shared/components/feedback/access-denied";
import { hasPermission } from "@/shared/auth/permissions";
import { getSession, requireSession, type SessionUser } from "@/shared/auth/session";

export { requireSession };

export async function requirePermission(permission: string): Promise<SessionUser | null> {
  const session = await requireSession();
  if (!hasPermission(session, permission)) {
    return null;
  }
  return session;
}

export async function getOptionalSession(): Promise<SessionUser | null> {
  return getSession();
}

export async function PermissionGate({
  permission,
  children,
}: {
  permission: string;
  children: ReactNode;
}) {
  const session = await requirePermission(permission);
  if (!session) {
    return <AccessDenied />;
  }
  return children;
}
