"use client";

import { Trash2 } from "lucide-react";
import {
  type FieldValues,
  type Path,
  type PathValue,
  type UseFormReturn,
  useWatch,
} from "react-hook-form";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import type { Tax } from "@/modules/erp/accounting/taxes/schemas";
import type { Account } from "@/modules/erp/accounting/accounts/schemas";
import type { SupplierProduct } from "@/modules/erp/supplier-products/schemas";
import type { Unit } from "@/modules/inventory-management/units/schemas";
import {
  DISCOUNT_TYPE_LABELS,
  DISCOUNT_TYPES,
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
} from "@/shared/components/document/schemas";
import { TableActionTooltip } from "@/shared/components/data-table/row-actions";
import { MasterSelect } from "@/shared/components/form/master-select";
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
import { TableCell, TableRow } from "@/shared/components/ui/table";

function linePath<TFieldValues extends FieldValues>(
  index: number,
  field: string,
): Path<TFieldValues> {
  return `lines.${index}.${field}` as Path<TFieldValues>;
}

function ExpenseLineAmountCell({
  form,
  index,
}: {
  form: UseFormReturn<FieldValues>;
  index: number;
}) {
  const rate = useWatch({ control: form.control, name: linePath(index, "rate") });
  return (
    <span className="block min-h-9 py-2 text-right text-sm tabular-nums">
      {String(rate ?? "").trim() ? String(rate) : "—"}
    </span>
  );
}

function LineAmountPreview({ form, index }: { form: UseFormReturn<FieldValues>; index: number }) {
  const quantity = useWatch({ control: form.control, name: linePath(index, "quantity") });
  const rate = useWatch({ control: form.control, name: linePath(index, "rate") });
  const discountType = useWatch({ control: form.control, name: linePath(index, "discount_type") });
  const discountValue = useWatch({
    control: form.control,
    name: linePath(index, "discount_value"),
  });
  const qty = Number(quantity ?? "");
  const unitRate = Number(rate ?? "");
  if (!Number.isFinite(qty) || !Number.isFinite(unitRate) || String(rate ?? "").trim() === "") {
    return <span className="block min-h-9 py-2 text-right text-sm">—</span>;
  }
  let net = qty * unitRate;
  const type = discountType && discountType !== OPTIONAL_SELECT_NONE ? String(discountType) : "";
  const disc = Number(discountValue ?? "");
  if (Number.isFinite(disc) && disc !== 0) {
    if (type === "PERCENTAGE") {
      net -= net * (disc / 100);
    } else if (type === "AMOUNT") {
      net -= disc;
    }
  }
  return (
    <span className="block min-h-9 py-2 text-right text-sm tabular-nums">
      {Number.isFinite(net) ? net.toFixed(2) : "—"}
    </span>
  );
}

