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
} from "react-hook-form";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { TaxFormDialog } from "@/modules/erp/accounting/taxes/components/tax-form-dialog";
import { taxPermissions } from "@/modules/erp/accounting/taxes/permissions";
import { useAllTaxes } from "@/modules/erp/accounting/taxes/queries";
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
import { useCan } from "@/shared/providers/session-provider";

const LINE_HEADERS = [
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

function linePath<TFieldValues extends FieldValues>(
  index: number,
  field: string,
): Path<TFieldValues> {
  return `lines.${index}.${field}` as Path<TFieldValues>;
}

export function DocumentLinesEditor<TFieldValues extends FieldValues>({
  form,
  disabled,
  productSide,
}: {
  form: UseFormReturn<TFieldValues>;
  disabled: boolean;
  productSide: "sales" | "purchase";
}) {
  const can = useCan();
  const productsQuery = useAllProducts();
  const unitsQuery = useAllUnits();
  const taxesQuery = useAllTaxes();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines" as ArrayPath<TFieldValues>,
  });
  const [lineCreate, setLineCreate] = useState<{
    type: "product" | "unit" | "tax";
    index: number;
  } | null>(null);
  const products = productsQuery.data ?? [];
  const units = unitsQuery.data ?? [];
  const taxes = taxesQuery.data ?? [];

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
    form.setValue(
      linePath<TFieldValues>(index, "description"),
      description as PathValue<TFieldValues, Path<TFieldValues>>,
    );
    form.setValue(
      linePath<TFieldValues>(index, "rate"),
      (rate ?? "") as PathValue<TFieldValues, Path<TFieldValues>>,
    );
    form.setValue(
      linePath<TFieldValues>(index, "unit_id"),
      (product.unit_id ?? OPTIONAL_SELECT_NONE) as PathValue<TFieldValues, Path<TFieldValues>>,
    );
    form.setValue(
      linePath<TFieldValues>(index, "tax_id"),
      (product.tax_id ?? OPTIONAL_SELECT_NONE) as PathValue<TFieldValues, Path<TFieldValues>>,
    );
  }

  function applyProduct(index: number, productId: string) {
    const product = products.find((item) => item.id === productId);
    if (!product) {
      return;
    }
    applyProductValues(index, product);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full caption-bottom text-sm">
          <TableHeader>
            <TableRow>
              {LINE_HEADERS.map((header) => (
                <TableHead key={header || "actions"}>{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.length === 0 ? (
              <TableRow>
                <TableCell colSpan={LINE_HEADERS.length} className="text-muted-foreground">
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
                  </TableCell>
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
          form.setValue(
            linePath<TFieldValues>(lineCreate.index, "product_id"),
            entity.id as PathValue<TFieldValues, Path<TFieldValues>>,
          );
          applyProductValues(lineCreate.index, entity);
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
          form.setValue(
            linePath<TFieldValues>(lineCreate.index, "unit_id"),
            entity.id as PathValue<TFieldValues, Path<TFieldValues>>,
          );
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
          form.setValue(
            linePath<TFieldValues>(lineCreate.index, "tax_id"),
            entity.id as PathValue<TFieldValues, Path<TFieldValues>>,
          );
        }}
        onOpenChange={(open) => {
          if (!open) {
            setLineCreate(null);
          }
        }}
      />
    </div>
  );
}
