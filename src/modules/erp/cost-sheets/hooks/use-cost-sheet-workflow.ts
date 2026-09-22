"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  useCloseCostSheet,
  useConfirmCostSheet,
  useCreateLandedCostFromSheet,
  useDeleteCostSheet,
  usePullCostSheetActuals,
  useReopenCostSheet,
} from "@/modules/erp/cost-sheets/mutations";
import type { CostSheet } from "@/modules/erp/cost-sheets/schemas";
import type { CostSheetWorkflowAction } from "@/modules/erp/cost-sheets/workflow";
import type { DocumentWorkflowExtras } from "@/shared/components/document/document-workflow-buttons";

export function useCostSheetWorkflow(document: CostSheet) {
  const router = useRouter();
  const confirm = useConfirmCostSheet(document.id);
  const close = useCloseCostSheet(document.id);
  const reopen = useReopenCostSheet(document.id);
  const pullActuals = usePullCostSheetActuals(document.id);
  const createLandedCost = useCreateLandedCostFromSheet(document.id);
  const deleteDocument = useDeleteCostSheet();
  const write = { version: document.version };

  return async function onAction(action: CostSheetWorkflowAction, extras: DocumentWorkflowExtras) {
    void extras;
    if (action === "confirm") {
      await confirm.mutateAsync(write);
      toast.success("Cost sheet confirmed");
    } else if (action === "close") {
      await close.mutateAsync(write);
      toast.success("Cost sheet closed");
    } else if (action === "reopen") {
      await reopen.mutateAsync(write);
      toast.success("Cost sheet reopened");
    } else if (action === "pull_actuals") {
      await pullActuals.mutateAsync(write);
      toast.success("Actuals refreshed");
    } else if (action === "create_landed_cost") {
      const landed = await createLandedCost.mutateAsync(write);
      toast.success("Landed cost created");
      router.push(`/landed-costs/${landed.id}`);
    } else if (action === "delete") {
      await deleteDocument.mutateAsync({ id: document.id, options: write });
      toast.success("Cost sheet deleted");
      router.push("/cost-sheets");
    }
  };
}
