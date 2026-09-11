"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import {
  StockWriteAlert,
  isStockWriteAlertError,
} from "@/modules/erp/period-lock/components/stock-write-alert";
import { useGoodsReceipt, useGoodsReceipts } from "@/modules/inventory-management/goods-receipts/queries";
import { goodsReceiptDisplayNumber } from "@/modules/inventory-management/goods-receipts/schemas";
import {
  useCreatePurchaseReturn,
  useUpdatePurchaseReturn,
} from "@/modules/inventory-management/purchase-returns/mutations";
import {
  PURCHASE_RETURN_DISPOSITION_HELP,
  PURCHASE_RETURN_REASON_LABELS,
  PURCHASE_RETURN_REASONS,
  PurchaseReturnFormSchema,
  emptyPurchaseReturnLine,
  isBlankPurchaseReturnLine,
  type PurchaseReturn,
  type PurchaseReturnCreateRequest,
  type PurchaseReturnDisposition,
  type PurchaseReturnFormValues,
  type PurchaseReturnLineInput,
  type PurchaseReturnUpdateRequest,
} from "@/modules/inventory-management/purchase-returns/schemas";
import { emptyToNull } from "@/modules/users-management/tenants/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { MasterSelect } from "@/shared/components/form/master-select";
import { Button } from "@/shared/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
import { formatDecimal } from "@/shared/lib/format";
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";

function todayIsoDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function optionalUuid(value: string): string | null {
  return !value || value === OPTIONAL_SELECT_NONE ? null : value;
}

function toLineInput(line: PurchaseReturnFormValues["lines"][number]): PurchaseReturnLineInput {
  return {
    goods_receipt_line_id: line.goods_receipt_line_id,
    product_id: optionalUuid(line.product_id),
    quantity: line.quantity,
    unit_id: optionalUuid(line.unit_id),
    rate: emptyToNull(line.rate) ?? "0",
    disposition: (line.disposition || "RETURN_TO_SUPPLIER") as PurchaseReturnDisposition,
    notes: emptyToNull(line.notes),
  };
}

function toFormValues(
  doc: PurchaseReturn | null,
  goodsReceiptId?: string,
): PurchaseReturnFormValues {
  const lines = doc?.lines ?? [];
  return {
    goods_receipt_id: doc?.goods_receipt_id ?? goodsReceiptId ?? OPTIONAL_SELECT_NONE,
    document_date: doc?.document_date ?? todayIsoDate(),
    reason_code: doc?.reason_code ?? "OTHER",
    notes: doc?.notes ?? "",
    lines:
      lines.length === 0
        ? [emptyPurchaseReturnLine()]
        : lines.map((line) => ({
            goods_receipt_line_id: line.goods_receipt_line_id,
            product_id: line.product_id ?? OPTIONAL_SELECT_NONE,
            description: "",
            quantity: line.quantity,
            unit_id: line.unit_id ?? OPTIONAL_SELECT_NONE,
            rate: line.rate,
            disposition: line.disposition,
            notes: line.notes ?? "",
          })),
  };
}

