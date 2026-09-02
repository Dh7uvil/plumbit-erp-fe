"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { TaxFormDialog } from "@/modules/erp/accounting/taxes/components/tax-form-dialog";
import { taxPermissions } from "@/modules/erp/accounting/taxes/permissions";
import { useAllTaxes } from "@/modules/erp/accounting/taxes/queries";
import { CategoryFormDialog } from "@/modules/inventory-management/categories/components/category-form-dialog";
import { categoryPermissions } from "@/modules/inventory-management/categories/permissions";
import { useAllCategories } from "@/modules/inventory-management/categories/queries";
import {
  useCreateProduct,
  useUpdateProduct,
} from "@/modules/inventory-management/products/mutations";
import {
  ITEM_TYPE_LABELS,
  ITEM_TYPES,
  ProductFormSchema,
  type Product,
  type ProductCreateRequest,
  type ProductFormValues,
  type ProductUpdateRequest,
} from "@/modules/inventory-management/products/schemas";
import { useAllUnits } from "@/modules/inventory-management/units/queries";
import { UnitFormDialog } from "@/modules/inventory-management/units/components/unit-form-dialog";
import { unitPermissions } from "@/modules/inventory-management/units/permissions";
import { emptyToNull } from "@/modules/users-management/tenants/schemas";
import { getErrorMessage } from "@/shared/api/errors";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";
import { useCan } from "@/shared/providers/session-provider";

function optionalUuid(value: string): string | null {
  return !value || value === OPTIONAL_SELECT_NONE ? null : value;
}

function toFormValues(product: Product | null): ProductFormValues {
  return {
    sku: product?.sku ?? "",
    name: product?.name ?? "",
    item_type: product?.item_type ?? "PRODUCT",
    sales_description: product?.sales_description ?? "",
    unit_id: product?.unit_id ?? OPTIONAL_SELECT_NONE,
    category_id: product?.category_id ?? OPTIONAL_SELECT_NONE,
    selling_rate: product?.selling_rate ?? "0",
    tax_id: product?.tax_id ?? OPTIONAL_SELECT_NONE,
    hs_code: product?.hs_code ?? "",
    track_inventory: product?.track_inventory ?? false,
    is_active: product?.is_active ?? true,
  };
}

function toCreateRequest(values: ProductFormValues): ProductCreateRequest {
  return {
    sku: values.sku.trim(),
    name: values.name.trim(),
    item_type: values.item_type,
    sales_description: emptyToNull(values.sales_description),
    unit_id: optionalUuid(values.unit_id),
    category_id: optionalUuid(values.category_id),
    selling_rate: values.selling_rate.trim() || "0",
    tax_id: optionalUuid(values.tax_id),
    hs_code: emptyToNull(values.hs_code),
    track_inventory: values.track_inventory,
  };
}

function toUpdateRequest(values: ProductFormValues): ProductUpdateRequest {
  return {
    item_type: values.item_type,
    name: values.name.trim(),
    sales_description: emptyToNull(values.sales_description),
    unit_id: optionalUuid(values.unit_id),
    category_id: optionalUuid(values.category_id),
    selling_rate: values.selling_rate.trim() || "0",
    tax_id: optionalUuid(values.tax_id),
    hs_code: emptyToNull(values.hs_code),
    track_inventory: values.track_inventory,
    is_active: values.is_active,
  };
}

