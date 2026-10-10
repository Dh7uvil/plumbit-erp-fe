import { Suspense, type ReactNode } from "react";

import { AccessDenied } from "@/shared/components/feedback/access-denied";
import { PageLoadingState } from "@/shared/components/feedback/loading-state";
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

async function PermissionGateInner({
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

/** Wraps session/permission fetch in Suspense for Next.js instant navigations. */
export function PermissionGate({
  permission,
  children,
}: {
  permission: string;
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<PageLoadingState />}>
      <PermissionGateInner permission={permission}>{children}</PermissionGateInner>
    </Suspense>
  );
}
