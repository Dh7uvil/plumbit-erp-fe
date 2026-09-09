"use client";

import Link from "next/link";
import { useState } from "react";

import { CreatePurchaseOrdersDialog } from "@/modules/erp/sales-orders/components/create-purchase-orders-dialog";
import { purchaseOrderPermissions } from "@/modules/erp/purchase-orders/permissions";
import { useSalesOrderCoverage } from "@/modules/erp/sales-orders/queries";
import { isQtyUncovered, type SalesOrder } from "@/modules/erp/sales-orders/schemas";
import { DataTable } from "@/shared/components/data-table/data-table";
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

  if (salesOrder.status !== "CONFIRMED") {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">Purchase coverage</CardTitle>
          {can(purchaseOrderPermissions.create) ? (
            <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
              Create purchase orders
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          <DataTable>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Ordered</TableHead>
                <TableHead className="text-right">Covered</TableHead>
                <TableHead className="text-right">Uncovered</TableHead>
                <TableHead className="text-right">Received</TableHead>
                <TableHead>Purchase orders</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coverageQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ) : lines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">
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
