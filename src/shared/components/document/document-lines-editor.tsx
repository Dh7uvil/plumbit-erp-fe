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
import { useAllAccounts } from "@/modules/erp/accounting/accounts/queries";
import {
  DISCOUNT_TYPE_LABELS,
  DISCOUNT_TYPES,
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  emptyDocumentLine,
  emptyExpenseDocumentLine,
} from "@/shared/components/document/schemas";
import { MasterSelect } from "@/shared/components/form/master-select";
import { TableActionTooltip } from "@/shared/components/data-table/row-actions";
import { Button } from "@/shared/components/ui/button";
import { FormControl, FormField, FormItem, FormMessage } from "@/shared/components/ui/form";
import { DecimalInput } from "@/shared/components/form/decimal-input";
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
import { DocumentViewTableContainer } from "@/shared/components/document/document-view-table-container";
import { MixedDocumentLineRow } from "@/shared/components/document/mixed-document-line-row";
import {
  formatFixedDecimal,
  formatMoney,
  isZeroDecimal,
  multiplyDecimals,
  subtractDecimals,
} from "@/shared/lib/format";
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
  "Amount",
  "",
] as const;

const RECEIVE_LINE_HEADERS = [
  "Product",
  "Supplier SKU",
  "Description",
  "Qty",
  "Unit",
  "Rate",
  "Net wt",
  "Gross wt",
  "Volume",
  "",
] as const;

const EXPENSE_LINE_HEADERS = ["Account", "Category", "Description", "Amount", "Tax", ""] as const;

export type SupplierCatalogProps = {
  supplierId: string | null;
};

export type DocumentLinesMode = "standard" | "receive" | "expense" | "mixed";

const MIXED_LINE_HEADERS_WITH_SKU = [
  "Type",
  "Product / account",
  "Supplier SKU",
  "Category",
  "Description",
  "Qty",
  "Unit",
  "Rate",
  "Discount type",
  "Discount",
  "Tax",
  "Amount",
  "",
] as const;

const MIXED_LINE_HEADERS = [
  "Type",
  "Product / account",
  "Category",
  "Description",
  "Qty",
  "Unit",
  "Rate",
  "Discount type",
  "Discount",
  "Tax",
  "Amount",
  "",
] as const;

function emptyMixedProductLine() {
  return {
    ...emptyDocumentLine(),
    line_type: "PRODUCT" as const,
    expense_account_id: OPTIONAL_SELECT_NONE,
    expense_category: OPTIONAL_SELECT_NONE,
  };
}

function lineHeaders(
  showSupplierSku: boolean,
  mode: DocumentLinesMode,
  showPacking: boolean,
  showHsCode: boolean,
): readonly string[] {
  let headers: readonly string[];
  if (mode === "mixed") {
    headers = showSupplierSku ? MIXED_LINE_HEADERS_WITH_SKU : MIXED_LINE_HEADERS;
  } else if (mode === "expense") {
    headers = EXPENSE_LINE_HEADERS;
  } else if (mode === "receive") {
    headers = RECEIVE_LINE_HEADERS;
  } else if (!showSupplierSku) {
    headers = BASE_LINE_HEADERS;
  } else {
    headers = [
      "Product",
      "Supplier SKU",
      "Description",
      "Qty",
      "Unit",
      "Rate",
      "Discount type",
      "Discount",
      "Tax",
      "Amount",
      "",
    ];
  }
  if (mode === "standard" && (showPacking || showHsCode)) {
    const withoutActions = headers.slice(0, -1);
    const packing = showPacking
      ? (["Item code", "PKG", "Ctns", "CBM", "Weight"] as const)
      : ([] as const);
    const hs = showHsCode ? (["HS code"] as const) : ([] as const);
    return [...withoutActions, ...packing, ...hs, ""];
  }
  return headers;
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

function catalogProductIds(rows: SupplierProduct[]) {
  const seen = new Set<string>();
  const preferred: string[] = [];
  const rest: string[] = [];
  for (const row of rows) {
    if (!row.product_id || seen.has(row.product_id)) {
      continue;
    }
    seen.add(row.product_id);
    if (row.is_preferred) {
      preferred.push(row.product_id);
    } else {
      rest.push(row.product_id);
    }
  }
  return [...preferred, ...rest];
}

function productSelectOptions(products: Product[], catalog: SupplierProduct[]) {
  const options = products.map((product) => ({
    value: product.id,
    label: `${product.sku} — ${product.name}`,
  }));
  const ranked = catalogProductIds(catalog);
  if (ranked.length === 0) {
    return options;
  }
  const rank = new Map(ranked.map((id, index) => [id, index]));
  return [...options].sort((left, right) => {
    const leftRank = rank.get(left.value) ?? Number.MAX_SAFE_INTEGER;
    const rightRank = rank.get(right.value) ?? Number.MAX_SAFE_INTEGER;
    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }
    return left.label.localeCompare(right.label);
  });
}

