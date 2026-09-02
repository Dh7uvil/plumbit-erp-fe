"use client";

import { useMemo, type ReactNode } from "react";

import { useMe } from "@/modules/users-management/auth/queries";
import type { SessionUser } from "@/shared/auth/session-schema";
import { SessionProvider as SessionPermissionsProvider } from "@/shared/providers/session-provider";

const EMPTY_PERMISSIONS: readonly string[] = [];

export function SessionProvider({
  children,
  initialMe,
}: {
  children: ReactNode;
  initialMe: SessionUser | null;
}) {
  const { data: me } = useMe(initialMe);
  const permissions = me?.permissions ?? EMPTY_PERMISSIONS;
  const tenantId = me?.tenant_id ?? null;
  const value = useMemo(() => ({ permissions, tenantId }), [permissions, tenantId]);

  return <SessionPermissionsProvider value={value}>{children}</SessionPermissionsProvider>;
}
