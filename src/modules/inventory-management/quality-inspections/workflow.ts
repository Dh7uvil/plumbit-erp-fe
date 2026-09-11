import { purchaseReturnPermissions } from "@/modules/inventory-management/purchase-returns/permissions";
import { qualityInspectionPermissions } from "@/modules/inventory-management/quality-inspections/permissions";
import type { DocumentActionSpec } from "@/shared/components/document/workflow-registry";

export const QUALITY_INSPECTION_WORKFLOW_ACTIONS = [
  "approve",
  "cancel",
  "delete",
  "create_purchase_return",
] as const;
export type QualityInspectionWorkflowAction =
  (typeof QUALITY_INSPECTION_WORKFLOW_ACTIONS)[number];

export const QUALITY_INSPECTION_ACTION_REGISTRY: DocumentActionSpec<QualityInspectionWorkflowAction>[] =
  [
    {
      action: "approve",
      label: "Approve",
      permission: qualityInspectionPermissions.approve,
      confirmCopy: (documentNumber) =>
        `Approving ${documentNumber}: accepted quantity becomes available, scrap writes off cost, and return-to-supplier leaves the debit note for later.`,
    },
    {
      action: "cancel",
      label: "Cancel",
      permission: qualityInspectionPermissions.update,
      variant: "destructive",
      confirmCopy: (documentNumber) =>
        `${documentNumber} will be cancelled. Stock will not move.`,
      reasonField: { placeholder: "Why this inspection is being cancelled" },
    },
    {
      action: "delete",
      label: "Delete",
      permission: qualityInspectionPermissions.update,
      variant: "destructive",
      confirmCopy: (documentNumber) =>
        `${documentNumber} will be removed. Only draft inspections can be deleted.`,
    },
    {
      action: "create_purchase_return",
      label: "Create purchase return",
      permission: purchaseReturnPermissions.create,
      variant: "outline",
    },
  ];
