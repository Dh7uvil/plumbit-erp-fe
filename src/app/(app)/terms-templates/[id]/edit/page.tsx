import { z } from "zod";

import { TermsTemplateDetailScreen } from "@/modules/erp/accounting/terms-templates/components/terms-template-detail-screen";
import { termsTemplatePermissions } from "@/modules/erp/accounting/terms-templates/permissions";
import { PermissionGate } from "@/shared/auth/guards";

const IdSchema = z.string().uuid();

export default async function TermsTemplateDetailEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = IdSchema.safeParse(id);

  return (
    <PermissionGate permission={termsTemplatePermissions.update}>
      {parsed.success ? (
        <TermsTemplateDetailScreen templateId={parsed.data} mode="edit" />
      ) : (
        <p className="text-muted-foreground text-sm">Terms template not found.</p>
      )}
    </PermissionGate>
  );
}
