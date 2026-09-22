"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useFieldArray, useWatch } from "react-hook-form";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import type { CostSheetFormValues } from "@/modules/erp/cost-sheets/components/cost-sheet-form";
import {
  useGoodsReceipt,
  useGoodsReceipts,
} from "@/modules/inventory-management/goods-receipts/queries";
import {
  goodsReceiptDisplayNumber,
  type GoodsReceiptLine,
} from "@/modules/inventory-management/goods-receipts/schemas";
import { ProductFormDialog } from "@/modules/inventory-management/products/components/product-form-dialog";
import { productPermissions } from "@/modules/inventory-management/products/permissions";
import { useAllProducts } from "@/modules/inventory-management/products/queries";
import type { Product } from "@/modules/inventory-management/products/schemas";
import { UnitFormDialog } from "@/modules/inventory-management/units/components/unit-form-dialog";
import { unitPermissions } from "@/modules/inventory-management/units/permissions";
import { useAllUnits } from "@/modules/inventory-management/units/queries";
import { MasterSelect } from "@/shared/components/form/master-select";
import { TableActionTooltip } from "@/shared/components/data-table/row-actions";
import { DecimalInput } from "@/shared/components/form/decimal-input";
import { Button } from "@/shared/components/ui/button";
import { FormControl, FormField, FormItem, FormMessage } from "@/shared/components/ui/form";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { formatQuantity } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

export type CostSheetLineFormValues = {
  product_id: string;
  unit_id: string;
  quantity: string;
  base_rate: string;
  target_selling_price?: string;
  goods_receipt_line_id?: string;
};

export function emptyCostSheetLine(): CostSheetLineFormValues {
  return {
    product_id: OPTIONAL_SELECT_NONE,
    unit_id: OPTIONAL_SELECT_NONE,
    quantity: "1",
    base_rate: "0",
    target_selling_price: "",
    goods_receipt_line_id: OPTIONAL_SELECT_NONE,
  };
}

function grnLineLabel(line: GoodsReceiptLine, receiptNumber: string): string {
  const qty = formatQuantity(line.quantity);
  return `${receiptNumber} · L${line.line_number} · ${line.description} · qty ${qty}`;
}

