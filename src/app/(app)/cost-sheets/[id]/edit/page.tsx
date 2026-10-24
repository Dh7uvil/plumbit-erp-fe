import { CostSheetEditPageClient } from "@/modules/erp/cost-sheets/components/cost-sheet-edit-page-client";
import { costSheetPermissions } from "@/modules/erp/cost-sheets/permissions";
import { PermissionGate } from "@/shared/auth/guards";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CostSheetEditPage({ params }: Props) {
  const { id } = await params;
  return (
    <PermissionGate permission={costSheetPermissions.update}>
      <CostSheetEditPageClient id={id} />
    </PermissionGate>
  );
}
