"use client";

import { createContext, useContext, type ReactNode } from "react";

import { can as canPermission } from "@/shared/auth/permissions";

export type SessionValue = {
  permissions: readonly string[];
  tenantId: string | null;
};

const SessionContext = createContext<SessionValue>({ permissions: [], tenantId: null });

export function SessionProvider({
  children,
  value,
}: {
  children: ReactNode;
  value?: SessionValue;
}) {
  return (
    <SessionContext.Provider value={value ?? { permissions: [], tenantId: null }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionValue {
  return useContext(SessionContext);
}

export function useCan() {
  const { permissions } = useSession();
  return (permission: string) => canPermission(permission, permissions);
}
