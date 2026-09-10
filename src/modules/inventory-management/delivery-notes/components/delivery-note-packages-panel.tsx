"use client";

import Link from "next/link";
import { toast } from "sonner";

import {
  useAttachPackageToDeliveryNote,
  useDetachPackageFromDeliveryNote,
} from "@/modules/inventory-management/delivery-notes/mutations";
import { packagePermissions } from "@/modules/inventory-management/packages/permissions";
import { usePackages } from "@/modules/inventory-management/packages/queries";
import {
  PACKAGE_STATUS_LABELS,
  PACKAGE_STATUS_VARIANTS,
  packageDisplayNumber,
} from "@/modules/inventory-management/packages/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { useCan } from "@/shared/providers/session-provider";

export function DeliveryNotePackagesPanel({
  noteId,
  salesOrderId,
  canEdit,
}: {
  noteId: string;
  salesOrderId: string;
  canEdit: boolean;
}) {
  const can = useCan();
  const canRead = can(packagePermissions.read);
  const packagesQuery = usePackages({ sales_order_id: salesOrderId, page_size: 100 }, canRead);
  const attach = useAttachPackageToDeliveryNote();
  const detach = useDetachPackageFromDeliveryNote();
  const rows = packagesQuery.data?.data ?? [];
  const attached = rows.filter((row) => row.delivery_note_id === noteId);
  const available = rows.filter((row) => !row.delivery_note_id && row.status !== "CANCELLED");

  if (!canRead) {
    return null;
  }

  async function onAttach(packageId: string) {
    try {
      await attach.mutateAsync({ noteId, packageId });
      toast.success("Package attached");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function onDetach(packageId: string) {
    try {
      await detach.mutateAsync({ noteId, packageId });
      toast.success("Package detached");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">Packages</CardTitle>
        {can(packagePermissions.create) ? (
          <Button type="button" size="sm" variant="outline" asChild>
            <Link href={`/packages/new?sales_order_id=${salesOrderId}&delivery_note_id=${noteId}`}>
              New package
            </Link>
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div>
          <p className="mb-1 text-sm font-medium">Attached</p>
          {attached.length === 0 ? (
            <p className="text-muted-foreground text-sm">No packages on this note.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {attached.map((pkg) => (
                <li key={pkg.id} className="flex flex-wrap items-center gap-2 text-sm">
                  <RecordLink href={`/packages/${pkg.id}`}>
                    {packageDisplayNumber(pkg) ?? "Package"}
                  </RecordLink>
                  <DocumentStatusBadge
                    status={pkg.status}
                    labels={PACKAGE_STATUS_LABELS}
                    variants={PACKAGE_STATUS_VARIANTS}
                  />
                  {canEdit ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => void onDetach(pkg.id)}
                      disabled={detach.isPending}
                    >
                      Detach
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
        {canEdit && available.length > 0 ? (
          <div>
            <p className="mb-1 text-sm font-medium">Available to attach</p>
            <ul className="flex flex-col gap-2">
              {available.map((pkg) => (
                <li key={pkg.id} className="flex flex-wrap items-center gap-2 text-sm">
                  <RecordLink href={`/packages/${pkg.id}`}>
                    {packageDisplayNumber(pkg) ?? "Package"}
                  </RecordLink>
                  <DocumentStatusBadge
                    status={pkg.status}
                    labels={PACKAGE_STATUS_LABELS}
                    variants={PACKAGE_STATUS_VARIANTS}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void onAttach(pkg.id)}
                    disabled={attach.isPending}
                  >
                    Attach
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
