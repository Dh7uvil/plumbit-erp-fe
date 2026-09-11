import { landedCostPermissions } from "@/modules/erp/landed-costs/permissions";
import type { DocumentActionSpec } from "@/shared/components/document/workflow-registry";

export const LANDED_COST_WORKFLOW_ACTIONS = ["post", "cancel", "delete"] as const;
export type LandedCostWorkflowAction = (typeof LANDED_COST_WORKFLOW_ACTIONS)[number];

export const LANDED_COST_ACTION_REGISTRY: DocumentActionSpec<LandedCostWorkflowAction>[] = [
  {
    action: "post",
    label: "Post",
    permission: landedCostPermissions.post,
    confirmCopy: (documentNumber) =>
      `Posting ${documentNumber}: inventory and COGS variance will move; stock quantity will not; freight/duty expense will be cleared. This cannot be undone from this document except by cancel in an open period.`,
  },
  {
    action: "cancel",
    label: "Cancel",
    permission: landedCostPermissions.cancel,
    variant: "destructive",
    confirmCopy: (documentNumber) =>
      `${documentNumber} will be cancelled. The landed-cost journal will reverse and remaining layer costs will be restored.`,
    reasonField: { placeholder: "Why this landed cost is being cancelled" },
  },
  {
    action: "delete",
    label: "Delete",
    permission: landedCostPermissions.update,
    variant: "destructive",
    confirmCopy: (documentNumber) =>
      `${documentNumber} will be removed. Only draft landed costs can be deleted.`,
  },
];
