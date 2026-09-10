import { z } from "zod";

import { SalesReturnNewScreen } from "@/modules/inventory-management/sales-returns/components/sales-return-new-screen";
import { salesReturnPermissions } from "@/modules/inventory-management/sales-returns/permissions";
import { PermissionGate } from "@/shared/auth/guards";

function optionalUuid(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = z.string().uuid().safeParse(raw);
  return parsed.success ? parsed.data : undefined;
}

export default async function NewSalesReturnPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  return (
    <PermissionGate permission={salesReturnPermissions.create}>
      <SalesReturnNewScreen deliveryNoteId={optionalUuid(params.delivery_note_id)} />
    </PermissionGate>
  );
}
