"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ProductFormDialog } from "@/modules/inventory-management/products/components/product-form-dialog";
import { ProductInventoryWorkbench } from "@/modules/inventory-management/products/components/product-inventory-workbench";
import { useDeleteProduct } from "@/modules/inventory-management/products/mutations";
import { productPermissions } from "@/modules/inventory-management/products/permissions";
import { productKeys, useProduct } from "@/modules/inventory-management/products/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { ImexToolbar } from "@/shared/components/imex/imex-toolbar";
import { Button } from "@/shared/components/ui/button";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { useCan } from "@/shared/providers/session-provider";

export function ProductsScreen() {
  const can = useCan();
  const { canCreate, canUpdate, canDelete, canRead } = useCrudPermissions(productPermissions);
  const queryClient = useQueryClient();
  const { search, filters } = useTableParams();
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const deleteProduct = useDeleteProduct();
  const editingQuery = useProduct(editingId);
  const deletingQuery = useProduct(deletingId);

  async function confirmDelete() {
    if (!deletingId) {
      return;
    }
    try {
      await deleteProduct.mutateAsync(deletingId);
      toast.success("Product deleted");
      setDeletingId(null);
      void queryClient.invalidateQueries({ queryKey: productKeys.all });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <>
      <ProductInventoryWorkbench
        title="Products"
        subtitle="Lookup items, pricing, and trading history for sales."
        trackedOnly={false}
        headerActions={
          <div className="flex flex-wrap items-center gap-2">
            <ImexToolbar
              resource="products"
              title="products"
              canImport={can(productPermissions.import) || canCreate}
              canExport={can(productPermissions.export) || canRead}
              exportParams={{
                search,
                category_id: filters.category_id,
              }}
              onImported={() => {
                void queryClient.invalidateQueries({ queryKey: productKeys.all });
              }}
            />
            {canCreate ? (
              <Button type="button" size="sm" onClick={() => setFormOpen(true)}>
                <Plus className="size-3.5" />
                New product
              </Button>
            ) : null}
          </div>
        }
        detailActions={(productId) => (
          <>
            {canUpdate ? (
              <Button type="button" size="sm" variant="outline" onClick={() => setEditingId(productId)}>
                <Pencil className="size-3.5" />
                Edit
              </Button>
            ) : null}
            {canDelete ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => setDeletingId(productId)}
              >
                <Trash2 className="size-3.5" />
                Delete
              </Button>
            ) : null}
          </>
        )}
      />

      <ProductFormDialog open={formOpen} product={null} onOpenChange={setFormOpen} />
      <ProductFormDialog
        open={Boolean(editingId)}
        product={editingQuery.data ?? null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingId(null);
          }
        }}
      />
      <ConfirmActionDialog
        open={Boolean(deletingId)}
        title="Delete product"
        description={
          deletingQuery.data
            ? `Delete "${deletingQuery.data.name}"? This cannot be undone.`
            : "Delete this product? This cannot be undone."
        }
        confirmLabel="Delete"
        pending={deleteProduct.isPending}
        onOpenChange={(open) => !open && setDeletingId(null)}
        onConfirm={() => void confirmDelete()}
      />
    </>
  );
}
