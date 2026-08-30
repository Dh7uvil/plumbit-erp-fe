"use client";

import { CategoryForm } from "@/modules/inventory-management/categories/components/category-form";
import { categoryPermissions } from "@/modules/inventory-management/categories/permissions";
import type { Category } from "@/modules/inventory-management/categories/schemas";
import {
  formDialogTitle,
  resolveFormDialogMode,
  useCrudPermissions,
} from "@/shared/auth/use-crud-permissions";
import { FormDialogHeader } from "@/shared/components/form/form-dialog-header";
import { Dialog, DialogContent } from "@/shared/components/ui/dialog";

export function CategoryFormDialog({
  open,
  onOpenChange,
  onCreated,
  nested = false,
}: {
  open: boolean;
  category?: Category | null;
  onOpenChange: (open: boolean) => void;
  onCreated?: (entity: { id: string }) => void;
  nested?: boolean;
  forceReadOnly?: boolean;
}) {
  const { canCreate } = useCrudPermissions(categoryPermissions);
  const { mode, readOnly } = resolveFormDialogMode({
    hasRecord: false,
    canCreate,
    canUpdate: false,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent nested={nested} className="sm:max-w-lg">
        <FormDialogHeader title={formDialogTitle("Category", mode)} entity="Category" />
        <CategoryForm
          category={null}
          nested={nested}
          disabled={readOnly}
          showCancel
          onCancel={() => onOpenChange(false)}
          onSuccess={(entity) => {
            onCreated?.(entity);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
