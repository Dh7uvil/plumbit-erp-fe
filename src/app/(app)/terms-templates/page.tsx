import { TermsTemplatesScreen } from "@/modules/erp/accounting/terms-templates/components/terms-templates-screen";
import { termsTemplatePermissions } from "@/modules/erp/accounting/terms-templates/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function TermsTemplatesPage() {
  return (
    <PermissionGate permission={termsTemplatePermissions.read}>
      <TermsTemplatesScreen />
    </PermissionGate>
  );
}
