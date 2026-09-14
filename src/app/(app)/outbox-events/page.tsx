import { OutboxEventsScreen } from "@/modules/users-management/outbox/components/outbox-events-screen";
import { outboxPermissions } from "@/modules/users-management/outbox/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function OutboxEventsPage() {
  return (
    <PermissionGate permission={outboxPermissions.read}>
      <OutboxEventsScreen />
    </PermissionGate>
  );
}
