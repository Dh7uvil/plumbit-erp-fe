"use client";

import Link from "next/link";
import { useState } from "react";

import { CreatePurchaseOrdersDialog } from "@/modules/erp/sales-orders/components/create-purchase-orders-dialog";
import { purchaseOrderPermissions } from "@/modules/erp/purchase-orders/permissions";
import { useSalesOrderCoverage } from "@/modules/erp/sales-orders/queries";
import {
  hasReservationShortfall,
  isQtyUncovered,
  type SalesOrder,
} from "@/modules/erp/sales-orders/schemas";
import { deliveryNotePermissions } from "@/modules/inventory-management/delivery-notes/permissions";
import { packagePermissions } from "@/modules/inventory-management/packages/permissions";
import { DataTable } from "@/shared/components/data-table/data-table";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { formatDecimal } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

export function SalesOrderCoverageCard({ salesOrder }: { salesOrder: SalesOrder }) {
  const can = useCan();
  const coverageQuery = useSalesOrderCoverage(salesOrder.id, salesOrder.status === "CONFIRMED");
  const [createOpen, setCreateOpen] = useState(false);
  const lines = coverageQuery.data?.lines ?? [];
  const shortfalls = salesOrder.reservation_shortfalls.filter((row) =>
    hasReservationShortfall(row.shortfall),
  );

  if (salesOrder.status !== "CONFIRMED") {
    return null;
  }

  return (
    <>
      {shortfalls.length > 0 ? (
        <Alert>
          <AlertTitle>Stock shortfall</AlertTitle>
          <AlertDescription>
            Confirmation reserved what was available.{" "}
            {shortfalls
              .map((row) => `${formatDecimal(row.shortfall)} short of ${formatDecimal(row.requested)}`)
              .join("; ")}
            . This did not block the order.
          </AlertDescription>
        </Alert>
      ) : null}
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Purchase coverage</CardTitle>
          <div className="flex flex-wrap gap-2">
            {can(deliveryNotePermissions.create) ? (
              <Button type="button" size="sm" variant="outline" asChild>
                <Link href={`/delivery-notes/new?sales_order_id=${salesOrder.id}`}>
                  Create delivery note
                </Link>
              </Button>
            ) : null}
            {can(packagePermissions.create) ? (
              <Button type="button" size="sm" variant="outline" asChild>
                <Link href={`/packages/new?sales_order_id=${salesOrder.id}`}>Create package</Link>
              </Button>
            ) : null}
            {can(purchaseOrderPermissions.create) ? (
              <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
                Create purchase orders
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          <DataTable>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Ordered</TableHead>
                <TableHead className="text-right">Committed</TableHead>
                <TableHead className="text-right">Delivered</TableHead>
                <TableHead className="text-right">Returned</TableHead>
                <TableHead className="text-right">Covered</TableHead>
                <TableHead className="text-right">Uncovered</TableHead>
                <TableHead className="text-right">Received</TableHead>
                <TableHead>Purchase orders</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coverageQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={9}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ) : lines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-muted-foreground">
                    No coverage yet.
                  </TableCell>
                </TableRow>
              ) : (
                lines.map((line) => (
                  <TableRow key={line.sales_order_line_id}>
                    <TableCell>{line.description || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatDecimal(line.quantity)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatDecimal(line.qty_reserved)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatDecimal(line.qty_delivered)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatDecimal(line.qty_returned)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatDecimal(line.qty_covered)}
                    </TableCell>
                    <TableCell className="text-right">
                      {isQtyUncovered(line.qty_uncovered) ? (
                        <Badge variant="warning">{formatDecimal(line.qty_uncovered)}</Badge>
                      ) : (
                        <span className="tabular-nums">{formatDecimal(line.qty_uncovered)}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatDecimal(line.qty_received)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {line.purchase_orders.map((order) => (
                          <Badge key={order.id} variant="outline" asChild>
                            <Link href={`/purchase-orders/${order.id}`}>{order.document_number}</Link>
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </DataTable>
        </CardContent>
      </Card>
      <CreatePurchaseOrdersDialog
        salesOrder={salesOrder}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </>
  );
}
