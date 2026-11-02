import { Suspense } from "react";
import { z } from "zod";

import { PackageNewScreen } from "@/modules/inventory-management/packages/components/package-new-screen";
import { packagePermissions } from "@/modules/inventory-management/packages/permissions";
import { PermissionGate } from "@/shared/auth/guards";
import { Skeleton } from "@/shared/components/ui/skeleton";

function optionalUuid(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = z.string().uuid().safeParse(raw);
  return parsed.success ? parsed.data : undefined;
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function NewPackagePage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <PermissionGate permission={packagePermissions.create}>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <NewPackageContent searchParams={searchParams} />
      </Suspense>
    </PermissionGate>
  );
}

async function NewPackageContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return (
    <PackageNewScreen
      salesOrderId={optionalUuid(params.sales_order_id)}
      deliveryNoteId={optionalUuid(params.delivery_note_id)}
    />
  );
}
