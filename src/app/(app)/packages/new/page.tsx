import { z } from "zod";

import { PackageNewScreen } from "@/modules/inventory-management/packages/components/package-new-screen";
import { packagePermissions } from "@/modules/inventory-management/packages/permissions";
import { PermissionGate } from "@/shared/auth/guards";

function optionalUuid(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = z.string().uuid().safeParse(raw);
  return parsed.success ? parsed.data : undefined;
}

export default async function NewPackagePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  return (
    <PermissionGate permission={packagePermissions.create}>
      <PackageNewScreen salesOrderId={optionalUuid(params.sales_order_id)} deliveryNoteId={optionalUuid(params.delivery_note_id)} />
    </PermissionGate>
  );
}
