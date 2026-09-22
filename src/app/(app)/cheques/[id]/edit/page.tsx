import { ChequeEditScreen } from "@/modules/erp/accounting/cheques/components/cheque-edit-screen";
import { chequePermissions } from "@/modules/erp/accounting/cheques/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default async function EditChequePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <PermissionGate permission={chequePermissions.update}>
      <ChequeEditScreen id={id} />
    </PermissionGate>
  );
}
