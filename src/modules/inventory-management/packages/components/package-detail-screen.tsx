"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { PackageForm } from "@/modules/inventory-management/packages/components/package-form";
import { usePackageWorkflow } from "@/modules/inventory-management/packages/hooks/use-package-workflow";
import { packagePermissions } from "@/modules/inventory-management/packages/permissions";
import { usePackage } from "@/modules/inventory-management/packages/queries";
import {
  PACKAGE_STATUS_LABELS,
  PACKAGE_STATUS_VARIANTS,
  packageDisplayNumber,
  type Package,
} from "@/modules/inventory-management/packages/schemas";
import { PACKAGE_ACTION_REGISTRY } from "@/modules/inventory-management/packages/workflow";
import { ActivityFeed } from "@/modules/users-management/activity/components/activity-feed";
import { EntityAttachmentsPanel } from "@/modules/users-management/attachments/components/entity-attachments-panel";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DocumentRecordShell } from "@/shared/components/document/document-record-shell";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { DocumentWorkflowButtons } from "@/shared/components/document/document-workflow-buttons";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import type { RecordPageMode } from "@/shared/components/layout/record-page-header";
import { formatDecimal } from "@/shared/lib/format";

export function PackageDetailScreen({
  packageId,
  mode,
}: {
  packageId: string;
  mode: RecordPageMode;
}) {
  const router = useRouter();
  const { canUpdate } = useCrudPermissions(packagePermissions);
  const packageQuery = usePackage(packageId);
  const pkg = packageQuery.data;
  const isDraft = pkg?.status === "DRAFT";
  const isEdit = mode === "edit";
  const viewHref = `/packages/${packageId}`;
  const canEditDraft = Boolean(isDraft && canUpdate);

  useEffect(() => {
    if (isEdit && pkg && pkg.status !== "DRAFT") {
      router.replace(viewHref);
    }
  }, [isEdit, pkg, router, viewHref]);

  if (packageQuery.isLoading || packageQuery.isError || !pkg) {
    return (
      <DocumentRecordShell
        isLoading={packageQuery.isLoading}
        isError={packageQuery.isError || !pkg}
        error={packageQuery.error}
        notFoundMessage="Package not found"
        onRetry={() => packageQuery.refetch()}
        backHref="/packages"
        backLabel="Back to packages"
        title="Package"
        listHref="/packages"
        viewHref={viewHref}
        canUpdate={false}
        mode={mode}
        formTitle="Package"
      >
        {null}
      </DocumentRecordShell>
    );
  }

  return (
    <PackageDetailLoaded pkg={pkg} mode={mode} canEditDraft={canEditDraft} viewHref={viewHref} />
  );
}

function PackageDetailLoaded({
  pkg,
  mode,
  canEditDraft,
  viewHref,
}: {
  pkg: Package;
  mode: RecordPageMode;
  canEditDraft: boolean;
  viewHref: string;
}) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const number = packageDisplayNumber(pkg);
  const [printOpen, setPrintOpen] = useState(false);
  const onAction = usePackageWorkflow(pkg, { onPrint: () => setPrintOpen(true) });
  const workflowActions = pkg.available_actions.includes("print")
    ? pkg.available_actions
    : [...pkg.available_actions, "print"];

  return (
    <>
      <DocumentRecordShell
        isLoading={false}
        isError={false}
        notFoundMessage="Package not found"
        onRetry={() => undefined}
        backHref="/packages"
        backLabel="Back to packages"
        title={number ?? "Package"}
        listHref="/packages"
        viewHref={viewHref}
        editHref={canEditDraft ? `${viewHref}/edit` : undefined}
        canUpdate={canEditDraft}
        mode={mode}
        badges={
          <DocumentStatusBadge
            status={pkg.status}
            labels={PACKAGE_STATUS_LABELS}
            variants={PACKAGE_STATUS_VARIANTS}
          />
        }
        workflow={
          <DocumentWorkflowButtons
            availableActions={workflowActions}
            registry={PACKAGE_ACTION_REGISTRY}
            documentKind="package"
            documentLabel={number ?? "package"}
            onAction={onAction}
          />
        }
        banner={
          <p className="text-muted-foreground text-sm">
            Sales order{" "}
            <Link
              href={`/sales-orders/${pkg.sales_order_id}`}
              className="text-foreground underline-offset-4 hover:underline"
            >
              link
            </Link>
            {pkg.delivery_note_id ? (
              <>
                {" "}
                · Delivery note{" "}
                <Link
                  href={`/delivery-notes/${pkg.delivery_note_id}`}
                  className="text-foreground underline-offset-4 hover:underline"
                >
                  link
                </Link>
              </>
            ) : null}
            . Packing does not move stock.
          </p>
        }
        formTitle={isEdit ? "Edit package" : "Package"}
        attachments={
          <EntityAttachmentsPanel
            entityType="PACKAGE"
            entityId={pkg.id}
            parentPosted={pkg.status !== "DRAFT"}
            defaultCategory="PACKING_LIST"
          />
        }
        activity={<ActivityFeed entityType="package" entityId={pkg.id} revision={pkg.version} />}
      >
        <PackageForm pkg={pkg} disabled={!isEdit} onSuccess={() => router.push(viewHref)} />
      </DocumentRecordShell>
      <Dialog open={printOpen} onOpenChange={setPrintOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Packing list {number ?? ""}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 text-sm">
            <p>Carton {pkg.package_number ?? "—"}</p>
            <p>
              {pkg.length ?? "—"} × {pkg.width ?? "—"} × {pkg.height ?? "—"} {pkg.dimension_unit ?? ""}
            </p>
            <p>
              Gross {pkg.gross_weight ?? "—"} / Net {pkg.net_weight ?? "—"} {pkg.weight_unit ?? ""}
            </p>
            <p>Marks: {pkg.shipping_marks ?? "—"}</p>
            <ul className="list-disc pl-5">
              {pkg.lines.map((line) => (
                <li key={line.id}>
                  {formatDecimal(line.quantity)} · line {line.line_number}
                </li>
              ))}
            </ul>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => window.print()}>
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
