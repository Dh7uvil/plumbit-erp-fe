import { AuditLogsScreen } from "@/modules/users-management/audit-logs/components/audit-logs-screen";
import { auditLogPermissions } from "@/modules/users-management/audit-logs/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function AuditLogsPage() {
  return (
    <PermissionGate permission={auditLogPermissions.read}>
      <AuditLogsScreen />
    </PermissionGate>
  );
}
