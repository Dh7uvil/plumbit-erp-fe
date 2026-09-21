import { DunningRulesScreen } from "@/modules/erp/accounting/dunning-rules/components/dunning-rules-screen";
import { dunningPermissions } from "@/modules/erp/accounting/dunning-rules/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function DunningRulesPage() {
  return (
    <PermissionGate permission={dunningPermissions.read}>
      <DunningRulesScreen />
    </PermissionGate>
  );
}
