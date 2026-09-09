"use client";

import { Plus, Unlink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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

const COLUMN_HEADERS = ["Supplier", "Supplier SKU", "Price", "Currency", "Preferred"] as const;

export function ProductSuppliersPanel({ productId }: { productId: string }) {
  const can = useCan();
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(
    supplierProductPermissions,
  );
  const canLink = can(supplierProductPermissions.link);
  const [page, setPage] = useState(1);
  const catalogQuery = useSupplierProducts({ product_id: productId, page }, canRead);
  const deleteRow = useDeleteSupplierProduct();
  const unlinkRow = useUnlinkSupplierProduct();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierProduct | null>(null);
  const [forceReadOnly, setForceReadOnly] = useState(false);
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
      toast.success("Supplier unlinked");
      setUnlinking(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">Suppliers</CardTitle>
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
            Add supplier for this product
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
                    title="No suppliers"
                    message={emptyListMessage(canCreate, "Add a supplier for this product.")}
                  />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    <RecordLink href={`/suppliers/${row.supplier_id}`}>
                      {row.supplier_name ?? "—"}
                    </RecordLink>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{row.supplier_sku}</TableCell>
                  <TableCell>
                    {row.price && row.currency_code
                      ? formatMoney(row.price, row.currency_code)
                      : "—"}
                  </TableCell>
                  <TableCell>{row.currency_code ?? "—"}</TableCell>
                  <TableCell>
                    {row.is_preferred_supplier ? (
                      <Badge variant="info">Preferred supplier</Badge>
                    ) : (
                      "—"
                    )}
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
        defaultProductId={productId}
        lockProduct
        forceReadOnly={forceReadOnly}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setEditing(null);
            setForceReadOnly(false);
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
        title="Unlink supplier"
        description={`Unlink ${unlinking ? `"${unlinking.supplier_sku}"` : "this catalog item"} from this product?`}
        confirmLabel="Unlink"
        pending={unlinkRow.isPending}
        onOpenChange={(open) => !open && setUnlinking(null)}
        onConfirm={() => void confirmUnlink()}
      />
    </Card>
  );
}