export function PurchaseReturnForm({
  doc,
  defaultGoodsReceiptId,
  disabled = false,
  onSuccess,
}: {
  doc: PurchaseReturn | null;
  defaultGoodsReceiptId?: string;
  disabled?: boolean;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const isEdit = Boolean(doc);
  const createReturn = useCreatePurchaseReturn();
  const updateReturn = useUpdatePurchaseReturn();
  const receiptsQuery = useGoodsReceipts({ page_size: 100, status: "POSTED" }, !isEdit);
  const [writeError, setWriteError] = useState<unknown>(null);
  const form = useForm<PurchaseReturnFormValues>({
    resolver: zodResolver(PurchaseReturnFormSchema),
    defaultValues: toFormValues(doc, defaultGoodsReceiptId),
  });
  const { fields } = useFieldArray({ control: form.control, name: "lines" });
  useDirtyFormGuard(!disabled && form.formState.isDirty);
  const pending = createReturn.isPending || updateReturn.isPending;
  const goodsReceiptId = useWatch({ control: form.control, name: "goods_receipt_id" });
  const selectedReceiptId = optionalUuid(goodsReceiptId);
  const receiptQuery = useGoodsReceipt(selectedReceiptId);
  const receipt = receiptQuery.data;
  const postedReceipts = receiptsQuery.data?.data ?? [];

  useEffect(() => {
    form.reset(toFormValues(doc, defaultGoodsReceiptId));
  }, [defaultGoodsReceiptId, doc, form]);

  const lineLabels = useMemo(() => {
    const labels = new Map<string, string>();
    for (const line of receipt?.lines ?? []) {
      labels.set(line.id, line.description || `Line ${line.line_number}`);
    }
    return labels;
  }, [receipt?.lines]);

  useEffect(() => {
    if (doc || disabled || !receipt) {
      return;
    }
    form.setValue(
      "lines",
      receipt.lines.length === 0
        ? [emptyPurchaseReturnLine()]
        : receipt.lines.map((line) => ({
            goods_receipt_line_id: line.id,
            product_id: line.product_id ?? OPTIONAL_SELECT_NONE,
            description: line.description,
            quantity: line.quantity,
            unit_id: line.unit_id ?? OPTIONAL_SELECT_NONE,
            rate: line.rate,
            disposition: "RETURN_TO_SUPPLIER",
            notes: "",
          })),
    );
  }, [disabled, doc, form, receipt]);

  async function onSubmit(values: PurchaseReturnFormValues) {
    const lines = values.lines.filter((line) => !isBlankPurchaseReturnLine(line)).map(toLineInput);
    const payload = {
      document_date: values.document_date,
      reason_code: values.reason_code,
      notes: emptyToNull(values.notes),
      lines,
    };
    setWriteError(null);
    try {
      if (doc) {
        const update: PurchaseReturnUpdateRequest = payload;
        await updateReturn.mutateAsync({ id: doc.id, values: update, version: doc.version });
        toast.success("Purchase return saved");
        onSuccess?.();
      } else {
        const create: PurchaseReturnCreateRequest = {
          ...payload,
          goods_receipt_id: values.goods_receipt_id,
        };
        const created = await createReturn.mutateAsync(create);
        toast.success("Purchase return created");
        router.push(`/purchase-returns/${created.id}`);
      }
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      if (isStockWriteAlertError(error)) {
        setWriteError(error);
        return;
      }
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Form {...form}>
      <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(onSubmit)}>
        <StockWriteAlert error={writeError} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="goods_receipt_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Goods receipt</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled || Boolean(doc)}
                  placeholder="Select posted goods receipt"
                  searchPlaceholder="Search goods receipt…"
                  options={
                    isEdit && doc
                      ? [{ value: doc.goods_receipt_id, label: "Current goods receipt" }]
                      : [
                          ...(defaultGoodsReceiptId &&
                          !postedReceipts.some((row) => row.id === defaultGoodsReceiptId)
                            ? [{ value: defaultGoodsReceiptId, label: "Selected goods receipt" }]
                            : []),
                          ...postedReceipts.map((row) => ({
                            value: row.id,
                            label: goodsReceiptDisplayNumber(row) ?? row.id,
                          })),
                        ]
                  }
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="document_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Document date</FormLabel>
                <FormControl>
                  <Input type="date" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="reason_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reason</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PURCHASE_RETURN_REASONS.map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {PURCHASE_RETURN_REASON_LABELS[reason]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea disabled={disabled} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Lines</p>
          <FormDescription>
            Quantity defaults to the goods receipt line. The server enforces what is still
            returnable. Posting consumes the original GRN cost layers.
          </FormDescription>
          <p className="text-muted-foreground text-xs">
            <span className="text-foreground font-medium">Return to supplier:</span>{" "}
            {PURCHASE_RETURN_DISPOSITION_HELP.RETURN_TO_SUPPLIER}
          </p>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full caption-bottom text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-3 py-2 text-left font-medium">Line</th>
                  <th className="px-3 py-2 text-right font-medium">Received</th>
                  <th className="px-3 py-2 text-right font-medium">Return qty</th>
                  <th className="px-3 py-2 text-left font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {fields.length === 0 ||
                (fields.length === 1 && !fields[0]?.goods_receipt_line_id) ? (
                  <tr>
                    <td className="text-muted-foreground px-3 py-4" colSpan={4}>
                      Select a posted goods receipt to load returnable lines.
                    </td>
                  </tr>
                ) : (
                  fields.map((field, index) => {
                    const receiptLine = receipt?.lines.find(
                      (line) => line.id === field.goods_receipt_line_id,
                    );
                    return (
                      <tr key={field.id} className="border-b last:border-0">
                        <td className="px-3 py-2">
                          {lineLabels.get(field.goods_receipt_line_id) ??
                            receiptLine?.description ??
                            "Line"}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {receiptLine ? formatDecimal(receiptLine.quantity) : "—"}
                        </td>
                        <td className="w-28 px-3 py-2 align-top">
                          <FormField
                            control={form.control}
                            name={`lines.${index}.quantity`}
                            render={({ field: qtyField }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    inputMode="decimal"
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
                        </td>
                        <td className="min-w-40 px-3 py-2 align-top">
                          <FormField
                            control={form.control}
                            name={`lines.${index}.notes`}
                            render={({ field: notesField }) => (
                              <FormItem>
                                <FormControl>
                                  <Input disabled={disabled} {...notesField} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        {!disabled ? (
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {isEdit ? "Save Changes" : "Create purchase return"}
            </Button>
          </div>
        ) : null}
      </form>
    </Form>
  );
}