export function CostSheetLinesEditor({
  form,
  disabled,
  showTargetSellingPrice,
  showGrnLink = false,
  supplierId = null,
}: {
  form: UseFormReturn<CostSheetFormValues>;
  disabled: boolean;
  showTargetSellingPrice: boolean;
  showGrnLink?: boolean;
  supplierId?: string | null;
}) {
  const can = useCan();
  const productsQuery = useAllProducts();
  const unitsQuery = useAllUnits();
  const receiptsQuery = useGoodsReceipts(
    { status: "POSTED", page_size: 50, supplier_id: supplierId ?? undefined },
    showGrnLink,
  );
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });
  const watchedLines = useWatch({ control: form.control, name: "lines" }) ?? [];
  const [lineCreate, setLineCreate] = useState<{ type: "product" | "unit"; index: number } | null>(
    null,
  );
  const [sourceReceiptId, setSourceReceiptId] = useState("");
  const receiptQuery = useGoodsReceipt(sourceReceiptId || null);
  const products = productsQuery.data ?? [];
  const units = unitsQuery.data ?? [];
  const receipts = receiptsQuery.data?.data ?? [];
  const receiptNumber =
    receiptQuery.data != null
      ? (goodsReceiptDisplayNumber(receiptQuery.data) ?? receiptQuery.data.document_number)
      : "";
  const sourceLines = useMemo(
    () => (receiptQuery.data?.lines ?? []).filter((line) => Boolean(line.product_id)),
    [receiptQuery.data?.lines],
  );

  const colSpan = 5 + (showTargetSellingPrice ? 1 : 0) + (showGrnLink ? 1 : 0);

  function applyProduct(index: number, product: Pick<Product, "unit_id">) {
    form.setValue(`lines.${index}.unit_id`, product.unit_id ?? OPTIONAL_SELECT_NONE);
  }

  function applyGrnLine(index: number, lineId: string) {
    form.setValue(`lines.${index}.goods_receipt_line_id`, lineId);
    if (lineId === OPTIONAL_SELECT_NONE) {
      return;
    }
    const line = sourceLines.find((item) => item.id === lineId);
    if (!line?.product_id) {
      return;
    }
    form.setValue(`lines.${index}.product_id`, line.product_id);
    form.setValue(`lines.${index}.unit_id`, line.unit_id ?? OPTIONAL_SELECT_NONE);
    form.setValue(`lines.${index}.quantity`, line.quantity);
    form.setValue(`lines.${index}.base_rate`, line.rate);
  }

  function grnOptionsForLine(index: number) {
    const productId = watchedLines[index]?.product_id;
    const matched =
      productId && productId !== OPTIONAL_SELECT_NONE
        ? sourceLines.filter((line) => line.product_id === productId)
        : sourceLines;
    const options = matched.map((line) => ({
      value: line.id,
      label: grnLineLabel(line, receiptNumber),
    }));
    const selected = watchedLines[index]?.goods_receipt_line_id;
    if (
      selected &&
      selected !== OPTIONAL_SELECT_NONE &&
      !options.some((option) => option.value === selected)
    ) {
      options.unshift({ value: selected, label: `Linked GRN line ${selected.slice(0, 8)}…` });
    }
    return [{ value: OPTIONAL_SELECT_NONE, label: "None" }, ...options];
  }

  return (
    <div className="flex flex-col gap-2">
      {showGrnLink && !disabled ? (
        <div className="max-w-md">
          <p className="mb-1.5 text-sm font-medium">Load GRN lines from</p>
          <MasterSelect
            asFormControl={false}
            value={sourceReceiptId || OPTIONAL_SELECT_NONE}
            onValueChange={(value) =>
              setSourceReceiptId(value === OPTIONAL_SELECT_NONE ? "" : value)
            }
            disabled={receiptsQuery.isLoading}
            placeholder="Select a posted GRN"
            searchPlaceholder="Search goods receipt…"
            options={[
              { value: OPTIONAL_SELECT_NONE, label: "None" },
              ...receipts.map((receipt) => ({
                value: receipt.id,
                label: goodsReceiptDisplayNumber(receipt) ?? receipt.document_number,
              })),
            ]}
          />
          {sourceReceiptId && !receiptQuery.isLoading && sourceLines.length === 0 ? (
            <p className="text-muted-foreground mt-1 text-xs">
              No product lines on this goods receipt.
            </p>
          ) : null}
        </div>
      ) : null}
      <div className="overflow-x-auto rounded-md border">
        <table className="w-max min-w-full caption-bottom text-sm">
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Base rate</TableHead>
              {showTargetSellingPrice ? <TableHead>Target selling price</TableHead> : null}
              {showGrnLink ? <TableHead>GRN line</TableHead> : null}
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="text-muted-foreground">
                  No lines yet.
                </TableCell>
              </TableRow>
            ) : (
              fields.map((field, index) => (
                <TableRow key={field.id}>
                  <TableCell className="min-w-64 align-top">
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
                  <TableCell className="w-32 min-w-32 align-top">
                    <FormField
                      control={form.control}
                      name={`lines.${index}.quantity`}
                      render={({ field: qtyField }) => (
                        <FormItem>
                          <FormControl>
                            <DecimalInput
                              kind="quantity"
                              className="text-right"
                              disabled={disabled}
                              aria-label={`Line ${index + 1} quantity`}
                              {...qtyField}
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
                  <TableCell className="w-36 min-w-36 align-top">
                    <FormField
                      control={form.control}
                      name={`lines.${index}.base_rate`}
                      render={({ field: rateField }) => (
                        <FormItem>
                          <FormControl>
                            <DecimalInput
                              kind="money"
                              className="text-right"
                              disabled={disabled}
                              aria-label={`Line ${index + 1} base rate`}
                              {...rateField}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  {showTargetSellingPrice ? (
                    <TableCell className="w-36 min-w-36 align-top">
                      <FormField
                        control={form.control}
                        name={`lines.${index}.target_selling_price`}
                        render={({ field: priceField }) => (
                          <FormItem>
                            <FormControl>
                              <DecimalInput
                                kind="money"
                                className="text-right"
                                disabled={disabled}
                                aria-label={`Line ${index + 1} target selling price`}
                                {...priceField}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                  ) : null}
                  {showGrnLink ? (
                    <TableCell className="min-w-64 align-top">
                      <FormField
                        control={form.control}
                        name={`lines.${index}.goods_receipt_line_id`}
                        render={({ field: grnField }) => (
                          <FormItem>
                            <MasterSelect
                              compact
                              value={grnField.value || OPTIONAL_SELECT_NONE}
                              onValueChange={(value) => applyGrnLine(index, value)}
                              disabled={disabled || (!sourceReceiptId && !grnField.value)}
                              placeholder={sourceReceiptId ? "Link GRN line" : "Load a GRN above"}
                              searchPlaceholder="Search GRN line…"
                              options={grnOptionsForLine(index)}
                            />
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
          onClick={() => append(emptyCostSheetLine())}
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
