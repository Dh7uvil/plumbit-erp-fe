import { DunningRuleDetailScreen } from "@/modules/erp/accounting/dunning-rules/components/dunning-rule-detail-screen";
import { dunningPermissions } from "@/modules/erp/accounting/dunning-rules/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function DunningRuleEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={dunningPermissions.manage}
      notFoundMessage="Dunning rule not found."
    >
      {(id) => <DunningRuleDetailScreen ruleId={id} mode="edit" />}
    </DetailPageRoute>
  );
}
