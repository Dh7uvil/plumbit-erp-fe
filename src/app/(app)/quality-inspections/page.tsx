import { QualityInspectionsScreen } from "@/modules/inventory-management/quality-inspections/components/quality-inspections-screen";
import { qualityInspectionPermissions } from "@/modules/inventory-management/quality-inspections/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function QualityInspectionsPage() {
  return (
    <PermissionGate permission={qualityInspectionPermissions.read}>
      <QualityInspectionsScreen />
    </PermissionGate>
  );
}
