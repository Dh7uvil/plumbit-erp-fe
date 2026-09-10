"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  useCancelPackage,
  useDeletePackage,
  usePackPackage,
} from "@/modules/inventory-management/packages/mutations";
import type { Package } from "@/modules/inventory-management/packages/schemas";
import type { PackageWorkflowAction } from "@/modules/inventory-management/packages/workflow";

export function usePackageWorkflow(
  pkg: Package,
  extras: { onPrint?: () => void } = {},
) {
  const router = useRouter();
  const packPackage = usePackPackage();
  const cancelPackage = useCancelPackage();
  const deletePackage = useDeletePackage();
  const write = { id: pkg.id, version: pkg.version };

  return async function onAction(action: PackageWorkflowAction) {
    if (action === "pack") {
      await packPackage.mutateAsync(write);
      toast.success("Package packed");
    } else if (action === "cancel") {
      await cancelPackage.mutateAsync(write);
      toast.success("Package cancelled");
    } else if (action === "delete") {
      await deletePackage.mutateAsync(write);
      toast.success("Package deleted");
      router.push("/packages");
    } else if (action === "print") {
      extras.onPrint?.();
    }
  };
}