export function MixedDocumentLineRow<TFieldValues extends FieldValues>({
  form,
  index,
  disabled,
  productOptions,
  units,
  taxes,
  accounts,
  catalog,
  supplierId,
  showSupplierSku,
  onApplyProduct,
  onApplyCatalogRow,
  onRemove,
  onCreateProduct,
  onCreateUnit,
  onCreateTax,
}: {
  form: UseFormReturn<TFieldValues>;
  index: number;
  disabled: boolean;
  productOptions: Array<{ value: string; label: string }>;
  units: Unit[];
  taxes: Tax[];
  accounts: Account[];
  catalog: SupplierProduct[];
  supplierId: string | null;
  showSupplierSku: boolean;
  onApplyProduct: (index: number, productId: string) => void;
  onApplyCatalogRow: (index: number, row: SupplierProduct) => void;
  onRemove: (index: number) => void;
  onCreateProduct?: (index: number) => void;
  onCreateUnit?: (index: number) => void;
  onCreateTax?: (index: number) => void;
}) {
  const lineType = useWatch({
    control: form.control,
    name: linePath<TFieldValues>(index, "line_type"),
  });
  const isExpense = String(lineType ?? "PRODUCT") === "EXPENSE";

  function setLineValue(field: string, value: string) {
    form.setValue(
      linePath<TFieldValues>(index, field),
      value as PathValue<TFieldValues, Path<TFieldValues>>,
    );
  }

  return (
    <TableRow>
      <TableCell className="min-w-28 align-top">
        <FormField
          control={form.control}
          name={linePath<TFieldValues>(index, "line_type")}
          render={({ field }) => (
            <FormItem>
              <Select
                value={String(field.value ?? "PRODUCT")}
                onValueChange={field.onChange}
                disabled={disabled}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="PRODUCT">Product</SelectItem>
                  <SelectItem value="EXPENSE">Expense</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </TableCell>
      {isExpense ? (
        <>
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
                    disabled={disabled}
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
          {showSupplierSku ? (
            <TableCell className="text-muted-foreground text-sm">—</TableCell>
          ) : null}
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
        </>
      ) : (
        <>
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
                        onApplyProduct(index, value);
                      }
                    }}
                    disabled={disabled}
                    placeholder="Custom line"
                    searchPlaceholder="Search product…"
                    createLabel={onCreateProduct ? "Create product" : undefined}
                    onCreate={onCreateProduct ? () => onCreateProduct(index) : undefined}
                    options={[
                      { value: OPTIONAL_SELECT_NONE, label: "Custom line" },
                      ...productOptions,
                    ]}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </TableCell>
          {showSupplierSku ? (
            <TableCell className="min-w-48 align-top">
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
                          setLineValue("supplier_sku", "");
                          return;
                        }
                        const row = catalog.find((item) => item.id === value);
                        if (row) {
                          onApplyCatalogRow(index, row);
                        }
                      }}
                      disabled={!supplierId || disabled}
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
            </TableCell>
          ) : null}
          <TableCell className="text-muted-foreground min-w-36 text-sm">—</TableCell>
        </>
      )}
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
      {isExpense ? (
        <>
          <TableCell className="text-muted-foreground text-sm">—</TableCell>
          <TableCell className="text-muted-foreground text-sm">—</TableCell>
        </>
      ) : (
        <>
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
                    disabled={disabled}
                    placeholder="None"
                    searchPlaceholder="Search unit…"
                    createLabel={onCreateUnit ? "Create unit" : undefined}
                    onCreate={onCreateUnit ? () => onCreateUnit(index) : undefined}
                    options={[
                      { value: OPTIONAL_SELECT_NONE, label: "None" },
                      ...units.map((unit) => ({ value: unit.id, label: unit.code })),
                    ]}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </TableCell>
        </>
      )}
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
                  aria-label={`Line ${index + 1} ${isExpense ? "amount" : "rate"}`}
                  {...rateField}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </TableCell>
      {isExpense ? (
        <>
          <TableCell className="text-muted-foreground text-sm">—</TableCell>
          <TableCell className="text-muted-foreground text-sm">—</TableCell>
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
                      {...discountField}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TableCell>
        </>
      )}
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
                disabled={disabled}
                placeholder="None"
                searchPlaceholder="Search tax…"
                createLabel={onCreateTax ? "Create tax" : undefined}
                onCreate={onCreateTax ? () => onCreateTax(index) : undefined}
                options={[
                  { value: OPTIONAL_SELECT_NONE, label: "None" },
                  ...taxes.map((tax) => ({ value: tax.id, label: tax.name })),
                ]}
              />
              <FormMessage />
            </FormItem>
          )}
        />
      </TableCell>
      <TableCell className="w-28 min-w-28 align-top">
        {isExpense ? (
          <ExpenseLineAmountCell form={form as UseFormReturn<FieldValues>} index={index} />
        ) : (
          <LineAmountPreview form={form as UseFormReturn<FieldValues>} index={index} />
        )}
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
              onClick={() => onRemove(index)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </TableActionTooltip>
        )}
      </TableCell>
    </TableRow>
  );
}
