import { FxRevaluationScreen } from "@/modules/erp/accounting/fx-revaluation/components/fx-revaluation-screen";
import { fxRevaluationPermissions } from "@/modules/erp/accounting/fx-revaluation/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function FxRevaluationPage() {
  return (
    <PermissionGate permission={fxRevaluationPermissions.read}>
      <FxRevaluationScreen />
    </PermissionGate>
  );
}
