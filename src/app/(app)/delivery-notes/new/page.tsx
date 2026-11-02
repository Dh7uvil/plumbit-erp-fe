import { Suspense } from "react";
import { z } from "zod";

import { DeliveryNoteNewScreen } from "@/modules/inventory-management/delivery-notes/components/delivery-note-new-screen";
import { deliveryNotePermissions } from "@/modules/inventory-management/delivery-notes/permissions";
import { PermissionGate } from "@/shared/auth/guards";
import { Skeleton } from "@/shared/components/ui/skeleton";

function optionalUuid(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = z.string().uuid().safeParse(raw);
  return parsed.success ? parsed.data : undefined;
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function NewDeliveryNotePage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <PermissionGate permission={deliveryNotePermissions.create}>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <NewDeliveryNoteContent searchParams={searchParams} />
      </Suspense>
    </PermissionGate>
  );
}

async function NewDeliveryNoteContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return <DeliveryNoteNewScreen salesOrderId={optionalUuid(params.sales_order_id)} />;
}
