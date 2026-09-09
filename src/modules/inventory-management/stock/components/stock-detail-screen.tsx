"use client";

import Link from "next/link";
import { useState } from "react";

import { useProduct } from "@/modules/inventory-management/products/queries";
import { StockReorderDialog } from "@/modules/inventory-management/stock/components/stock-reorder-dialog";
import { stockPermissions } from "@/modules/inventory-management/stock/permissions";
import { useStock, useStockLayers, useStockMovements } from "@/modules/inventory-management/stock/queries";
import {
  qtyIsBelowReorder,
  qtyIsNegative,
  STOCK_MOVEMENT_TYPE_LABELS,
  stockMovementSourceHref,
  stockMovementSourceLabel,
  type StockBalance,
} from "@/modules/inventory-management/stock/schemas";
import { stockAdjustmentPermissions } from "@/modules/inventory-management/stock-adjustments/permissions";
import { stockTransferPermissions } from "@/modules/inventory-management/stock-transfers/permissions";
import { useCurrentTenant } from "@/modules/users-management/tenants/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { PageHeader } from "@/shared/components/layout/page-header";
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
import { useTableParams } from "@/shared/hooks/use-table-params";
import { formatDate, formatDateTime, formatDecimal, formatMoney } from "@/shared/lib/format";
import { cn } from "@/shared/lib/cn";
import { useCan } from "@/shared/providers/session-provider";

function qtyClass(value: string, emphasizeNegative = false) {
  return cn(
    "tabular-nums",
    emphasizeNegative && qtyIsNegative(value) && "text-destructive font-medium",
  );
}

function MovementSourceCell({ sourceType, sourceId }: { sourceType: string; sourceId: string }) {
  const href = stockMovementSourceHref(sourceType, sourceId);
  const label = stockMovementSourceLabel(sourceType);
  return href ? <RecordLink href={href}>{label}</RecordLink> : label;
}

