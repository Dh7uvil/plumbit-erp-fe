import { Suspense } from "react";

import { SessionProvider } from "@/modules/users-management/auth/components/session-provider";
import { SessionRestore } from "@/modules/users-management/auth/components/session-restore";
import { AppShell } from "@/shared/components/layout/app-shell";
import { getRefreshToken, getSession } from "@/shared/auth/session";

async function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  const me = await getSession();

  if (!me) {
    const canRefresh = Boolean(await getRefreshToken());
    return (
      <>
        <SessionRestore canRefresh={canRefresh} />
        {children}
      </>
    );
  }

  return (
    <SessionProvider initialMe={me}>
      <AppShell>{children}</AppShell>
    </SessionProvider>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="bg-muted h-14 w-full" />}>
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </Suspense>
  );
}
