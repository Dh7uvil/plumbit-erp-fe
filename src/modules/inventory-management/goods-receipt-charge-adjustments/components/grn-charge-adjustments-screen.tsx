"use client";

import { Plus } from "lucide-react";
import Link from "next/link";

import { grnChargeAdjustmentPermissions } from "@/modules/inventory-management/goods-receipt-charge-adjustments/permissions";
import { useGrnChargeAdjustments } from "@/modules/inventory-management/goods-receipt-charge-adjustments/queries";
import {
  STOCK_DOCUMENT_STATUS_LABELS,
  STOCK_DOCUMENT_STATUS_VARIANTS,
  grnChargeAdjustmentDisplayNumber,
} from "@/modules/inventory-management/goods-receipt-charge-adjustments/schemas";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { formatDate } from "@/shared/lib/format";

export function GrnChargeAdjustmentsScreen() {
  const permissions = useCrudPermissions(grnChargeAdjustmentPermissions);
  const { data, isLoading, isError, refetch } = useGrnChargeAdjustments();

  return (
    <ListPage>
      <PageHeader
        title="GRN charge adjustments"
        description="Adjust inventoriable import charges on posted goods receipts."
        actions={
          permissions.canCreate ? (
            <Button asChild>
              <Link href="/goods-receipt-charge-adjustments/new">
                <Plus className="mr-2 h-4 w-4" />
                New adjustment
              </Link>
            </Button>
          ) : null
        }
      />
      <DataTable>
        <TableHeader>
          <TableRow>
            <TableHead>Number</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Goods receipt</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                {Array.from({ length: 4 }).map((__, cellIndex) => (
                  <TableCell key={cellIndex}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : isError ? (
            <DataTableError colSpan={4} onRetry={() => void refetch()} />
          ) : !data?.data.length ? (
            <DataTableEmpty colSpan={4} message="No GRN charge adjustments yet." />
          ) : (
            data.data.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Link
                    href={`/goods-receipt-charge-adjustments/${row.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {grnChargeAdjustmentDisplayNumber(row) ?? row.id.slice(0, 8)}
                  </Link>
                </TableCell>
                <TableCell>{formatDate(row.document_date)}</TableCell>
                <TableCell>
                  <DocumentStatusBadge
                    label={STOCK_DOCUMENT_STATUS_LABELS[row.status]}
                    variant={STOCK_DOCUMENT_STATUS_VARIANTS[row.status]}
                  />
                </TableCell>
                <TableCell>
                  <Link
                    href={`/goods-receipts/${row.goods_receipt_id}`}
                    className="text-primary hover:underline"
                  >
                    View GRN
                  </Link>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
    </ListPage>
  );
}
