import { z } from "zod";

import { LandedCostNewScreen } from "@/modules/erp/landed-costs/components/landed-cost-new-screen";
import { landedCostPermissions } from "@/modules/erp/landed-costs/permissions";
import { PermissionGate } from "@/shared/auth/guards";

function optionalUuid(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = z.string().uuid().safeParse(raw);
  return parsed.success ? parsed.data : undefined;
}

export default async function NewLandedCostPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  return (
    <PermissionGate permission={landedCostPermissions.create}>
      <LandedCostNewScreen
        goodsReceiptId={optionalUuid(params.goods_receipt_id)}
        purchaseInvoiceId={optionalUuid(params.purchase_invoice_id)}
        shipmentId={optionalUuid(params.shipment_id)}
      />
    </PermissionGate>
  );
}
