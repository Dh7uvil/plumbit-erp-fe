import { QuotationNewScreen } from "@/modules/erp/quotations/components/quotation-new-screen";
import { quotationPermissions } from "@/modules/erp/quotations/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function NewQuotationPage() {
  return (
    <PermissionGate permission={quotationPermissions.create}>
      <QuotationNewScreen />
    </PermissionGate>
  );
}
