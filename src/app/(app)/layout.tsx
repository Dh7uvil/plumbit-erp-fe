import { Suspense } from "react";

import { SessionProvider } from "@/modules/users-management/auth/components/session-provider";
import { AppShell } from "@/shared/components/layout/app-shell";
import { requireSession } from "@/shared/auth/guards";

async function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  const me = await requireSession();

  return (
    <SessionProvider initialMe={me}>
      <AppShell>{children}</AppShell>
    </SessionProvider>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="bg-muted h-12 w-full" />}>
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </Suspense>
  );
}