export function ProductForm({
  product,
  disabled = false,
  onSuccess,
  showCancel = false,
  onCancel,
}: {
  product: Product | null;
  disabled?: boolean;
  onSuccess?: (entity: Product) => void;
  showCancel?: boolean;
  onCancel?: () => void;
}) {
  const can = useCan();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const unitsQuery = useAllUnits();
  const categoriesQuery = useAllCategories();
  const taxesQuery = useAllTaxes();
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState<"unit" | "category" | "tax" | null>(null);
  const isEdit = Boolean(product);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(ProductFormSchema),
    values: toFormValues(product),
  });
  useDirtyFormGuard(form.formState.isDirty && !disabled);

  async function onSubmit(values: ProductFormValues) {
    setFormError(null);
    try {
      if (product) {
        await updateProduct.mutateAsync({ id: product.id, values: toUpdateRequest(values) });
        toast.success("Product updated");
        onSuccess?.(product);
      } else {
        const created = await createProduct.mutateAsync(toCreateRequest(values));
        toast.success("Product created");
        onSuccess?.(created);
      }
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createProduct.isPending || updateProduct.isPending;
  const units = unitsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const taxes = taxesQuery.data ?? [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
        {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU</FormLabel>
                <FormControl>
                  <Input
                    placeholder="SKU-001"
                    maxLength={80}
                    disabled={isEdit || disabled}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="item_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ITEM_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {ITEM_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  <Input
                    placeholder="Product name"
                    maxLength={200}
                    disabled={disabled}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sales_description"
            render={({ field }) => (
              <FormItem className="col-span-full">
                <FormLabel>Sales description</FormLabel>
                <FormControl>
                  <Textarea disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="unit_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled || unitsQuery.isLoading}
                  placeholder="None"
                  searchPlaceholder="Search unit…"
                  createLabel="Create unit"
                  onCreate={can(unitPermissions.create) ? () => setCreating("unit") : undefined}
                  options={[
                    { value: OPTIONAL_SELECT_NONE, label: "None" },
                    ...units.map((unit) => ({
                      value: unit.id,
                      label: unit.name,
                    })),
                  ]}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled || categoriesQuery.isLoading}
                  placeholder="None"
                  searchPlaceholder="Search category…"
                  createLabel="Create category"
                  onCreate={
                    can(categoryPermissions.create) ? () => setCreating("category") : undefined
                  }
                  options={[
                    { value: OPTIONAL_SELECT_NONE, label: "None" },
                    ...categories.map((category) => ({
                      value: category.id,
                      label: category.name,
                    })),
                  ]}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="selling_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Selling rate</FormLabel>
                <FormControl>
                  <Input inputMode="decimal" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="col-span-full grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="tax_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax</FormLabel>
                  <MasterSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={disabled || taxesQuery.isLoading}
                    placeholder="None"
                    searchPlaceholder="Search tax…"
                    createLabel="Create tax"
                    onCreate={can(taxPermissions.create) ? () => setCreating("tax") : undefined}
                    options={[
                      { value: OPTIONAL_SELECT_NONE, label: "None" },
                      ...taxes.map((tax) => ({
                        value: tax.id,
                        label: tax.name,
                      })),
                    ]}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hs_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>HS code</FormLabel>
                  <FormControl>
                    <Input maxLength={20} disabled={disabled} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="col-span-full flex flex-col gap-2">
            <FormField
              control={form.control}
              name="track_inventory"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      disabled={disabled}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                    />
                  </FormControl>
                  <FormLabel>Track inventory</FormLabel>
                </FormItem>
              )}
            />
            {isEdit ? (
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2 space-y-0">
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
                {isEdit ? "Save Changes" : "Create Product"}
              </Button>
            ) : null}
          </div>
        ) : null}
      </form>
      <UnitFormDialog
        open={creating === "unit"}
        nested
        onCreated={(entity) => form.setValue("unit_id", entity.id)}
        onOpenChange={(open) => setCreating(open ? "unit" : null)}
      />
      <CategoryFormDialog
        open={creating === "category"}
        category={null}
        nested
        onCreated={(entity) => form.setValue("category_id", entity.id)}
        onOpenChange={(open) => setCreating(open ? "category" : null)}
      />
      <TaxFormDialog
        open={creating === "tax"}
        tax={null}
        nested
        onCreated={(entity) => form.setValue("tax_id", entity.id)}
        onOpenChange={(open) => setCreating(open ? "tax" : null)}
      />
    </Form>
  );
}
