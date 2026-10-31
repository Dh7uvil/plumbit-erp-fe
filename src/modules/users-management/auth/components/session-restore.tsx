"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { endBrowserSession, refreshSession } from "@/shared/api/client";

/** Recovers an expired access cookie or clears the session without a layout redirect. */
export function SessionRestore({ canRefresh }: { canRefresh: boolean }) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (canRefresh) {
        const restored = await refreshSession();
        if (cancelled) {
          return;
        }
        if (restored) {
          router.refresh();
          return;
        }
      }
      if (!cancelled) {
        await endBrowserSession();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canRefresh, router]);

  return <div className="bg-muted h-14 w-full" aria-busy="true" aria-live="polite" />;
}
