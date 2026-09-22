import { ChequeDetailScreen } from "@/modules/erp/accounting/cheques/components/cheque-detail-screen";
import { chequePermissions } from "@/modules/erp/accounting/cheques/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default async function ChequeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <PermissionGate permission={chequePermissions.read}>
      <ChequeDetailScreen id={id} />
    </PermissionGate>
  );
}
