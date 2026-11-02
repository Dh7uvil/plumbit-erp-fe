import { CostSheetEditPageClient } from "@/modules/erp/cost-sheets/components/cost-sheet-edit-page-client";
import { costSheetPermissions } from "@/modules/erp/cost-sheets/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function CostSheetEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={costSheetPermissions.update}
      notFoundMessage="Cost sheet not found."
    >
      {(id) => <CostSheetEditPageClient id={id} />}
    </DetailPageRoute>
  );
}
