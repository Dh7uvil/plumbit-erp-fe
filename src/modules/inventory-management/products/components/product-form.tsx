"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import { useAllProducts } from "@/modules/inventory-management/products/queries";
import {
  toCreateRequest,
  toDirtyUpdateRequest,
  toFormValues,
} from "@/modules/inventory-management/products/product-form-payload";
import {
  ProductFormSchema,
  formatPacking,
  formatSecondaryPackingLabel,
  type Product,
  type ProductFormValues,
} from "@/modules/inventory-management/products/schemas";
import { useAllUnits } from "@/modules/inventory-management/units/queries";
import { UnitFormDialog } from "@/modules/inventory-management/units/components/unit-form-dialog";
import { unitPermissions } from "@/modules/inventory-management/units/permissions";
import { useCurrentTenant } from "@/modules/users-management/tenants/queries";
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
import { DecimalInput } from "@/shared/components/form/decimal-input";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";
import { useCan } from "@/shared/providers/session-provider";

export function ProductForm({
  product,
  initialValues,
  disabled = false,
  onSuccess,
  showCancel = false,
  onCancel,
}: {
  product: Product | null;
  initialValues?: Partial<ProductFormValues>;
  disabled?: boolean;
  onSuccess?: (entity: Product) => void;
  showCancel?: boolean;
  onCancel?: () => void;
}) {
  const can = useCan();
  const tenantQuery = useCurrentTenant();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const unitsQuery = useAllUnits();
  const categoriesQuery = useAllCategories();
  const taxesQuery = useAllTaxes();
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState<"unit" | "category" | "tax" | null>(null);
  const isEdit = Boolean(product);
  const productsQuery = useAllProducts(!isEdit);
  const qcDefault = tenantQuery.data?.qc_required_default ?? false;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(ProductFormSchema),
    ...(product
      ? { values: toFormValues(product) }
      : { defaultValues: { ...toFormValues(null), requires_qc: qcDefault, ...initialValues } }),
  });
  useDirtyFormGuard(form.formState.isDirty && !disabled);
  const trackInventory = useWatch({ control: form.control, name: "track_inventory" });
  const categoryId = useWatch({ control: form.control, name: "category_id" });
  const unitId = useWatch({ control: form.control, name: "unit_id" });
  const taxId = useWatch({ control: form.control, name: "tax_id" });
  const secondaryUnitId = useWatch({ control: form.control, name: "secondary_unit_id" });
  const secondaryUnitFactor = useWatch({ control: form.control, name: "secondary_unit_factor" });
  const piecesPerUnit = useWatch({ control: form.control, name: "pieces_per_unit" });
  const hasUnit = Boolean(unitId && unitId !== OPTIONAL_SELECT_NONE);
  const hasSecondaryUnit = Boolean(secondaryUnitId && secondaryUnitId !== OPTIONAL_SELECT_NONE);
  const selectedUnit = hasUnit
    ? (unitsQuery.data ?? []).find((unit) => unit.id === unitId)
    : undefined;
  const selectedUnitName = selectedUnit?.name;
  const selectedSecondaryUnit = hasSecondaryUnit
    ? (unitsQuery.data ?? []).find((unit) => unit.id === secondaryUnitId)
    : undefined;
  const packingLabel = formatPacking(piecesPerUnit, selectedUnitName);
  const secondaryPerLabel = formatSecondaryPackingLabel(
    secondaryUnitFactor,
    selectedUnit?.code,
    selectedSecondaryUnit?.code,
  );
  const unit2SelectOptions = (unitsQuery.data ?? []).filter(
    (unit) => !hasUnit || unit.id !== unitId,
  );

  useEffect(() => {
    if (isEdit || !categoryId || categoryId === OPTIONAL_SELECT_NONE) {
      return;
    }
    const sample = (productsQuery.data ?? []).find(
      (item) => item.category_id === categoryId && item.id !== product?.id,
    );
    if (!sample) {
      return;
    }
    const dirty = form.formState.dirtyFields;
    if (!dirty.tax_id && form.getValues("tax_id") === OPTIONAL_SELECT_NONE && sample.tax_id) {
      form.setValue("tax_id", sample.tax_id);
    }
    if (!dirty.unit_id && form.getValues("unit_id") === OPTIONAL_SELECT_NONE && sample.unit_id) {
      form.setValue("unit_id", sample.unit_id);
    }
  }, [categoriesQuery.data, categoryId, form, isEdit, product?.id, productsQuery.data]);

  useEffect(() => {
    if (product || form.formState.isDirty || initialValues?.requires_qc != null) {
      return;
    }
    form.setValue("requires_qc", qcDefault);
  }, [form, initialValues?.requires_qc, product, qcDefault]);

  useEffect(() => {
    if (isEdit || unitsQuery.isLoading) {
      return;
    }
    if (form.formState.dirtyFields.unit_id) {
      return;
    }
    if (form.getValues("unit_id") !== OPTIONAL_SELECT_NONE) {
      return;
    }
    const pcs = (unitsQuery.data ?? []).find((unit) => unit.code === "PCS");
    if (pcs) {
      form.setValue("unit_id", pcs.id);
    }
  }, [form, isEdit, unitsQuery.data, unitsQuery.isLoading]);

  useEffect(() => {
    if (hasSecondaryUnit) {
      return;
    }
    if (form.getValues("secondary_unit_factor") !== "") {
      form.setValue("secondary_unit_factor", "");
    }
  }, [form, hasSecondaryUnit]);

  async function onSubmit(values: ProductFormValues) {
    setFormError(null);
    try {
      if (product) {
        const dirty = form.formState.dirtyFields;
        const patch = toDirtyUpdateRequest(values, dirty);
        if (Object.keys(patch).length === 0) {
          toast.message("No changes to save");
          onSuccess?.(product);
          return;
        }
        await updateProduct.mutateAsync({ id: product.id, values: patch });
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
  const selectedTaxRate = taxes.find((tax) => tax.id === taxId)?.rate;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
        {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
        <div
          data-slot="form-grid"
          className="grid grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-2 lg:grid-cols-3"
        >
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
          <p className="col-span-full text-sm font-medium">Sales information</p>
          <FormField
            control={form.control}
            name="selling_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Selling rate</FormLabel>
                <FormControl>
                  <DecimalInput kind="money" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="price_1"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price 1</FormLabel>
                <FormControl>
                  <DecimalInput kind="money" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="price_2"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price 2</FormLabel>
                <FormControl>
                  <DecimalInput kind="money" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sales_description"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Sales description</FormLabel>
                <FormControl>
                  <Textarea disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <p className="col-span-full text-sm font-medium">Purchase information</p>
          <FormField
            control={form.control}
            name="purchase_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Avg. cost</FormLabel>
                <FormControl>
                  <DecimalInput
                    kind="money"
                    disabled={disabled || Boolean(product?.id)}
                    {...field}
                  />
                </FormControl>
                <p className="text-muted-foreground text-xs">
                  Updated automatically from FIFO when goods receipts or purchase invoices are
                  posted.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="purchase_description"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Purchase description</FormLabel>
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
            name="pieces_per_unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {hasUnit ? `Pieces per ${selectedUnitName ?? "unit"}` : "Pieces per unit"}
                </FormLabel>
                <FormControl>
                  <DecimalInput
                    kind="quantity"
                    disabled={disabled || !hasUnit}
                    placeholder={hasUnit ? undefined : "Select a unit first"}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormItem>
            <FormLabel>Packing</FormLabel>
            <FormControl>
              <Input readOnly disabled value={packingLabel ?? "—"} tabIndex={-1} />
            </FormControl>
          </FormItem>
          <FormField
            control={form.control}
            name="secondary_unit_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit 2</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    if (value === OPTIONAL_SELECT_NONE) {
                      form.setValue("secondary_unit_factor", "");
                    }
                  }}
                  disabled={disabled || unitsQuery.isLoading}
                  placeholder="None"
                  searchPlaceholder="Search unit…"
                  createLabel="Create unit"
                  onCreate={can(unitPermissions.create) ? () => setCreating("unit") : undefined}
                  options={[
                    { value: OPTIONAL_SELECT_NONE, label: "None" },
                    ...unit2SelectOptions.map((unit) => ({
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
            name="secondary_unit_factor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {hasSecondaryUnit
                    ? `Pieces per ${selectedSecondaryUnit?.name ?? "unit 2"}`
                    : "Pieces per unit 2"}
                </FormLabel>
                <FormControl>
                  <DecimalInput
                    kind="quantity"
                    disabled={disabled || !hasSecondaryUnit}
                    placeholder={hasSecondaryUnit ? undefined : "Select unit 2 first"}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormItem>
            <FormLabel>Per</FormLabel>
            <FormControl>
              <Input readOnly disabled value={secondaryPerLabel ?? "—"} tabIndex={-1} />
            </FormControl>
          </FormItem>
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
          <div
            data-slot="form-grid"
            className="col-span-full grid grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-2"
          >
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
            <FormItem>
              <FormLabel>Tax rate</FormLabel>
              <FormControl>
                <Input readOnly disabled tabIndex={-1} value={selectedTaxRate ?? "—"} />
              </FormControl>
            </FormItem>
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
            <FormField
              control={form.control}
              name="volume"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Volume (CBM)</FormLabel>
                  <FormControl>
                    <DecimalInput kind="quantity" disabled={disabled} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <p className="col-span-full text-sm font-medium">Additional item details</p>
          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand</FormLabel>
                <FormControl>
                  <Input maxLength={120} disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="origin_country_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Made in (ISO)</FormLabel>
                <FormControl>
                  <Input maxLength={2} disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="engine"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Engine / model</FormLabel>
                <FormControl>
                  <Input maxLength={80} disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="alias_2"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alias 2</FormLabel>
                <FormControl>
                  <Input maxLength={80} disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="alias_3"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alias 3</FormLabel>
                <FormControl>
                  <Input maxLength={80} disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="alias_4"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alias 4</FormLabel>
                <FormControl>
                  <Input maxLength={80} disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="default_reorder_level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reorder level</FormLabel>
                <FormControl>
                  <DecimalInput kind="quantity" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="max_level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max level</FormLabel>
                <FormControl>
                  <DecimalInput kind="quantity" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="net_weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Net weight</FormLabel>
                <FormControl>
                  <DecimalInput kind="quantity" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="gross_weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gross weight</FormLabel>
                <FormControl>
                  <DecimalInput kind="quantity" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="rem"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rem</FormLabel>
                <FormControl>
                  <Input maxLength={200} disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="remarks"
            render={({ field }) => (
              <FormItem className="col-span-full">
                <FormLabel>Remarks</FormLabel>
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
            {trackInventory ? (
              <FormField
                control={form.control}
                name="requires_qc"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        disabled={disabled}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                      />
                    </FormControl>
                    <FormLabel>Requires quality inspection</FormLabel>
                  </FormItem>
                )}
              />
            ) : null}
            <FormField
              control={form.control}
              name="stock_input_disabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      disabled={disabled}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                    />
                  </FormControl>
                  <FormLabel>Disable stock input on documents</FormLabel>
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
