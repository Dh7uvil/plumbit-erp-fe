import { Suspense } from "react";
import { z } from "zod";

import { SalesReturnNewScreen } from "@/modules/inventory-management/sales-returns/components/sales-return-new-screen";
import { salesReturnPermissions } from "@/modules/inventory-management/sales-returns/permissions";
import { PermissionGate } from "@/shared/auth/guards";
import { Skeleton } from "@/shared/components/ui/skeleton";

function optionalUuid(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = z.string().uuid().safeParse(raw);
  return parsed.success ? parsed.data : undefined;
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function NewSalesReturnPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <PermissionGate permission={salesReturnPermissions.create}>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <NewSalesReturnContent searchParams={searchParams} />
      </Suspense>
    </PermissionGate>
  );
}

async function NewSalesReturnContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return <SalesReturnNewScreen deliveryNoteId={optionalUuid(params.delivery_note_id)} />;
}
