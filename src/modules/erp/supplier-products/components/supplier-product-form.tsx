"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { CurrencyFormDialog } from "@/modules/erp/currencies/components/currency-form-dialog";
import { currencyPermissions } from "@/modules/erp/currencies/permissions";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { SupplierFormDialog } from "@/modules/erp/suppliers/components/supplier-form-dialog";
import { supplierPermissions } from "@/modules/erp/suppliers/permissions";
import { useAllSuppliers } from "@/modules/erp/suppliers/queries";
import {
  useCreateSupplierProduct,
  useUpdateSupplierProduct,
} from "@/modules/erp/supplier-products/mutations";
import {
  SupplierProductFormSchema,
  type SupplierProduct,
  type SupplierProductFormValues,
} from "@/modules/erp/supplier-products/schemas";
import { ProductFormDialog } from "@/modules/inventory-management/products/components/product-form-dialog";
import { productPermissions } from "@/modules/inventory-management/products/permissions";
import { useAllProducts } from "@/modules/inventory-management/products/queries";
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
import { Textarea } from "@/shared/components/ui/textarea";
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";
import { useCan } from "@/shared/providers/session-provider";

function toFormValues(
  row: SupplierProduct | null,
  defaults?: { supplierId?: string; productId?: string },
): SupplierProductFormValues {
  return {
    supplier_id: row?.supplier_id ?? defaults?.supplierId ?? OPTIONAL_SELECT_NONE,
    product_id: row?.product_id ?? defaults?.productId ?? OPTIONAL_SELECT_NONE,
    supplier_sku: row?.supplier_sku ?? "",
    supplier_item_name: row?.supplier_item_name ?? "",
    supplier_description: row?.supplier_description ?? "",
    price: row?.price ?? "",
    currency_id: row?.currency_id ?? OPTIONAL_SELECT_NONE,
    is_preferred: row?.is_preferred ?? false,
    is_preferred_supplier: row?.is_preferred_supplier ?? false,
    notes: row?.notes ?? "",
    is_active: row?.is_active ?? true,
  };
}

