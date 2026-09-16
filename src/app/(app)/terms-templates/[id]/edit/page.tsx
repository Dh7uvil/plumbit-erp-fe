import { TermsTemplateDetailScreen } from "@/modules/erp/accounting/terms-templates/components/terms-template-detail-screen";
import { termsTemplatePermissions } from "@/modules/erp/accounting/terms-templates/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function TermsTemplateDetailEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={termsTemplatePermissions.update}
      notFoundMessage="Terms template not found."
    >
      {(id) => <TermsTemplateDetailScreen templateId={id} mode="edit" />}
    </DetailPageRoute>
  );
}
