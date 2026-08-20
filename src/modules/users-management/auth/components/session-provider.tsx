"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";

import { authKeys } from "@/modules/users-management/auth/queries";
import type { SessionUser } from "@/shared/auth/session-schema";

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

  return children;
}
