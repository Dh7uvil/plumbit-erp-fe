import { CommunicationSettings } from "@/modules/communication/calls/components/CommunicationSettings";
import { conversationPermissions } from "@/modules/communication/conversations/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function ChatSettingsPage() {
  return (
    <PermissionGate permission={conversationPermissions.read}>
      <CommunicationSettings />
    </PermissionGate>
  );
}