function previewLineAmount(
  quantity: string,
  rate: string,
  discountType: string | null | undefined,
  discountValue: string | null | undefined,
): string | null {
  if (rate.trim() === "") {
    return null;
  }
  const qty = quantity.trim() === "" ? "0" : quantity;
  let net = multiplyDecimals(qty, rate, 4);
  if (net == null) {
    return null;
  }
  const type = discountType && discountType !== OPTIONAL_SELECT_NONE ? discountType : "";
  const disc = (discountValue ?? "").trim();
  if (type && disc !== "" && !isZeroDecimal(disc)) {
    if (type === "PERCENTAGE") {
      const hundredths = multiplyDecimals(disc, "0.01", 6);
      const reduction = hundredths ? multiplyDecimals(net, hundredths, 4) : null;
      net = reduction ? subtractDecimals(net, reduction, 4) : net;
    } else if (type === "AMOUNT") {
      net = subtractDecimals(net, disc, 4) ?? net;
    }
  }
  return net;
}

function LineAmountCell<TFieldValues extends FieldValues>({
  form,
  index,
}: {
  form: UseFormReturn<TFieldValues>;
  index: number;
}) {
  const quantity = useWatch({
    control: form.control,
    name: linePath<TFieldValues>(index, "quantity"),
  });
  const rate = useWatch({
    control: form.control,
    name: linePath<TFieldValues>(index, "rate"),
  });
  const discountType = useWatch({
    control: form.control,
    name: linePath<TFieldValues>(index, "discount_type"),
  });
  const discountValue = useWatch({
    control: form.control,
    name: linePath<TFieldValues>(index, "discount_value"),
  });
  const amount = previewLineAmount(
    String(quantity ?? ""),
    String(rate ?? ""),
    String(discountType ?? ""),
    String(discountValue ?? ""),
  );
  return (
    <span className="block min-h-9 py-2 text-right text-sm tabular-nums">
      {amount ? formatFixedDecimal(amount, 2) : "—"}
    </span>
  );
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
  lineMode = "standard",
  showPacking = false,
  showHsCode = false,
}: {
  form: UseFormReturn<TFieldValues>;
  disabled: boolean;
  productSide: "sales" | "purchase";
  supplierCatalog?: SupplierCatalogProps;
  lineMode?: DocumentLinesMode;
  showPacking?: boolean;
  showHsCode?: boolean;
}) {
  const can = useCan();
  const productsQuery = useAllProducts();
  const unitsQuery = useAllUnits();
  const taxesQuery = useAllTaxes();
  const accountsQuery = useAllAccounts(
    { is_group: false, is_active: true },
    lineMode === "expense" || lineMode === "mixed",
  );
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
  const products = productsQuery.data ?? [];
  const units = unitsQuery.data ?? [];
  const taxes = taxesQuery.data ?? [];
  const accounts = accountsQuery.data ?? [];
  const catalog = catalogQuery.data ?? [];
  const isReceive = lineMode === "receive";
  const isExpense = lineMode === "expense";
  const isMixed = lineMode === "mixed";
  const showSupplierSku = Boolean(supplierCatalog) || isReceive;
  const headers = lineHeaders(showSupplierSku, lineMode, showPacking, showHsCode);
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

  const productOptions = productSelectOptions(
    products,
    supplierCatalog && supplierId ? catalog : [],
  );

  return (
    <div className="flex flex-col gap-2">
      <DocumentViewTableContainer
        viewMode={disabled}
        rowCount={fields.length}
        className={isMixed ? "[--document-view-table-row-height:6.5rem]" : undefined}
      >
        <table className="w-max min-w-full caption-bottom text-sm">
          <TableHeader>
            <TableRow>
              {headers.map((header) => (
                <TableHead key={header || "actions"} className="whitespace-nowrap">
                  {header}
                </TableHead>
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
              fields.map((field, index) =>
                isMixed ? (
                  <MixedDocumentLineRow
                    key={field.id}
                    form={form}
                    index={index}
                    disabled={disabled}
                    productOptions={productOptions}
                    units={units}
                    taxes={taxes}
                    accounts={accounts}
                    catalog={catalog}
                    supplierId={supplierId}
                    showSupplierSku={showSupplierSku}
                    onApplyProduct={applyProduct}
                    onApplyCatalogRow={applyCatalogRow}
                    onRemove={remove}
                    onCreateProduct={
                      can(productPermissions.create)
                        ? (rowIndex) => setLineCreate({ type: "product", index: rowIndex })
                        : undefined
                    }
                    onCreateUnit={
                      can(unitPermissions.create)
                        ? (rowIndex) => setLineCreate({ type: "unit", index: rowIndex })
                        : undefined
                    }
                    onCreateTax={
                      can(taxPermissions.create)
                        ? (rowIndex) => setLineCreate({ type: "tax", index: rowIndex })
                        : undefined
                    }
                  />
                ) : isExpense ? (
                  <TableRow key={field.id}>
                    <TableCell className="min-w-56 align-top">
                      <FormField
                        control={form.control}
                        name={linePath<TFieldValues>(index, "expense_account_id")}
                        render={({ field: accountField }) => (
                          <FormItem>
                            <MasterSelect
                              compact
                              value={String(accountField.value ?? OPTIONAL_SELECT_NONE)}
                              onValueChange={accountField.onChange}
                              disabled={disabled || accountsQuery.isLoading}
                              placeholder="Select account"
                              searchPlaceholder="Search account…"
                              options={[
                                { value: OPTIONAL_SELECT_NONE, label: "Select account" },
                                ...accounts.map((account) => ({
                                  value: account.id,
                                  label: `${account.code} — ${account.name}`,
                                })),
                              ]}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell className="min-w-36 align-top">
                      <FormField
                        control={form.control}
                        name={linePath<TFieldValues>(index, "expense_category")}
                        render={({ field: categoryField }) => (
                          <FormItem>
                            <Select
                              value={String(categoryField.value ?? OPTIONAL_SELECT_NONE)}
                              onValueChange={categoryField.onChange}
                              disabled={disabled}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="None" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={OPTIONAL_SELECT_NONE}>None</SelectItem>
                                {EXPENSE_CATEGORIES.map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {EXPENSE_CATEGORY_LABELS[category]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell className="min-w-64 align-top">
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
                    <TableCell className="w-28 min-w-28 align-top">
                      <FormField
                        control={form.control}
                        name={linePath<TFieldValues>(index, "rate")}
                        render={({ field: rateField }) => (
                          <FormItem>
                            <FormControl>
                              <DecimalInput
                                kind="money"
                                className="w-full min-w-0 text-right"
                                disabled={disabled}
                                aria-label={`Line ${index + 1} amount`}
                                {...rateField}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell className="min-w-48 align-top">
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
                        <TableActionTooltip label="Remove line">
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
                        </TableActionTooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow key={field.id}>
                    <TableCell className="min-w-56 align-top">
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
                              emptyText={
                                productsQuery.isError ? "Could not load products" : "No products"
                              }
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
                    {showSupplierSku ? (
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
                    <TableCell className="min-w-64 align-top">
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
                    <TableCell className="w-24 min-w-24 align-top">
                      <FormField
                        control={form.control}
                        name={linePath<TFieldValues>(index, "quantity")}
                        render={({ field: quantityField }) => (
                          <FormItem>
                            <FormControl>
                              <DecimalInput
                                kind="quantity"
                                className="w-full min-w-0 text-right"
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
                    <TableCell className="min-w-40 align-top">
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
                    <TableCell className="w-28 min-w-28 align-top">
                      <FormField
                        control={form.control}
                        name={linePath<TFieldValues>(index, "rate")}
                        render={({ field: rateField }) => (
                          <FormItem>
                            <FormControl>
                              <DecimalInput
                                kind="money"
                                className="w-full min-w-0 text-right"
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
                    {isReceive ? (
                      <>
                        <TableCell className="w-24 min-w-24 align-top">
                          <FormField
                            control={form.control}
                            name={linePath<TFieldValues>(index, "net_weight")}
                            render={({ field: weightField }) => (
                              <FormItem>
                                <FormControl>
                                  <DecimalInput
                                    kind="quantity"
                                    className="w-full min-w-0 text-right"
                                    disabled={disabled}
                                    aria-label={`Line ${index + 1} net weight`}
                                    {...weightField}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell className="w-24 min-w-24 align-top">
                          <FormField
                            control={form.control}
                            name={linePath<TFieldValues>(index, "gross_weight")}
                            render={({ field: weightField }) => (
                              <FormItem>
                                <FormControl>
                                  <DecimalInput
                                    kind="quantity"
                                    className="w-full min-w-0 text-right"
                                    disabled={disabled}
                                    aria-label={`Line ${index + 1} gross weight`}
                                    {...weightField}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell className="w-24 min-w-24 align-top">
                          <FormField
                            control={form.control}
                            name={linePath<TFieldValues>(index, "volume")}
                            render={({ field: volumeField }) => (
                              <FormItem>
                                <FormControl>
                                  <DecimalInput
                                    kind="quantity"
                                    className="w-full min-w-0 text-right"
                                    disabled={disabled}
                                    aria-label={`Line ${index + 1} volume`}
                                    {...volumeField}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                      </>
                    ) : (
                      <>
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
                        <TableCell className="w-24 min-w-24 align-top">
                          <FormField
                            control={form.control}
                            name={linePath<TFieldValues>(index, "discount_value")}
                            render={({ field: discountField }) => (
                              <FormItem>
                                <FormControl>
                                  <DecimalInput
                                    kind="money"
                                    className="w-full min-w-0 text-right"
                                    disabled={disabled}
                                    aria-label={`Line ${index + 1} discount`}
                                    {...discountField}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell className="min-w-48 align-top">
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
                      </>
                    )}
                    {!isReceive && !isExpense ? (
                      <TableCell className="w-28 min-w-28 align-top">
                        <LineAmountCell form={form} index={index} />
                      </TableCell>
                    ) : null}
                    {showPacking && !isReceive && !isExpense
                      ? (
                          [
                            ["item_code", "Item code", false],
                            ["packing_unit", "PKG", false],
                            ["carton_qty", "Ctns", true],
                            ["cbm", "CBM", true],
                            ["weight", "Weight", true],
                          ] as const
                        ).map(([name, label, decimal]) => (
                          <TableCell key={name} className="w-24 min-w-24 align-top">
                            <FormField
                              control={form.control}
                              name={linePath<TFieldValues>(index, name)}
                              render={({ field: packingField }) => (
                                <FormItem>
                                  <FormControl>
                                    {decimal ? (
                                      <DecimalInput
                                        kind="quantity"
                                        className="w-full min-w-0 text-right"
                                        disabled={disabled}
                                        aria-label={`Line ${index + 1} ${label}`}
                                        {...packingField}
                                      />
                                    ) : (
                                      <Input
                                        disabled={disabled}
                                        className="w-full min-w-0"
                                        aria-label={`Line ${index + 1} ${label}`}
                                        {...packingField}
                                      />
                                    )}
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                        ))
                      : null}
                    {showHsCode && !isReceive && !isExpense ? (
                      <TableCell className="w-24 min-w-24 align-top">
                        <FormField
                          control={form.control}
                          name={linePath<TFieldValues>(index, "hs_code")}
                          render={({ field: hsField }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  disabled={disabled}
                                  className="w-full min-w-0"
                                  maxLength={20}
                                  aria-label={`Line ${index + 1} HS code`}
                                  {...hsField}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                    ) : null}
                    <TableCell className="align-top">
                      {disabled ? null : (
                        <TableActionTooltip label="Remove line">
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
                        </TableActionTooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ),
              )
            )}
          </TableBody>
        </table>
      </DocumentViewTableContainer>
      {disabled ? null : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append(
              (isExpense
                ? emptyExpenseDocumentLine()
                : isMixed
                  ? emptyMixedProductLine()
                  : emptyDocumentLine()) as FieldArray<TFieldValues, ArrayPath<TFieldValues>>,
            )
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
