import { costSheetPermissions } from "@/modules/erp/cost-sheets/permissions";
import { landedCostPermissions } from "@/modules/erp/landed-costs/permissions";
import type { DocumentActionSpec } from "@/shared/components/document/workflow-registry";

export const COST_SHEET_WORKFLOW_ACTIONS = [
  "confirm",
  "close",
  "reopen",
  "pull_actuals",
  "create_landed_cost",
  "delete",
] as const;
export type CostSheetWorkflowAction = (typeof COST_SHEET_WORKFLOW_ACTIONS)[number];

export const COST_SHEET_ACTION_REGISTRY: DocumentActionSpec<CostSheetWorkflowAction>[] = [
  {
    action: "confirm",
    label: "Confirm",
    permission: costSheetPermissions.confirm,
    confirmCopy: (documentNumber) =>
      `${documentNumber} will be locked for editing. Actuals can still be refreshed until the sheet is closed.`,
  },
  {
    action: "close",
    label: "Close",
    permission: costSheetPermissions.close,
    confirmCopy: (documentNumber) => `${documentNumber} will be closed for further changes.`,
  },
  {
    action: "reopen",
    label: "Reopen",
    permission: costSheetPermissions.update,
    confirmCopy: (documentNumber) =>
      `${documentNumber} will return to draft so it can be edited again.`,
  },
  {
    action: "pull_actuals",
    label: "Pull actuals",
    permission: costSheetPermissions.update,
    confirmCopy: (documentNumber) =>
      `Refresh charge and GRN layer actuals on ${documentNumber} from posted documents.`,
  },
  {
    action: "create_landed_cost",
    label: "Create landed cost",
    permission: landedCostPermissions.create,
    confirmCopy: (documentNumber) =>
      `Create a draft landed cost from confirmed charges on ${documentNumber}. The cost sheet does not post to the GL.`,
  },
  {
    action: "delete",
    label: "Delete",
    permission: costSheetPermissions.delete,
    variant: "destructive",
    confirmCopy: (documentNumber) => `${documentNumber} will be deleted. Draft sheets only.`,
  },
];
