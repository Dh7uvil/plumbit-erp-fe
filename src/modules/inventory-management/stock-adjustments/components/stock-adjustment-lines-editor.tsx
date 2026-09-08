"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useFieldArray } from "react-hook-form";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { ProductFormDialog } from "@/modules/inventory-management/products/components/product-form-dialog";
import { productPermissions } from "@/modules/inventory-management/products/permissions";
import { useAllProducts } from "@/modules/inventory-management/products/queries";
import type { Product } from "@/modules/inventory-management/products/schemas";
import type {
  StockAdjustmentFormValues,
  StockAdjustmentLineFormValues,
} from "@/modules/inventory-management/stock-adjustments/schemas";
import { UnitFormDialog } from "@/modules/inventory-management/units/components/unit-form-dialog";
import { unitPermissions } from "@/modules/inventory-management/units/permissions";
import { useAllUnits } from "@/modules/inventory-management/units/queries";
import { MasterSelect } from "@/shared/components/form/master-select";
import { Button } from "@/shared/components/ui/button";
import { FormControl, FormField, FormItem, FormMessage } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { formatDecimal } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

export function emptyAdjustmentLine(): StockAdjustmentLineFormValues {
  return {
    product_id: OPTIONAL_SELECT_NONE,
    unit_id: OPTIONAL_SELECT_NONE,
    qty_delta: "",
    qty_counted: "",
    notes: "",
  };
}

export function StockAdjustmentLinesEditor({
  form,
  disabled,
  isCount,
  bookedByProductId,
}: {
  form: UseFormReturn<StockAdjustmentFormValues>;
  disabled: boolean;
  isCount: boolean;
  bookedByProductId?: Map<string, string | null>;
}) {
  const can = useCan();
  const productsQuery = useAllProducts();
  const unitsQuery = useAllUnits();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });
  const [lineCreate, setLineCreate] = useState<{ type: "product" | "unit"; index: number } | null>(
    null,
  );
  const products = (productsQuery.data ?? []).filter(
    (product) => product.item_type === "PRODUCT" && product.track_inventory,
  );
  const units = unitsQuery.data ?? [];
  const qtyHeader = isCount ? "Counted qty" : "Adjust by";
  const showBooked = Boolean(bookedByProductId?.size);

  function applyProduct(index: number, product: Pick<Product, "unit_id">) {
    form.setValue(`lines.${index}.unit_id`, product.unit_id ?? OPTIONAL_SELECT_NONE);
  }

  function onLastFieldKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (disabled) {
      return;
    }
    if (event.key === "Enter" && index === fields.length - 1) {
      event.preventDefault();
      append(emptyAdjustmentLine());
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full caption-bottom text-sm">
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>{qtyHeader}</TableHead>
              {showBooked ? <TableHead>Booked</TableHead> : null}
              {showBooked && isCount ? <TableHead>Delta</TableHead> : null}
              <TableHead>Notes</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showBooked ? 7 : 5} className="text-muted-foreground">
                  No lines yet.
                </TableCell>
              </TableRow>
            ) : (
              fields.map((field, index) => {
                const productId = form.watch(`lines.${index}.product_id`);
                const booked =
                  productId && bookedByProductId ? bookedByProductId.get(productId) : null;
                return (
                  <TableRow key={field.id}>
                    <TableCell className="min-w-48 align-top">
                      <FormField
                        control={form.control}
                        name={`lines.${index}.product_id`}
                        render={({ field: productField }) => (
                          <FormItem>
                            <MasterSelect
                              compact
                              value={productField.value}
                              onValueChange={(value) => {
                                productField.onChange(value);
                                const product = products.find((item) => item.id === value);
                                if (product) {
                                  applyProduct(index, product);
                                }
                              }}
                              disabled={disabled || productsQuery.isLoading}
                              placeholder="Select product"
                              searchPlaceholder="Search product…"
                              createLabel="Create product"
                              onCreate={
                                can(productPermissions.create)
                                  ? () => setLineCreate({ type: "product", index })
                                  : undefined
                              }
                              options={[
                                { value: OPTIONAL_SELECT_NONE, label: "Select product" },
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
                    <TableCell className="min-w-32 align-top">
                      <FormField
                        control={form.control}
                        name={`lines.${index}.unit_id`}
                        render={({ field: unitField }) => (
                          <FormItem>
                            <MasterSelect
                              compact
                              value={unitField.value}
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
                                ...units.map((unit) => ({ value: unit.id, label: unit.code })),
                              ]}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell className="w-32 align-top">
                      {isCount ? (
                        <FormField
                          control={form.control}
                          name={`lines.${index}.qty_counted`}
                          render={({ field: countedField }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  inputMode="decimal"
                                  className="text-right"
                                  disabled={disabled}
                                  aria-label={`Line ${index + 1} counted quantity`}
                                  onKeyDown={(event) => onLastFieldKeyDown(index, event)}
                                  {...countedField}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : (
                        <FormField
                          control={form.control}
                          name={`lines.${index}.qty_delta`}
                          render={({ field: deltaField }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  inputMode="decimal"
                                  className="text-right"
                                  disabled={disabled}
                                  aria-label={`Line ${index + 1} adjust by`}
                                  onKeyDown={(event) => onLastFieldKeyDown(index, event)}
                                  {...deltaField}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </TableCell>
                    {showBooked ? (
                      <TableCell className="text-right tabular-nums">
                        {formatDecimal(booked ?? null)}
                      </TableCell>
                    ) : null}
                    {showBooked && isCount ? (
                      <TableCell className="text-right tabular-nums">
                        {formatDecimal(form.watch(`lines.${index}.qty_delta`) || null)}
                      </TableCell>
                    ) : null}
                    <TableCell className="min-w-40 align-top">
                      <FormField
                        control={form.control}
                        name={`lines.${index}.notes`}
                        render={({ field: notesField }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                disabled={disabled}
                                aria-label={`Line ${index + 1} notes`}
                                {...notesField}
                              />
                            </FormControl>
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
                );
              })
            )}
          </TableBody>
        </table>
      </div>
      {disabled ? null : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append(emptyAdjustmentLine())}
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
          form.setValue(`lines.${lineCreate.index}.product_id`, entity.id);
          applyProduct(lineCreate.index, entity);
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
          form.setValue(`lines.${lineCreate.index}.unit_id`, entity.id);
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