function StockBalanceLayers({
  balance,
  currencyCode,
}: {
  balance: StockBalance;
  currencyCode: string;
}) {
  const layersQuery = useStockLayers(balance.id);
  const layers = layersQuery.data ?? [];

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">
        {balance.warehouse_code} — {balance.warehouse_name}
      </p>
      {layersQuery.isError ? (
        <DataTableError
          message={getErrorMessage(layersQuery.error)}
          onRetry={() => layersQuery.refetch()}
        />
      ) : layersQuery.isLoading ? (
        <Skeleton className="h-8 w-full" />
      ) : layers.length === 0 ? (
        <p className="text-muted-foreground text-sm">No remaining layers.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full caption-bottom text-sm">
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Received</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead className="text-right">Unit cost</TableHead>
                <TableHead className="text-right">Landed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {layers.map((layer) => (
                <TableRow key={layer.id}>
                  <TableCell>{formatDate(layer.document_date)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    <MovementSourceCell sourceType={layer.source_type} sourceId={layer.source_id} />
                    {layer.is_estimated ? (
                      <Badge variant="secondary" className="ml-2">
                        Estimated
                      </Badge>
                    ) : null}
                    {layer.is_negative ? (
                      <Badge variant="destructive" className="ml-2">
                        Negative
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatDecimal(layer.qty_received)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatDecimal(layer.qty_remaining)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(layer.unit_cost, currencyCode)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(layer.landed_unit_cost, currencyCode)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </table>
        </div>
      )}
    </div>
  );
}

export function StockDetailScreen({ productId }: { productId: string }) {
  const can = useCan();
  const { canUpdate } = useCrudPermissions(stockPermissions);
  const canReadCost = can(stockPermissions.costRead);
  const canAdjust = can(stockAdjustmentPermissions.create);
  const canTransfer = can(stockTransferPermissions.create);
  const tenantQuery = useCurrentTenant();
  const currencyCode = tenantQuery.data?.default_currency ?? "";
  const { page, page_size, setPage } = useTableParams();
  const productQuery = useProduct(productId);
  const balancesQuery = useStock({
    product_id: productId,
    page_size: 100,
    sort_by: "warehouse_code",
    sort_order: "asc",
  });
  const movementsQuery = useStockMovements({
    product_id: productId,
    page,
    page_size,
    sort_by: "occurred_at",
    sort_order: "desc",
  });
  const [reordering, setReordering] = useState<StockBalance | null>(null);
  const product = productQuery.data;
  const balances = balancesQuery.data?.data ?? [];
  const movements = movementsQuery.data?.data ?? [];
  const movementMeta = movementsQuery.data?.meta;

  if (productQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (productQuery.isError || !product) {
    return (
      <div className="flex flex-col gap-3">
        <DataTableError
          message={productQuery.error ? getErrorMessage(productQuery.error) : "Product not found"}
          onRetry={() => productQuery.refetch()}
        />
        <Button type="button" variant="outline" asChild>
          <Link href="/stock">Back to stock</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={product.name}
        code={product.sku}
        subtitle="Warehouse balances and movement ledger"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canAdjust ? (
              <Button type="button" size="sm" asChild>
                <Link href={`/stock-adjustments/new?product_id=${product.id}`}>Adjust</Link>
              </Button>
            ) : null}
            {canTransfer ? (
              <Button type="button" size="sm" variant="outline" asChild>
                <Link href={`/stock-transfers/new?product_id=${product.id}`}>Transfer</Link>
              </Button>
            ) : null}
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href="/stock">Back</Link>
            </Button>
          </div>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Warehouse stock</CardTitle>
        </CardHeader>
        <CardContent>
          {balancesQuery.isError ? (
            <DataTableError
              message={getErrorMessage(balancesQuery.error)}
              onRetry={() => balancesQuery.refetch()}
            />
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full caption-bottom text-sm">
                <TableHeader>
                  <TableRow>
                    <TableHead>Warehouse</TableHead>
                    <TableHead className="text-right">On hand</TableHead>
                    <TableHead className="text-right">QC hold</TableHead>
                    <TableHead className="text-right">Committed</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                    <TableHead className="text-right">Incoming</TableHead>
                    <TableHead className="text-right">Outgoing</TableHead>
                    <TableHead className="text-right">In transit</TableHead>
                    {canReadCost ? (
                      <>
                        <TableHead className="text-right">Unit cost</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                      </>
                    ) : null}
                    <TableHead className="text-right">Reorder</TableHead>
                    {canUpdate ? <TableHead /> : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balancesQuery.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={9 + (canReadCost ? 2 : 0) + (canUpdate ? 1 : 0)}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ) : balances.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9 + (canReadCost ? 2 : 0) + (canUpdate ? 1 : 0)}
                        className="text-muted-foreground"
                      >
                        No warehouse balances yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    balances.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          {row.warehouse_code} — {row.warehouse_name}
                          {qtyIsBelowReorder(row.qty_available, row.reorder_level) ? (
                            <Badge variant="warning" className="ml-2">
                              Below reorder
                            </Badge>
                          ) : null}
                        </TableCell>
                        <TableCell className={cn("text-right", qtyClass(row.qty_on_hand, true))}>
                          {formatDecimal(row.qty_on_hand)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatDecimal(row.qty_quality_hold)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatDecimal(row.qty_reserved)}
                        </TableCell>
                        <TableCell className={cn("text-right", qtyClass(row.qty_available, true))}>
                          {formatDecimal(row.qty_available)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatDecimal(row.qty_incoming)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatDecimal(row.qty_outgoing)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatDecimal(row.qty_in_transit)}
                        </TableCell>
                        {canReadCost ? (
                          <>
                            <TableCell className="text-right tabular-nums">
                              {formatMoney(row.unit_cost, currencyCode)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatMoney(row.stock_value, currencyCode)}
                            </TableCell>
                          </>
                        ) : null}
                        <TableCell className="text-right tabular-nums">
                          {formatDecimal(row.reorder_level)}
                          {row.reorder_qty ? ` / ${formatDecimal(row.reorder_qty)}` : ""}
                        </TableCell>
                        {canUpdate ? (
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setReordering(row)}
                            >
                              Reorder
                            </Button>
                          </TableCell>
                        ) : null}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      {canReadCost && balances.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cost layers</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {balances.map((balance) => (
              <StockBalanceLayers
                key={balance.id}
                balance={balance}
                currencyCode={currencyCode}
              />
            ))}
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Movements</CardTitle>
        </CardHeader>
        <CardContent>
          {movementsQuery.isError ? (
            <DataTableError
              message={getErrorMessage(movementsQuery.error)}
              onRetry={() => movementsQuery.refetch()}
            />
          ) : (
            <DataTable
              footer={
                movementMeta ? (
                  <DataTablePagination meta={movementMeta} onPageChange={setPage} />
                ) : null
              }
            >
              <TableHeader>
                <TableRow>
                  <TableHead>Occurred</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Before</TableHead>
                  <TableHead className="text-right">After</TableHead>
                  {canReadCost ? (
                    <>
                      <TableHead className="text-right">Unit cost</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                    </>
                  ) : null}
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movementsQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8 + (canReadCost ? 2 : 0)}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ) : movements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8 + (canReadCost ? 2 : 0)}>
                      <DataTableEmpty
                        title="No movements"
                        message="No stock has moved for this product yet."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  movements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>{formatDateTime(movement.occurred_at)}</TableCell>
                      <TableCell>{formatDate(movement.document_date)}</TableCell>
                      <TableCell>{movement.warehouse_code}</TableCell>
                      <TableCell>{STOCK_MOVEMENT_TYPE_LABELS[movement.movement_type]}</TableCell>
                      <TableCell className={cn("text-right", qtyClass(movement.qty, true))}>
                        {formatDecimal(movement.qty)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatDecimal(movement.qty_before)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatDecimal(movement.qty_after)}
                      </TableCell>
                      {canReadCost ? (
                        <>
                          <TableCell className="text-right tabular-nums">
                            {formatMoney(movement.unit_cost, currencyCode)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatMoney(movement.value, currencyCode)}
                          </TableCell>
                        </>
                      ) : null}
                      <TableCell className="text-muted-foreground text-sm">
                        <MovementSourceCell
                          sourceType={movement.source_type}
                          sourceId={movement.source_id}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </DataTable>
          )}
        </CardContent>
      </Card>
      <StockReorderDialog
        balance={reordering}
        open={Boolean(reordering)}
        onOpenChange={(open) => {
          if (!open) {
            setReordering(null);
          }
        }}
      />
    </div>
  );
}
