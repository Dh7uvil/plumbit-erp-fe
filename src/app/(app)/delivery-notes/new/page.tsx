import { z } from "zod";

import { DeliveryNoteNewScreen } from "@/modules/inventory-management/delivery-notes/components/delivery-note-new-screen";
import { deliveryNotePermissions } from "@/modules/inventory-management/delivery-notes/permissions";
import { PermissionGate } from "@/shared/auth/guards";

function optionalUuid(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = z.string().uuid().safeParse(raw);
  return parsed.success ? parsed.data : undefined;
}

export default async function NewDeliveryNotePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  return (
    <PermissionGate permission={deliveryNotePermissions.create}>
      <DeliveryNoteNewScreen salesOrderId={optionalUuid(params.sales_order_id)} />
    </PermissionGate>
  );
}
