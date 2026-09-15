import { VatGlReconScreen } from "@/modules/erp/accounting/reports/components/vat-gl-recon-screen";
import { reportPermissions } from "@/modules/erp/accounting/reports/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function Page() {
  return (
    <PermissionGate permission={reportPermissions.tax}>
      <VatGlReconScreen />
    </PermissionGate>
  );
}