export function SupplierProductForm({
  supplierProduct,
  defaultSupplierId,
  defaultProductId,
  lockSupplier = false,
  lockProduct = false,
  disabled = false,
  onSuccess,
  showCancel = false,
  onCancel,
}: {
  supplierProduct: SupplierProduct | null;
  defaultSupplierId?: string;
  defaultProductId?: string;
  lockSupplier?: boolean;
  lockProduct?: boolean;
  disabled?: boolean;
  onSuccess?: (entity: SupplierProduct) => void;
  showCancel?: boolean;
  onCancel?: () => void;
}) {
  const can = useCan();
  const createRow = useCreateSupplierProduct();
  const updateRow = useUpdateSupplierProduct();
  const suppliersQuery = useAllSuppliers();
  const productsQuery = useAllProducts();
  const currenciesQuery = useAllCurrencies();
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState<"supplier" | "product" | "currency" | null>(null);
  const isEdit = Boolean(supplierProduct);
  const supplierLocked = lockSupplier || isEdit;
  const productLocked = lockProduct || isEdit;

  const form = useForm<SupplierProductFormValues>({
    resolver: zodResolver(SupplierProductFormSchema),
    values: toFormValues(supplierProduct, {
      supplierId: defaultSupplierId,
      productId: defaultProductId,
    }),
  });
  useDirtyFormGuard(form.formState.isDirty && !disabled);

  const supplierId = useWatch({ control: form.control, name: "supplier_id" });
  const suppliers = suppliersQuery.data ?? [];
  const products = productsQuery.data ?? [];
  const currencies = currenciesQuery.data ?? [];
  const selectedSupplier = suppliers.find((item) => item.id === supplierId);

  useEffect(() => {
    if (isEdit || disabled || !selectedSupplier) {
      return;
    }
    const current = form.getValues("currency_id");
    if (!current || current === OPTIONAL_SELECT_NONE) {
      form.setValue("currency_id", selectedSupplier.currency_id);
    }
  }, [disabled, form, isEdit, selectedSupplier]);

  async function onSubmit(values: SupplierProductFormValues) {
    setFormError(null);
    try {
      if (supplierProduct) {
        const updated = await updateRow.mutateAsync({ id: supplierProduct.id, values });
        toast.success("Catalog item updated");
        onSuccess?.(updated);
      } else {
        const created = await createRow.mutateAsync(values);
        toast.success("Catalog item created");
        onSuccess?.(created);
      }
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createRow.isPending || updateRow.isPending;

  return (
    <Form {...form}>
      <form
        onSubmit={disabled ? (event) => event.preventDefault() : form.handleSubmit(onSubmit)}
        className="flex flex-col gap-3"
      >
        {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="supplier_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled || supplierLocked || suppliersQuery.isLoading}
                  placeholder="Select a supplier"
                  searchPlaceholder="Search supplier…"
                  createLabel="Create supplier"
                  onCreate={
                    can(supplierPermissions.create) && !disabled && !supplierLocked
                      ? () => setCreating("supplier")
                      : undefined
                  }
                  options={suppliers.map((supplier) => ({
                    value: supplier.id,
                    label: supplier.name,
                  }))}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          {isEdit ? null : (
            <FormField
              control={form.control}
              name="product_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mapped product</FormLabel>
                  <MasterSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={disabled || productLocked || productsQuery.isLoading}
                    placeholder="Unmapped"
                    searchPlaceholder="Search product…"
                    createLabel="Create product"
                    onCreate={
                      can(productPermissions.create) && !disabled && !productLocked
                        ? () => setCreating("product")
                        : undefined
                    }
                    options={[
                      { value: OPTIONAL_SELECT_NONE, label: "Unmapped" },
                      ...products.map((product) => ({
                        value: product.id,
                        label: `${product.sku} — ${product.name}`,
                      })),
                    ]}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name="supplier_sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier SKU</FormLabel>
                <FormControl>
                  <Input placeholder="789" maxLength={80} disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="supplier_item_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier item name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Supplier's name for this item"
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
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input inputMode="decimal" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="currency_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled || currenciesQuery.isLoading}
                  placeholder="Supplier default"
                  searchPlaceholder="Search currency…"
                  createLabel="Create currency"
                  onCreate={
                    can(currencyPermissions.create) && !disabled
                      ? () => setCreating("currency")
                      : undefined
                  }
                  options={[
                    { value: OPTIONAL_SELECT_NONE, label: "Supplier default" },
                    ...currencies.map((currency) => ({
                      value: currency.id,
                      label: `${currency.code} · ${currency.name}`,
                    })),
                  ]}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="supplier_description"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Supplier description</FormLabel>
                <FormControl>
                  <Textarea disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="col-span-full flex flex-col gap-2">
            <FormField
              control={form.control}
              name="is_preferred"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      disabled={disabled}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                    />
                  </FormControl>
                  <FormLabel>Preferred SKU for this supplier</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_preferred_supplier"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      disabled={disabled}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                    />
                  </FormControl>
                  <FormLabel>Preferred supplier for this product</FormLabel>
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
                {isEdit ? "Save Changes" : "Create catalog item"}
              </Button>
            ) : null}
          </div>
        ) : null}
      </form>
      <SupplierFormDialog
        open={creating === "supplier"}
        supplier={null}
        nested
        onCreated={(entity) => form.setValue("supplier_id", entity.id)}
        onOpenChange={(open) => setCreating(open ? "supplier" : null)}
      />
      <ProductFormDialog
        open={creating === "product"}
        product={null}
        nested
        onCreated={(entity) => form.setValue("product_id", entity.id)}
        onOpenChange={(open) => setCreating(open ? "product" : null)}
      />
      <CurrencyFormDialog
        open={creating === "currency"}
        currency={null}
        nested
        onCreated={(entity) => form.setValue("currency_id", entity.id)}
        onOpenChange={(open) => setCreating(open ? "currency" : null)}
      />
    </Form>
  );
}
