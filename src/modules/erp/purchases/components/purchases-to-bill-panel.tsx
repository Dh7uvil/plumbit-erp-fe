"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { CreateBillFromGoodsReceiptDialog } from "@/modules/erp/purchase-invoices/components/create-from-goods-receipt-dialog";
import { CreateBillFromPurchaseOrderDialog } from "@/modules/erp/purchase-invoices/components/create-from-purchase-order-dialog";
import {
  useGoodsReceiptBillingQueue,
  usePurchaseOrderBillingQueue,
} from "@/modules/erp/purchases/queries";
import { useAllSuppliers } from "@/modules/erp/suppliers/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { useNestedTableParams } from "@/shared/hooks/use-table-params";
import { formatDate, formatQuantity } from "@/shared/lib/format";

function outstandingLineCount(lines: { qty_remaining: string }[]): number {
  return lines.filter((line) => Number(line.qty_remaining) > 0).length;
}

function outstandingQuantity(lines: { qty_remaining: string }[]): string {
  const total = lines.reduce((sum, line) => sum + Number(line.qty_remaining), 0);
  return Number.isFinite(total) ? formatQuantity(String(total)) : "0";
}

export function PurchasesToBillPanel() {
  const { page, page_size, setPage } = useNestedTableParams();
  const poQueueQuery = usePurchaseOrderBillingQueue({ page, page_size });
  const grnQueueQuery = useGoodsReceiptBillingQueue({ page, page_size });
  const suppliersQuery = useAllSuppliers();
  const supplierNameById = useMemo(
    () => new Map((suppliersQuery.data ?? []).map((supplier) => [supplier.id, supplier.name])),
    [suppliersQuery.data],
  );
  const [billFromPoId, setBillFromPoId] = useState<string | undefined>();
  const [billFromGrnId, setBillFromGrnId] = useState<string | undefined>();

  const poRows = poQueueQuery.data?.data ?? [];
  const grnRows = grnQueueQuery.data?.data ?? [];
  const isLoading = poQueueQuery.isLoading || grnQueueQuery.isLoading;
  const isError = poQueueQuery.isError || grnQueueQuery.isError;
  const error = poQueueQuery.error ?? grnQueueQuery.error;
  const meta = poQueueQuery.data?.meta ?? grnQueueQuery.data?.meta;
  const isEmpty = !isLoading && !isError && poRows.length === 0 && grnRows.length === 0;

  return (
    <div className="flex flex-col gap-6">
      {isError ? (
        <DataTableError
          message={getErrorMessage(error)}
          onRetry={() => {
            void poQueueQuery.refetch();
            void grnQueueQuery.refetch();
          }}
        />
      ) : null}
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Purchase orders</h3>
        <DataTable
          footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}
        >
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Qty to bill</TableHead>
              <TableHead className="text-right">Lines</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : poRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground text-sm">
                  No purchase orders waiting to bill.
                </TableCell>
              </TableRow>
            ) : (
              poRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-sm">
                    <RecordLink href={`/purchase-orders/${row.id}`}>
                      {row.document_number}
                    </RecordLink>
                  </TableCell>
                  <TableCell>{supplierNameById.get(row.supplier_id) ?? "—"}</TableCell>
                  <TableCell>{formatDate(row.order_date)}</TableCell>
                  <TableCell>{row.status}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {outstandingQuantity(row.lines)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {outstandingLineCount(row.lines)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setBillFromPoId(row.id)}
                    >
                      Create bill
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </DataTable>
      </section>
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Goods receipts</h3>
        <DataTable>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Purchase order</TableHead>
              <TableHead className="text-right">Qty to bill</TableHead>
              <TableHead className="text-right">Lines</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={`grn-${index}`}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : grnRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground text-sm">
                  No goods receipts waiting to bill.
                </TableCell>
              </TableRow>
            ) : (
              grnRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-sm">
                    <RecordLink href={`/goods-receipts/${row.id}`}>
                      {row.document_number}
                    </RecordLink>
                  </TableCell>
                  <TableCell>{supplierNameById.get(row.supplier_id) ?? "—"}</TableCell>
                  <TableCell>{formatDate(row.document_date)}</TableCell>
                  <TableCell>
                    {row.purchase_order_id ? (
                      <Link
                        href={`/purchase-orders/${row.purchase_order_id}`}
                        className="underline-offset-4 hover:underline"
                      >
                        View PO
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {outstandingQuantity(row.lines)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {outstandingLineCount(row.lines)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setBillFromGrnId(row.id)}
                    >
                      Create bill
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </DataTable>
      </section>
      {isEmpty ? (
        <DataTableEmpty
          title="Nothing to bill"
          message="Issued purchase orders and posted goods receipts with outstanding quantity appear here."
        />
      ) : null}
      <CreateBillFromPurchaseOrderDialog
        open={Boolean(billFromPoId)}
        onOpenChange={(open) => {
          if (!open) {
            setBillFromPoId(undefined);
          }
        }}
        purchaseOrderId={billFromPoId}
      />
      <CreateBillFromGoodsReceiptDialog
        open={Boolean(billFromGrnId)}
        onOpenChange={(open) => {
          if (!open) {
            setBillFromGrnId(undefined);
          }
        }}
        goodsReceiptId={billFromGrnId}
      />
    </div>
  );
}
