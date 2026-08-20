import { Suspense } from "react";

import { AppHeader } from "@/modules/users-management/auth/components/app-header";
import { SessionProvider } from "@/modules/users-management/auth/components/session-provider";
import { requireSession } from "@/shared/auth/guards";

async function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  const me = await requireSession();

  return (
    <SessionProvider initialMe={me}>
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <main className="flex-1 p-6">{children}</main>
      </div>
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
