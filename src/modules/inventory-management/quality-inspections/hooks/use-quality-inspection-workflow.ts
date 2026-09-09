"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  useApproveQualityInspection,
  useCancelQualityInspection,
  useDeleteQualityInspection,
} from "@/modules/inventory-management/quality-inspections/mutations";
import type { QualityInspection } from "@/modules/inventory-management/quality-inspections/schemas";
import type { QualityInspectionWorkflowAction } from "@/modules/inventory-management/quality-inspections/workflow";
import type { DocumentWorkflowExtras } from "@/shared/components/document/document-workflow-buttons";

export function useQualityInspectionWorkflow(inspection: QualityInspection) {
  const router = useRouter();
  const approveInspection = useApproveQualityInspection();
  const cancelInspection = useCancelQualityInspection();
  const deleteInspection = useDeleteQualityInspection();
  const write = { id: inspection.id, version: inspection.version };

  return async function onAction(
    action: QualityInspectionWorkflowAction,
    extras: DocumentWorkflowExtras,
  ) {
    if (action === "approve") {
      await approveInspection.mutateAsync(write);
      toast.success("Quality inspection approved");
    } else if (action === "cancel") {
      await cancelInspection.mutateAsync({ ...write, reason: extras.reason });
      toast.success("Quality inspection cancelled");
    } else if (action === "delete") {
      await deleteInspection.mutateAsync(write);
      toast.success("Quality inspection deleted");
      router.push("/quality-inspections");
    }
  };
}
