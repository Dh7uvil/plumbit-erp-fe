import { CostSheetDetailScreen } from "@/modules/erp/cost-sheets/components/cost-sheet-detail-screen";
import { costSheetPermissions } from "@/modules/erp/cost-sheets/permissions";
import { PermissionGate } from "@/shared/auth/guards";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CostSheetDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <PermissionGate permission={costSheetPermissions.read}>
      <CostSheetDetailScreen id={id} />
    </PermissionGate>
  );
}
