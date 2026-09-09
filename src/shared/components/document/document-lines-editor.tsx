"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  type ArrayPath,
  type FieldArray,
  type FieldValues,
  type Path,
  type PathValue,
  type UseFormReturn,
  useFieldArray,
  useWatch,
} from "react-hook-form";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { TaxFormDialog } from "@/modules/erp/accounting/taxes/components/tax-form-dialog";
import { taxPermissions } from "@/modules/erp/accounting/taxes/permissions";
import { useAllTaxes } from "@/modules/erp/accounting/taxes/queries";
import { catalogLineAutofill } from "@/modules/erp/supplier-products/catalog-line";
import { LinkProductDialog } from "@/modules/erp/supplier-products/components/link-product-dialog";
import { supplierProductPermissions } from "@/modules/erp/supplier-products/permissions";
import { useAllSupplierProducts } from "@/modules/erp/supplier-products/queries";
import type { SupplierProduct } from "@/modules/erp/supplier-products/schemas";
import { ProductFormDialog } from "@/modules/inventory-management/products/components/product-form-dialog";
import { productPermissions } from "@/modules/inventory-management/products/permissions";
import { useAllProducts } from "@/modules/inventory-management/products/queries";
import type { Product } from "@/modules/inventory-management/products/schemas";
import { UnitFormDialog } from "@/modules/inventory-management/units/components/unit-form-dialog";
import { unitPermissions } from "@/modules/inventory-management/units/permissions";
import { useAllUnits } from "@/modules/inventory-management/units/queries";
import {
  DISCOUNT_TYPE_LABELS,
  DISCOUNT_TYPES,
  emptyDocumentLine,
} from "@/shared/components/document/schemas";
import { MasterSelect } from "@/shared/components/form/master-select";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { FormControl, FormField, FormItem, FormMessage } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { formatMoney } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

const BASE_LINE_HEADERS = [
  "Product",
  "Description",
  "Qty",
  "Unit",
  "Rate",
  "Discount type",
  "Discount",
  "Tax",
  "",
] as const;

export type SupplierCatalogProps = {
  supplierId: string | null;
};

function lineHeaders(showSupplierSku: boolean): readonly string[] {
  if (!showSupplierSku) {
    return BASE_LINE_HEADERS;
  }
  return [
    "Product",
    "Supplier SKU",
    "Description",
    "Qty",
    "Unit",
    "Rate",
    "Discount type",
    "Discount",
    "Tax",
    "",
  ];
}

function linePath<TFieldValues extends FieldValues>(
  index: number,
  field: string,
): Path<TFieldValues> {
  return `lines.${index}.${field}` as Path<TFieldValues>;
}

function optionalUuid(value: string | null | undefined): string | null {
  return !value || value === OPTIONAL_SELECT_NONE ? null : value;
}

function catalogProductOptions(rows: SupplierProduct[]) {
  const seen = new Set<string>();
  const preferred: Array<{ value: string; label: string }> = [];
  const rest: Array<{ value: string; label: string }> = [];
  for (const row of rows) {
    if (!row.product_id || seen.has(row.product_id)) {
      continue;
    }
    seen.add(row.product_id);
    const option = {
      value: row.product_id,
      label: `${row.supplier_sku} — ${row.supplier_item_name}`,
    };
    if (row.is_preferred) {
      preferred.push(option);
    } else {
      rest.push(option);
    }
  }
  return [...preferred, ...rest];
}

function CatalogRateHint<TFieldValues extends FieldValues>({
  form,
  index,
  catalog,
  documentCurrencyId,
}: {
  form: UseFormReturn<TFieldValues>;
  index: number;
  catalog: SupplierProduct[];
  documentCurrencyId: string | null;
}) {
  const supplierProductId = useWatch({
    control: form.control,
    name: linePath<TFieldValues>(index, "supplier_product_id"),
  });
  const row = catalog.find((item) => item.id === String(supplierProductId ?? ""));
  if (!row) {
    return null;
  }
  const hint = catalogLineAutofill(row, null, documentCurrencyId).catalogPriceHint;
  if (!hint) {
    return null;
  }
  return (
    <p className="text-muted-foreground mt-1 text-xs">
      Catalog price {formatMoney(hint.price, hint.currencyCode)}
    </p>
  );
}

