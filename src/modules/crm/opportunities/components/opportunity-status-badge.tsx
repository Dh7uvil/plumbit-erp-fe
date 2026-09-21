import { Badge } from "@/shared/components/ui/badge";
import {
  OPPORTUNITY_STATUS_LABELS,
  OPPORTUNITY_STATUS_VARIANTS,
  type OpportunityStatus,
} from "@/modules/crm/opportunities/schemas";

export function OpportunityStatusBadge({ status }: { status: OpportunityStatus }) {
  return (
    <Badge variant={OPPORTUNITY_STATUS_VARIANTS[status]}>{OPPORTUNITY_STATUS_LABELS[status]}</Badge>
  );
}
