"use client";

import { Link2, Plus, Unlink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { LinkProductDialog } from "@/modules/erp/supplier-products/components/link-product-dialog";
import { SupplierProductFormDialog } from "@/modules/erp/supplier-products/components/supplier-product-form-dialog";
import {
  useDeleteSupplierProduct,
  useUnlinkSupplierProduct,
} from "@/modules/erp/supplier-products/mutations";
import { supplierProductPermissions } from "@/modules/erp/supplier-products/permissions";
import { useSupplierProducts } from "@/modules/erp/supplier-products/queries";
import type { SupplierProduct } from "@/modules/erp/supplier-products/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { emptyListMessage, useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { RecordLink } from "@/shared/components/data-table/record-link";
import {
  DataTableRowActions,
  hasRowActions,
  tableHeaders,
} from "@/shared/components/data-table/row-actions";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { ActiveBadge } from "@/shared/components/feedback/active-badge";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
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
import { formatMoney } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

const COLUMN_HEADERS = [
  "Supplier SKU",
  "Our SKU",
  "Item name",
  "Price",
  "Preferred",
  "Status",
] as const;

export function SupplierProductsPanel({ supplierId }: { supplierId: string }) {
  const can = useCan();
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(
    supplierProductPermissions,
  );
  const canLink = can(supplierProductPermissions.link);
  const [page, setPage] = useState(1);
  const catalogQuery = useSupplierProducts({ supplier_id: supplierId, page }, canRead);
  const deleteRow = useDeleteSupplierProduct();
  const unlinkRow = useUnlinkSupplierProduct();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierProduct | null>(null);
  const [forceReadOnly, setForceReadOnly] = useState(false);
  const [linking, setLinking] = useState<SupplierProduct | null>(null);
  const [deleting, setDeleting] = useState<SupplierProduct | null>(null);
  const [unlinking, setUnlinking] = useState<SupplierProduct | null>(null);
  const showActions = hasRowActions(canRead, canUpdate, canDelete, canLink);
  const headers = tableHeaders(COLUMN_HEADERS, showActions);
  const rows = catalogQuery.data?.data ?? [];
  const meta = catalogQuery.data?.meta;

  if (!canRead) {
    return null;
  }

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteRow.mutateAsync(deleting.id);
      toast.success("Catalog item deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function confirmUnlink() {
    if (!unlinking) {
      return;
    }
    try {
      await unlinkRow.mutateAsync(unlinking.id);
      toast.success("Product unlinked");
      setUnlinking(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">Supplier catalog</CardTitle>
        {canCreate ? (
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setEditing(null);
              setForceReadOnly(false);
              setFormOpen(true);
            }}
          >
            <Plus className="size-3.5" />
            New catalog item
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <DataTable
          footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}
        >
          <TableHeader>
            <TableRow>
              {headers.map((header) => (
                <TableHead key={header}>{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {catalogQuery.isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={headers.length}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : catalogQuery.isError ? (
              <TableRow>
                <TableCell colSpan={headers.length}>
                  <DataTableError
                    message={getErrorMessage(catalogQuery.error)}
                    onRetry={() => catalogQuery.refetch()}
                  />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={headers.length}>
                  <DataTableEmpty
                    title="No catalog items"
                    message={emptyListMessage(canCreate, "Add what this supplier sells.")}
                  />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-sm">{row.supplier_sku}</TableCell>
                  <TableCell>
                    {row.is_mapped && row.product_id ? (
                      <RecordLink href={`/products/${row.product_id}`}>
                        {row.product_sku ?? row.product_name ?? "—"}
                      </RecordLink>
                    ) : (
                      <Badge variant="warning">Unmapped</Badge>
                    )}
                  </TableCell>
                  <TableCell>{row.supplier_item_name}</TableCell>
                  <TableCell>
                    {row.price && row.currency_code
                      ? formatMoney(row.price, row.currency_code)
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {row.is_preferred ? <Badge variant="info">Preferred SKU</Badge> : null}
                      {row.is_preferred_supplier ? (
                        <Badge variant="info">Preferred supplier</Badge>
                      ) : null}
                      {!row.is_preferred && !row.is_preferred_supplier ? "—" : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <ActiveBadge active={row.is_active} />
                  </TableCell>
                  {showActions ? (
                    <TableCell>
                      <DataTableRowActions
                        entityName={row.supplier_sku}
                        onView={
                          canRead
                            ? () => {
                                setEditing(row);
                                setForceReadOnly(true);
                                setFormOpen(true);
                              }
                            : undefined
                        }
                        onEdit={
                          canUpdate
                            ? () => {
                                setEditing(row);
                                setForceReadOnly(false);
                                setFormOpen(true);
                              }
                            : undefined
                        }
                        onDelete={canDelete ? () => setDeleting(row) : undefined}
                        extra={
                          canLink ? (
                            row.is_mapped ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                aria-label={`Unlink ${row.supplier_sku}`}
                                onClick={() => setUnlinking(row)}
                              >
                                <Unlink className="size-3.5" />
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                aria-label={`Link ${row.supplier_sku}`}
                                onClick={() => setLinking(row)}
                              >
                                <Link2 className="size-3.5" />
                              </Button>
                            )
                          ) : null
                        }
                      />
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </DataTable>
      </CardContent>
      <SupplierProductFormDialog
        open={formOpen}
        supplierProduct={editing}
        defaultSupplierId={supplierId}
        lockSupplier
        forceReadOnly={forceReadOnly}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setEditing(null);
            setForceReadOnly(false);
          }
        }}
      />
      <LinkProductDialog
        open={Boolean(linking)}
        supplierProduct={linking}
        onOpenChange={(open) => {
          if (!open) {
            setLinking(null);
          }
        }}
      />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete catalog item"
        description={`Delete ${deleting ? `"${deleting.supplier_sku}"` : "this catalog item"}? This cannot be undone.`}
        confirmLabel="Delete"
        pending={deleteRow.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
      <ConfirmActionDialog
        open={Boolean(unlinking)}
        title="Unlink product"
        description={`Unlink ${unlinking ? `"${unlinking.supplier_sku}"` : "this catalog item"} from the mapped product?`}
        confirmLabel="Unlink"
        pending={unlinkRow.isPending}
        onOpenChange={(open) => !open && setUnlinking(null)}
        onConfirm={() => void confirmUnlink()}
      />
    </Card>
  );
}
