import { Suspense } from "react";
import { z } from "zod";

import { QualityInspectionNewScreen } from "@/modules/inventory-management/quality-inspections/components/quality-inspection-new-screen";
import { qualityInspectionPermissions } from "@/modules/inventory-management/quality-inspections/permissions";
import { PermissionGate } from "@/shared/auth/guards";
import { Skeleton } from "@/shared/components/ui/skeleton";

function optionalUuid(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = z.string().uuid().safeParse(raw);
  return parsed.success ? parsed.data : undefined;
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function NewQualityInspectionPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <PermissionGate permission={qualityInspectionPermissions.create}>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <NewQualityInspectionContent searchParams={searchParams} />
      </Suspense>
    </PermissionGate>
  );
}

async function NewQualityInspectionContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return <QualityInspectionNewScreen goodsReceiptId={optionalUuid(params.goods_receipt_id)} />;
}
