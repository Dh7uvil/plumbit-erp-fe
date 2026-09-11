"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ShipmentDeliveryNotesPanel } from "@/modules/inventory-management/shipments/components/shipment-delivery-notes-panel";
import { ShipmentForm } from "@/modules/inventory-management/shipments/components/shipment-form";
import { ShipmentTrackingDialog } from "@/modules/inventory-management/shipments/components/shipment-tracking-dialog";
import { ShipmentTrackingStrip } from "@/modules/inventory-management/shipments/components/shipment-tracking-strip";
import { ComposeFromBillsDialog } from "@/modules/erp/landed-costs/components/compose-from-bills-dialog";
import { landedCostPermissions } from "@/modules/erp/landed-costs/permissions";
import { useShipmentWorkflow } from "@/modules/inventory-management/shipments/hooks/use-shipment-workflow";
import { shipmentPermissions } from "@/modules/inventory-management/shipments/permissions";
import { useShipment } from "@/modules/inventory-management/shipments/queries";
import {
  SHIPMENT_STATUS_LABELS,
  SHIPMENT_STATUS_VARIANTS,
  shipmentDisplayNumber,
  type Shipment,
} from "@/modules/inventory-management/shipments/schemas";
import { SHIPMENT_ACTION_REGISTRY } from "@/modules/inventory-management/shipments/workflow";
import { ActivityFeed } from "@/modules/users-management/activity/components/activity-feed";
import { EntityAttachmentsPanel } from "@/modules/users-management/attachments/components/entity-attachments-panel";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DocumentRecordShell } from "@/shared/components/document/document-record-shell";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { RelatedDocumentsCard } from "@/shared/components/document/related-documents-card";
import { DocumentWorkflowButtons } from "@/shared/components/document/document-workflow-buttons";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import type { RecordPageMode } from "@/shared/components/layout/record-page-header";
import { useCan } from "@/shared/providers/session-provider";

function canUpdateTracking(status: Shipment["status"]): boolean {
  return status === "DISPATCHED" || status === "IN_TRANSIT" || status === "ARRIVED";
}

export function ShipmentDetailScreen({
  shipmentId,
  mode,
}: {
  shipmentId: string;
  mode: RecordPageMode;
}) {
  const router = useRouter();
  const { canUpdate } = useCrudPermissions(shipmentPermissions);
  const shipmentQuery = useShipment(shipmentId);
  const shipment = shipmentQuery.data;
  const isDraft = shipment?.status === "DRAFT";
  const isEdit = mode === "edit";
  const viewHref = `/shipments/${shipmentId}`;
  const canEditDraft = Boolean(isDraft && canUpdate);

  useEffect(() => {
    if (isEdit && shipment && shipment.status !== "DRAFT") {
      router.replace(viewHref);
    }
  }, [isEdit, shipment, router, viewHref]);

  if (shipmentQuery.isLoading || shipmentQuery.isError || !shipment) {
    return (
      <DocumentRecordShell
        isLoading={shipmentQuery.isLoading}
        isError={shipmentQuery.isError || !shipment}
        error={shipmentQuery.error}
        notFoundMessage="Shipment not found"
        onRetry={() => shipmentQuery.refetch()}
        backHref="/shipments"
        backLabel="Back to shipments"
        title="Shipment"
        listHref="/shipments"
        viewHref={viewHref}
        canUpdate={false}
        mode={mode}
        formTitle="Shipment"
      >
        {null}
      </DocumentRecordShell>
    );
  }

  return (
    <ShipmentDetailLoaded
      shipment={shipment}
      mode={mode}
      canEditDraft={canEditDraft}
      viewHref={viewHref}
    />
  );
}

function ShipmentDetailLoaded({
  shipment,
  mode,
  canEditDraft,
  viewHref,
}: {
  shipment: Shipment;
  mode: RecordPageMode;
  canEditDraft: boolean;
  viewHref: string;
}) {
  const router = useRouter();
  const can = useCan();
  const isEdit = mode === "edit";
  const number = shipmentDisplayNumber(shipment);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [landedCostOpen, setLandedCostOpen] = useState(false);
  const onAction = useShipmentWorkflow(shipment, { onTracking: () => setTrackingOpen(true) });
  const trackingEnabled = canUpdateTracking(shipment.status);
  const canCreateLandedCost =
    shipment.status !== "CANCELLED" && can(landedCostPermissions.create);
  const workflowActions =
    trackingEnabled && !shipment.available_actions.includes("tracking")
      ? [...shipment.available_actions, "tracking"]
      : shipment.available_actions;

  return (
    <>
      <DocumentRecordShell
        isLoading={false}
        isError={false}
        notFoundMessage="Shipment not found"
        onRetry={() => undefined}
        backHref="/shipments"
        backLabel="Back to shipments"
        title={number ?? "Shipment"}
        listHref="/shipments"
        viewHref={viewHref}
        editHref={canEditDraft ? `${viewHref}/edit` : undefined}
        canUpdate={canEditDraft}
        mode={mode}
        badges={
          <DocumentStatusBadge
            status={shipment.status}
            labels={SHIPMENT_STATUS_LABELS}
            variants={SHIPMENT_STATUS_VARIANTS}
          />
        }
        workflow={
          <div className="flex flex-col items-end gap-2">
            {canCreateLandedCost ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setLandedCostOpen(true)}
              >
                Create landed cost
              </Button>
            ) : null}
            <DocumentWorkflowButtons
              availableActions={workflowActions}
              registry={SHIPMENT_ACTION_REGISTRY}
              documentKind="shipment"
              documentLabel={number ?? "shipment"}
              onAction={onAction}
            />
          </div>
        }
        banner={
          <p className="text-muted-foreground text-sm">
            Logistics wrapper only. Dispatching, arriving, or closing a shipment does not move
            stock or write a ledger entry.
          </p>
        }
        formTitle={isEdit ? "Edit shipment" : "Shipment"}
        panels={
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tracking progress</CardTitle>
              </CardHeader>
              <CardContent>
                <ShipmentTrackingStrip shipment={shipment} />
              </CardContent>
            </Card>
            <ShipmentDeliveryNotesPanel
              shipmentId={shipment.id}
              canEdit={shipment.status === "DRAFT"}
            />
            <RelatedDocumentsCard documents={shipment.related_documents} />
          </>
        }
        attachments={
          <EntityAttachmentsPanel
            entityType="SHIPMENT"
            entityId={shipment.id}
            parentPosted={shipment.status !== "DRAFT"}
            defaultCategory="LOADING_PHOTO"
          />
        }
        activity={<ActivityFeed entityType="shipment" entityId={shipment.id} revision={shipment.version} />}
      >
        <ShipmentForm
          shipment={shipment}
          disabled={!isEdit}
          onSuccess={() => router.push(viewHref)}
        />
      </DocumentRecordShell>
      <ShipmentTrackingDialog
        shipment={shipment}
        open={trackingOpen}
        onOpenChange={setTrackingOpen}
      />
      <ComposeFromBillsDialog
        open={landedCostOpen}
        onOpenChange={setLandedCostOpen}
        shipmentId={shipment.id}
      />
    </>
  );
}
