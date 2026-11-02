import { CostSheetRecordPageClient } from "@/modules/erp/cost-sheets/components/cost-sheet-record-page-client";
import { costSheetPermissions } from "@/modules/erp/cost-sheets/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function CostSheetEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={costSheetPermissions.update}
      notFoundMessage="Cost sheet not found."
    >
      {(id) => <CostSheetRecordPageClient id={id} readOnly={false} />}
    </DetailPageRoute>
  );
}