export function DocumentLinesEditor<TFieldValues extends FieldValues>({
  form,
  disabled,
  productSide,
  supplierCatalog,
}: {
  form: UseFormReturn<TFieldValues>;
  disabled: boolean;
  productSide: "sales" | "purchase";
  supplierCatalog?: SupplierCatalogProps;
}) {
  const can = useCan();
  const productsQuery = useAllProducts();
  const unitsQuery = useAllUnits();
  const taxesQuery = useAllTaxes();
  const supplierId = supplierCatalog?.supplierId ?? null;
  const catalogQuery = useAllSupplierProducts(
    { supplier_id: supplierId ?? undefined, is_active: true },
    Boolean(supplierCatalog && supplierId),
  );
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines" as ArrayPath<TFieldValues>,
  });
  const [lineCreate, setLineCreate] = useState<{
    type: "product" | "unit" | "tax";
    index: number;
  } | null>(null);
  const [linking, setLinking] = useState<{ row: SupplierProduct; index: number } | null>(null);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const products = productsQuery.data ?? [];
  const units = unitsQuery.data ?? [];
  const taxes = taxesQuery.data ?? [];
  const catalog = catalogQuery.data ?? [];
  const headers = lineHeaders(Boolean(supplierCatalog));
  const rawCurrencyId = useWatch({
    control: form.control,
    name: "currency_id" as Path<TFieldValues>,
  });
  const documentCurrencyId = optionalUuid(
    typeof rawCurrencyId === "string" ? rawCurrencyId : undefined,
  );

  function setLineValue(index: number, field: string, value: string) {
    form.setValue(
      linePath<TFieldValues>(index, field),
      value as PathValue<TFieldValues, Path<TFieldValues>>,
    );
  }

  function applyProductValues(
    index: number,
    product: Pick<
      Product,
      | "name"
      | "sales_description"
      | "purchase_description"
      | "selling_rate"
      | "purchase_rate"
      | "unit_id"
      | "tax_id"
    >,
  ) {
    const description =
      productSide === "purchase"
        ? product.purchase_description?.trim() || product.name
        : product.sales_description?.trim() || product.name;
    const rate = productSide === "purchase" ? product.purchase_rate : product.selling_rate;
    setLineValue(index, "description", description);
    setLineValue(index, "rate", rate ?? "");
    setLineValue(index, "unit_id", product.unit_id ?? OPTIONAL_SELECT_NONE);
    setLineValue(index, "tax_id", product.tax_id ?? OPTIONAL_SELECT_NONE);
  }

  function applyCatalogRow(index: number, row: SupplierProduct) {
    const product = row.product_id
      ? (products.find((item) => item.id === row.product_id) ?? null)
      : null;
    const autofill = catalogLineAutofill(row, product, documentCurrencyId);
    setLineValue(index, "supplier_product_id", row.id);
    setLineValue(index, "supplier_sku", row.supplier_sku);
    setLineValue(index, "product_id", row.product_id ?? OPTIONAL_SELECT_NONE);
    setLineValue(index, "description", autofill.description);
    setLineValue(index, "rate", autofill.rate);
    setLineValue(index, "unit_id", autofill.unit_id ?? OPTIONAL_SELECT_NONE);
    setLineValue(index, "tax_id", autofill.tax_id ?? OPTIONAL_SELECT_NONE);
  }

  function applyProduct(index: number, productId: string) {
    const product = products.find((item) => item.id === productId);
    if (!product) {
      return;
    }
    applyProductValues(index, product);
    if (!supplierCatalog) {
      return;
    }
    const match =
      catalog.find((row) => row.product_id === productId && row.is_preferred) ??
      catalog.find((row) => row.product_id === productId);
    if (match) {
      applyCatalogRow(index, match);
      return;
    }
    setLineValue(index, "supplier_product_id", OPTIONAL_SELECT_NONE);
    setLineValue(index, "supplier_sku", "");
  }

  const productOptions =
    supplierCatalog && supplierId && !showAllProducts
      ? catalogProductOptions(catalog)
      : products.map((product) => ({
          value: product.id,
          label: `${product.sku} — ${product.name}`,
        }));

  return (
    <div className="flex flex-col gap-2">
      {supplierCatalog && supplierId && !disabled ? (
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={showAllProducts}
            onCheckedChange={(checked) => setShowAllProducts(checked === true)}
          />
          Show all products
        </label>
      ) : null}
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full caption-bottom text-sm">
          <TableHeader>
            <TableRow>
              {headers.map((header) => (
                <TableHead key={header || "actions"}>{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.length === 0 ? (
              <TableRow>
                <TableCell colSpan={headers.length} className="text-muted-foreground">
                  No lines yet.
                </TableCell>
              </TableRow>
            ) : (
              fields.map((field, index) => (
                <TableRow key={field.id}>
                  <TableCell className="min-w-48 align-top">
                    <FormField
                      control={form.control}
                      name={linePath<TFieldValues>(index, "product_id")}
                      render={({ field: productField }) => (
                        <FormItem>
                          <MasterSelect
                            compact
                            value={String(productField.value ?? OPTIONAL_SELECT_NONE)}
                            onValueChange={(value) => {
                              productField.onChange(value);
                              if (value !== OPTIONAL_SELECT_NONE) {
                                applyProduct(index, value);
                              }
                            }}
                            disabled={disabled || productsQuery.isLoading}
                            placeholder="Custom line"
                            searchPlaceholder="Search product…"
                            createLabel="Create product"
                            onCreate={
                              can(productPermissions.create)
                                ? () => setLineCreate({ type: "product", index })
                                : undefined
                            }
                            options={[
                              { value: OPTIONAL_SELECT_NONE, label: "Custom line" },
                              ...productOptions,
                            ]}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {supplierCatalog && !disabled ? (
                      <UnmappedCatalogLink
                        form={form}
                        index={index}
                        catalog={catalog}
                        canLink={can(supplierProductPermissions.link)}
                        onLink={(row) => setLinking({ row, index })}
                      />
                    ) : null}
                  </TableCell>
                  {supplierCatalog ? (
                    <TableCell className="min-w-48 align-top">
                      {disabled ? (
                        <FormField
                          control={form.control}
                          name={linePath<TFieldValues>(index, "supplier_sku")}
                          render={({ field: skuField }) => (
                            <span className="font-mono text-sm">
                              {String(skuField.value || "—")}
                            </span>
                          )}
                        />
                      ) : (
                        <FormField
                          control={form.control}
                          name={linePath<TFieldValues>(index, "supplier_product_id")}
                          render={({ field: catalogField }) => (
                            <FormItem>
                              <MasterSelect
                                compact
                                value={String(catalogField.value ?? OPTIONAL_SELECT_NONE)}
                                onValueChange={(value) => {
                                  catalogField.onChange(value);
                                  if (value === OPTIONAL_SELECT_NONE) {
                                    setLineValue(index, "supplier_sku", "");
                                    return;
                                  }
                                  const row = catalog.find((item) => item.id === value);
                                  if (row) {
                                    applyCatalogRow(index, row);
                                  }
                                }}
                                disabled={!supplierId || catalogQuery.isLoading}
                                placeholder="None"
                                searchPlaceholder="Search supplier SKU…"
                                options={[
                                  { value: OPTIONAL_SELECT_NONE, label: "None" },
                                  ...catalog.map((row) => ({
                                    value: row.id,
                                    label: `${row.supplier_sku} — ${row.supplier_item_name}`,
                                  })),
                                ]}
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </TableCell>
                  ) : null}
                  <TableCell className="min-w-56 align-top">
                    <FormField
                      control={form.control}
                      name={linePath<TFieldValues>(index, "description")}
                      render={({ field: descriptionField }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              disabled={disabled}
                              aria-label={`Line ${index + 1} description`}
                              {...descriptionField}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell className="w-24 align-top">
                    <FormField
                      control={form.control}
                      name={linePath<TFieldValues>(index, "quantity")}
                      render={({ field: quantityField }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              inputMode="decimal"
                              className="text-right"
                              disabled={disabled}
                              aria-label={`Line ${index + 1} quantity`}
                              {...quantityField}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell className="min-w-32 align-top">
                    <FormField
                      control={form.control}
                      name={linePath<TFieldValues>(index, "unit_id")}
                      render={({ field: unitField }) => (
                        <FormItem>
                          <MasterSelect
                            compact
                            value={String(unitField.value ?? OPTIONAL_SELECT_NONE)}
                            onValueChange={unitField.onChange}
                            disabled={disabled || unitsQuery.isLoading}
                            placeholder="None"
                            searchPlaceholder="Search unit…"
                            createLabel="Create unit"
                            onCreate={
                              can(unitPermissions.create)
                                ? () => setLineCreate({ type: "unit", index })
                                : undefined
                            }
                            options={[
                              { value: OPTIONAL_SELECT_NONE, label: "None" },
                              ...units.map((unit) => ({
                                value: unit.id,
                                label: unit.code,
                              })),
                            ]}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell className="w-28 align-top">
                    <FormField
                      control={form.control}
                      name={linePath<TFieldValues>(index, "rate")}
                      render={({ field: rateField }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              inputMode="decimal"
                              className="text-right"
                              disabled={disabled}
                              aria-label={`Line ${index + 1} rate`}
                              {...rateField}
                            />
                          </FormControl>
                          {supplierCatalog ? (
                            <CatalogRateHint
                              form={form}
                              index={index}
                              catalog={catalog}
                              documentCurrencyId={documentCurrencyId}
                            />
                          ) : null}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell className="min-w-36 align-top">
                    <FormField
                      control={form.control}
                      name={linePath<TFieldValues>(index, "discount_type")}
                      render={({ field: typeField }) => (
                        <FormItem>
                          <Select
                            value={String(typeField.value ?? OPTIONAL_SELECT_NONE)}
                            onValueChange={typeField.onChange}
                            disabled={disabled}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="None" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={OPTIONAL_SELECT_NONE}>None</SelectItem>
                              {DISCOUNT_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {DISCOUNT_TYPE_LABELS[type]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell className="w-28 align-top">
                    <FormField
                      control={form.control}
                      name={linePath<TFieldValues>(index, "discount_value")}
                      render={({ field: discountField }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              inputMode="decimal"
                              className="text-right"
                              disabled={disabled}
                              {...discountField}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell className="min-w-36 align-top">
                    <FormField
                      control={form.control}
                      name={linePath<TFieldValues>(index, "tax_id")}
                      render={({ field: taxField }) => (
                        <FormItem>
                          <MasterSelect
                            compact
                            value={String(taxField.value ?? OPTIONAL_SELECT_NONE)}
                            onValueChange={taxField.onChange}
                            disabled={disabled || taxesQuery.isLoading}
                            placeholder="None"
                            searchPlaceholder="Search tax…"
                            createLabel="Create tax"
                            onCreate={
                              can(taxPermissions.create)
                                ? () => setLineCreate({ type: "tax", index })
                                : undefined
                            }
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
                  </TableCell>
                  <TableCell className="align-top">
                    {disabled ? null : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive size-7"
                        aria-label="Remove line"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </table>
      </div>
      {disabled ? null : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append(emptyDocumentLine() as FieldArray<TFieldValues, ArrayPath<TFieldValues>>)
          }
        >
          <Plus className="size-3.5" />
          Add line
        </Button>
      )}
      <ProductFormDialog
        open={lineCreate?.type === "product"}
        product={null}
        nested
        onCreated={(entity) => {
          if (lineCreate?.type !== "product") {
            return;
          }
          setLineValue(lineCreate.index, "product_id", entity.id);
          applyProduct(lineCreate.index, entity.id);
        }}
        onOpenChange={(open) => {
          if (!open) {
            setLineCreate(null);
          }
        }}
      />
      <UnitFormDialog
        open={lineCreate?.type === "unit"}
        nested
        onCreated={(entity) => {
          if (lineCreate?.type !== "unit") {
            return;
          }
          setLineValue(lineCreate.index, "unit_id", entity.id);
        }}
        onOpenChange={(open) => {
          if (!open) {
            setLineCreate(null);
          }
        }}
      />
      <TaxFormDialog
        open={lineCreate?.type === "tax"}
        tax={null}
        nested
        onCreated={(entity) => {
          if (lineCreate?.type !== "tax") {
            return;
          }
          setLineValue(lineCreate.index, "tax_id", entity.id);
        }}
        onOpenChange={(open) => {
          if (!open) {
            setLineCreate(null);
          }
        }}
      />
      <LinkProductDialog
        open={Boolean(linking)}
        supplierProduct={linking?.row ?? null}
        rateCurrencyId={documentCurrencyId}
        nested
        onLinked={(entity) => {
          if (!linking) {
            return;
          }
          applyCatalogRow(linking.index, entity);
        }}
        onOpenChange={(open) => {
          if (!open) {
            setLinking(null);
          }
        }}
      />
    </div>
  );
}

function UnmappedCatalogLink<TFieldValues extends FieldValues>({
  form,
  index,
  catalog,
  canLink,
  onLink,
}: {
  form: UseFormReturn<TFieldValues>;
  index: number;
  catalog: SupplierProduct[];
  canLink: boolean;
  onLink: (row: SupplierProduct) => void;
}) {
  const supplierProductId = useWatch({
    control: form.control,
    name: linePath<TFieldValues>(index, "supplier_product_id"),
  });
  const row = catalog.find((item) => item.id === String(supplierProductId ?? ""));
  if (!row || row.is_mapped || !canLink) {
    return null;
  }
  return (
    <Button
      type="button"
      variant="link"
      size="sm"
      className="h-auto px-0"
      onClick={() => onLink(row)}
    >
      Link a product
    </Button>
  );
}
