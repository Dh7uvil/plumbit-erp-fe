import { goodsReceiptPermissions } from "@/modules/inventory-management/goods-receipts/permissions";
import { qualityInspectionPermissions } from "@/modules/inventory-management/quality-inspections/permissions";
import type { DocumentActionSpec } from "@/shared/components/document/workflow-registry";

export const GOODS_RECEIPT_WORKFLOW_ACTIONS = [
  "post",
  "cancel",
  "delete",
  "create_inspection",
] as const;
export type GoodsReceiptWorkflowAction = (typeof GOODS_RECEIPT_WORKFLOW_ACTIONS)[number];

export const GOODS_RECEIPT_ACTION_REGISTRY: DocumentActionSpec<GoodsReceiptWorkflowAction>[] = [
  {
    action: "post",
    label: "Post",
    permission: goodsReceiptPermissions.post,
    confirmCopy: (documentNumber) =>
      `Posting ${documentNumber}: stock and cost layers will move. AP will not.`,
  },
  {
    action: "cancel",
    label: "Cancel",
    permission: goodsReceiptPermissions.update,
    variant: "destructive",
    confirmCopy: (documentNumber) =>
      `${documentNumber} will be cancelled. If it is posted, stock and cost layers will reverse when the API allows it. AP will not.`,
    reasonField: { placeholder: "Why this goods receipt is being cancelled" },
  },
  {
    action: "delete",
    label: "Delete",
    permission: goodsReceiptPermissions.delete,
    variant: "destructive",
    confirmCopy: (documentNumber) =>
      `${documentNumber} will be removed. Only draft goods receipts can be deleted.`,
  },
  {
    action: "create_inspection",
    label: "Create inspection",
    permission: qualityInspectionPermissions.create,
    variant: "outline",
  },
];
