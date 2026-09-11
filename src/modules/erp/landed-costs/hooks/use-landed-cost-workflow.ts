"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  useCancelLandedCost,
  useDeleteLandedCost,
  usePostLandedCost,
} from "@/modules/erp/landed-costs/mutations";
import type { LandedCost } from "@/modules/erp/landed-costs/schemas";
import type { LandedCostWorkflowAction } from "@/modules/erp/landed-costs/workflow";
import type { DocumentWorkflowExtras } from "@/shared/components/document/document-workflow-buttons";

export function useLandedCostWorkflow(document: LandedCost) {
  const router = useRouter();
  const postDocument = usePostLandedCost();
  const cancelDocument = useCancelLandedCost();
  const deleteDocument = useDeleteLandedCost();
  const write = { id: document.id, version: document.version };

  return async function onAction(
    action: LandedCostWorkflowAction,
    extras: DocumentWorkflowExtras,
  ) {
    if (action === "post") {
      await postDocument.mutateAsync(write);
      toast.success("Landed cost posted");
    } else if (action === "cancel") {
      await cancelDocument.mutateAsync({ ...write, reason: extras.reason });
      toast.success("Landed cost cancelled");
    } else if (action === "delete") {
      await deleteDocument.mutateAsync(write);
      toast.success("Landed cost deleted");
      router.push("/landed-costs");
    }
  };
}
