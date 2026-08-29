"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import {
  useCreateCategory,
  useUpdateCategory,
} from "@/modules/inventory-management/categories/mutations";
import { useAllCategories } from "@/modules/inventory-management/categories/queries";
import {
  CategoryFormSchema,
  type Category,
  type CategoryCreateRequest,
  type CategoryFormValues,
} from "@/modules/inventory-management/categories/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { applyFieldErrors } from "@/shared/lib/form-errors";

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

export function CategoryFormDialog({
  open,
  category,
  onOpenChange,
}: {
  open: boolean;
  category: Category | null;
  onOpenChange: (open: boolean) => void;
}) {
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const categoriesQuery = useAllCategories(open);
  const [formError, setFormError] = useState<string | null>(null);
  const isEdit = Boolean(category);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(CategoryFormSchema),
    values: toFormValues(category),
  });

  const parentOptions = (categoriesQuery.data ?? []).filter((item) => item.id !== category?.id);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setFormError(null);
    }
    onOpenChange(next);
  }

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
      } else {
        await createCategory.mutateAsync(toCreateRequest(values));
        toast.success("Category created");
      }
      handleOpenChange(false);
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createCategory.isPending || updateCategory.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Category" : "New Category"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
            {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input placeholder="PIPE" maxLength={50} disabled={isEdit} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Pipes" maxLength={150} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="parent_id"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Parent</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={categoriesQuery.isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={OPTIONAL_SELECT_NONE}>None</SelectItem>
                        {parentOptions.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {isEdit ? (
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0 sm:col-span-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => field.onChange(checked === true)}
                        />
                      </FormControl>
                      <FormLabel>Active</FormLabel>
                    </FormItem>
                  )}
                />
              ) : null}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                {isEdit ? "Save Changes" : "Create Category"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
