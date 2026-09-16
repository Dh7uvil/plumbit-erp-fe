import { Suspense, type ReactNode } from "react";
import { z } from "zod";

import { PermissionGate } from "@/shared/auth/guards";
import { Skeleton } from "@/shared/components/ui/skeleton";

const UuidSchema = z.string().uuid();

function DetailPageFallback() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

async function DetailPageRouteResolved({
  params,
  paramKey,
  permission,
  notFoundMessage,
  children,
}: {
  params: Promise<Record<string, string>>;
  paramKey: string;
  permission: string;
  notFoundMessage: string;
  children: (id: string) => ReactNode;
}) {
  const resolved = await params;
  const parsed = UuidSchema.safeParse(resolved[paramKey]);

  return (
    <PermissionGate permission={permission}>
      {parsed.success ? (
        children(parsed.data)
      ) : (
        <p className="text-muted-foreground text-sm">{notFoundMessage}</p>
      )}
    </PermissionGate>
  );
}

export function DetailPageRoute({
  params,
  paramKey = "id",
  permission,
  notFoundMessage,
  children,
}: {
  params: Promise<Record<string, string>>;
  paramKey?: string;
  permission: string;
  notFoundMessage: string;
  children: (id: string) => ReactNode;
}) {
  return (
    <Suspense fallback={<DetailPageFallback />}>
      <DetailPageRouteResolved
        params={params}
        paramKey={paramKey}
        permission={permission}
        notFoundMessage={notFoundMessage}
      >
        {children}
      </DetailPageRouteResolved>
    </Suspense>
  );
}
