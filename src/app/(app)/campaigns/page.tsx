import { CampaignsScreen } from "@/modules/crm/campaigns/components/campaigns-screen";
import { campaignPermissions } from "@/modules/crm/campaigns/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function CampaignsPage() {
  return (
    <PermissionGate permission={campaignPermissions.read}>
      <CampaignsScreen />
    </PermissionGate>
  );
}
