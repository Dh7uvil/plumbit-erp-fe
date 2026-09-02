"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { CategoryFormDialog } from "@/modules/inventory-management/categories/components/category-form-dialog";
import {
  useCreateCategory,
  useUpdateCategory,
} from "@/modules/inventory-management/categories/mutations";
import { categoryPermissions } from "@/modules/inventory-management/categories/permissions";
import { useAllCategories } from "@/modules/inventory-management/categories/queries";
import {
  CategoryFormSchema,
  type Category,
  type CategoryCreateRequest,
  type CategoryFormValues,
} from "@/modules/inventory-management/categories/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { MasterSelect } from "@/shared/components/form/master-select";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";

function toFormValues(category: Category | null): CategoryFormValues {
  return {
    name: category?.name ?? "",
    code: category?.code ?? "",
    parent_id: category?.parent_id ?? OPTIONAL_SELECT_NONE,
    is_active: category?.is_active ?? true,
  };
}

function optionalParentId(value: string): string | null {
  return !value || value === OPTIONAL_SELECT_NONE ? null : value;
}

function toCreateRequest(values: CategoryFormValues): CategoryCreateRequest {
  return {
    name: values.name.trim(),
    code: values.code.trim(),
    parent_id: optionalParentId(values.parent_id),
  };
}

export function CategoryForm({
  category,
  disabled = false,
  nested = false,
  onSuccess,
  showCancel = false,
  onCancel,
}: {
  category: Category | null;
  disabled?: boolean;
  nested?: boolean;
  onSuccess?: (entity: { id: string }) => void;
  showCancel?: boolean;
  onCancel?: () => void;
}) {
  const { canCreate } = useCrudPermissions(categoryPermissions);
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const categoriesQuery = useAllCategories();
  const [formError, setFormError] = useState<string | null>(null);
  const [creatingParent, setCreatingParent] = useState(false);
  const isEdit = Boolean(category);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(CategoryFormSchema),
    values: toFormValues(category),
  });
  useDirtyFormGuard(form.formState.isDirty && !disabled);

  const parentOptions = (categoriesQuery.data ?? []).filter((item) => item.id !== category?.id);

  async function onSubmit(values: CategoryFormValues) {
    setFormError(null);
    try {
      if (category) {
        await updateCategory.mutateAsync({
          id: category.id,
          values: {
            name: values.name.trim(),
            parent_id: optionalParentId(values.parent_id),
            is_active: values.is_active,
          },
        });
        toast.success("Category updated");
        onSuccess?.(category);
      } else {
        const created = await createCategory.mutateAsync(toCreateRequest(values));
        toast.success("Category created");
        onSuccess?.(created);
      }
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createCategory.isPending || updateCategory.isPending;

  return (
    <Form {...form}>
      <form
        onSubmit={disabled ? (event) => event.preventDefault() : form.handleSubmit(onSubmit)}
        className="flex flex-col gap-3"
      >
        {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
        <div
          className={
            isEdit
              ? "grid grid-cols-1 gap-3 sm:grid-cols-2"
              : "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
          }
        >
          {!isEdit ? (
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input placeholder="PIPE" maxLength={50} disabled={disabled} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Pipes" maxLength={150} disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="parent_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parent</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={categoriesQuery.isLoading || disabled}
                  placeholder="None"
                  searchPlaceholder="Search category…"
                  createLabel="Create category"
                  onCreate={
                    canCreate && !nested && !disabled ? () => setCreatingParent(true) : undefined
                  }
                  options={[
                    { value: OPTIONAL_SELECT_NONE, label: "None" },
                    ...parentOptions.map((item) => ({
                      value: item.id,
                      label: item.name,
                    })),
                  ]}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          {isEdit ? (
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="col-span-full flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      disabled={disabled}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                    />
                  </FormControl>
                  <FormLabel>Active</FormLabel>
                </FormItem>
              )}
            />
          ) : null}
        </div>
        {showCancel || !disabled ? (
          <div className="flex justify-end gap-2">
            {showCancel ? (
              <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
                {disabled ? "Close" : "Cancel"}
              </Button>
            ) : null}
            {!disabled ? (
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                {isEdit ? "Save Changes" : "Create Category"}
              </Button>
            ) : null}
          </div>
        ) : null}
      </form>
      {creatingParent ? (
        <CategoryFormDialog
          open={creatingParent}
          nested
          onCreated={(entity) => form.setValue("parent_id", entity.id)}
          onOpenChange={setCreatingParent}
        />
      ) : null}
    </Form>
  );
}
