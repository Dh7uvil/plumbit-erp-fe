"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  useCancelSalesReturn,
  useDeleteSalesReturn,
  usePostSalesReturn,
} from "@/modules/inventory-management/sales-returns/mutations";
import type { SalesReturn } from "@/modules/inventory-management/sales-returns/schemas";
import type { SalesReturnWorkflowAction } from "@/modules/inventory-management/sales-returns/workflow";
import type { DocumentWorkflowExtras } from "@/shared/components/document/document-workflow-buttons";

export function useSalesReturnWorkflow(doc: SalesReturn) {
  const router = useRouter();
  const postReturn = usePostSalesReturn();
  const cancelReturn = useCancelSalesReturn();
  const deleteReturn = useDeleteSalesReturn();
  const write = { id: doc.id, version: doc.version };

  return async function onAction(action: SalesReturnWorkflowAction, extras: DocumentWorkflowExtras) {
    if (action === "post") {
      await postReturn.mutateAsync(write);
      toast.success("Sales return posted");
    } else if (action === "cancel") {
      await cancelReturn.mutateAsync({ ...write, reason: extras.reason });
      toast.success("Sales return cancelled");
    } else if (action === "delete") {
      await deleteReturn.mutateAsync(write);
      toast.success("Sales return deleted");
      router.push("/sales-returns");
    }
  };
}
