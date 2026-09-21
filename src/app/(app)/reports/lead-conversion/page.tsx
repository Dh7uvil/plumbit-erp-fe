import { LeadConversionScreen } from "@/modules/crm/reports/components/lead-conversion-screen";
import { crmReportPermissions } from "@/modules/crm/reports/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function Page() {
  return (
    <PermissionGate permission={crmReportPermissions.read}>
      <LeadConversionScreen />
    </PermissionGate>
  );
}
