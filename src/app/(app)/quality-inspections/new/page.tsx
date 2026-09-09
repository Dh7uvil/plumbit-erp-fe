import { z } from "zod";

import { QualityInspectionNewScreen } from "@/modules/inventory-management/quality-inspections/components/quality-inspection-new-screen";
import { qualityInspectionPermissions } from "@/modules/inventory-management/quality-inspections/permissions";
import { PermissionGate } from "@/shared/auth/guards";

function optionalUuid(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = z.string().uuid().safeParse(raw);
  return parsed.success ? parsed.data : undefined;
}

export default async function NewQualityInspectionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  return (
    <PermissionGate permission={qualityInspectionPermissions.create}>
      <QualityInspectionNewScreen goodsReceiptId={optionalUuid(params.goods_receipt_id)} />
    </PermissionGate>
  );
}
