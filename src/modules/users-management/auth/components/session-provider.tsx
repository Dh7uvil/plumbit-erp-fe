"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";

import { authKeys } from "@/modules/users-management/auth/queries";
import type { SessionUser } from "@/shared/auth/session-schema";
import { SessionProvider as SessionPermissionsProvider } from "@/shared/providers/session-provider";

export function SessionProvider({
  children,
  initialMe,
}: {
  children: ReactNode;
  initialMe: SessionUser | null;
}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (initialMe) {
      queryClient.setQueryData(authKeys.me(), initialMe);
    }
  }, [initialMe, queryClient]);

  return (
    <SessionPermissionsProvider value={{ permissions: initialMe?.permissions ?? [] }}>
      {children}
    </SessionPermissionsProvider>
  );
}
