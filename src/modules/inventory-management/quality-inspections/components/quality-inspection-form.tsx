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
import { qtyIsPositive } from "@/modules/inventory-management/goods-receipts/schemas";
import {
  useCreateQualityInspection,
  useUpdateQualityInspection,
} from "@/modules/inventory-management/quality-inspections/mutations";
import {
  QC_DISPOSITION_LABELS,
  QC_DISPOSITIONS,
  QualityInspectionFormSchema,
  type QualityInspection,
  type QualityInspectionCreateRequest,
  type QualityInspectionFormValues,
  type QualityInspectionLineFormValues,
  type QualityInspectionLineInput,
  type QualityInspectionUpdateRequest,
} from "@/modules/inventory-management/quality-inspections/schemas";
import { emptyToNull } from "@/modules/users-management/tenants/schemas";
import { userPermissions } from "@/modules/users-management/users/permissions";
import { useAllUsers } from "@/modules/users-management/users/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { MasterSelect } from "@/shared/components/form/master-select";
import { Button } from "@/shared/components/ui/button";
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
import { formatDecimal } from "@/shared/lib/format";
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";
import { useCan } from "@/shared/providers/session-provider";

function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function optionalUuid(value: string): string | null {
  return !value || value === OPTIONAL_SELECT_NONE ? null : value;
}

function optionalDisposition(value: string): QualityInspectionLineInput["disposition"] {
  return QC_DISPOSITIONS.includes(value as (typeof QC_DISPOSITIONS)[number])
    ? (value as (typeof QC_DISPOSITIONS)[number])
    : null;
}

function toLineInput(line: QualityInspectionLineFormValues): QualityInspectionLineInput {
  return {
    goods_receipt_line_id: line.goods_receipt_line_id,
    qty_inspected: line.qty_inspected.trim() || "0",
    qty_accepted: line.qty_accepted.trim() || "0",
    qty_rejected: line.qty_rejected.trim() || "0",
    qty_rework: line.qty_rework.trim() || "0",
    disposition: optionalDisposition(line.disposition),
    notes: emptyToNull(line.notes),
  };
}

function emptyInspectionLine(
  goodsReceiptLineId = "",
  qty = "",
): QualityInspectionLineFormValues {
  return {
    goods_receipt_line_id: goodsReceiptLineId,
    qty_inspected: qty,
    qty_accepted: qty,
    qty_rejected: "0",
    qty_rework: "0",
    disposition: "",
    notes: "",
  };
}

function toFormValues(
  inspection: QualityInspection | null,
  goodsReceiptId?: string,
): QualityInspectionFormValues {
  return {
    goods_receipt_id: inspection?.goods_receipt_id ?? goodsReceiptId ?? OPTIONAL_SELECT_NONE,
    inspection_date: inspection?.inspection_date ?? todayIsoDate(),
    inspector_user_id: inspection?.inspector_user_id ?? OPTIONAL_SELECT_NONE,
    notes: inspection?.notes ?? "",
    lines: inspection?.lines.length
      ? inspection.lines.map((line) => ({
          goods_receipt_line_id: line.goods_receipt_line_id,
          qty_inspected: line.qty_inspected,
          qty_accepted: line.qty_accepted,
          qty_rejected: line.qty_rejected,
          qty_rework: line.qty_rework,
          disposition: line.disposition ?? "",
          notes: line.notes ?? "",
        }))
      : [],
  };
}

export function QualityInspectionForm({
  inspection,
  defaultGoodsReceiptId,
  disabled = false,
  onSuccess,
}: {
  inspection: QualityInspection | null;
  defaultGoodsReceiptId?: string;
  disabled?: boolean;
  onSuccess?: () => void;
}) {
  const can = useCan();
  const router = useRouter();
  const isEdit = Boolean(inspection);
  const createInspection = useCreateQualityInspection();
  const updateInspection = useUpdateQualityInspection();
  const canReadUsers = can(userPermissions.read);
  const usersQuery = useAllUsers(canReadUsers);
  const receiptsQuery = useGoodsReceipts({ page_size: 100, status: "POSTED" }, !isEdit);
  const [writeError, setWriteError] = useState<unknown>(null);
  const form = useForm<QualityInspectionFormValues>({
    resolver: zodResolver(QualityInspectionFormSchema),
    defaultValues: toFormValues(inspection, defaultGoodsReceiptId),
  });
  const { fields } = useFieldArray({ control: form.control, name: "lines" });
  useDirtyFormGuard(!disabled && form.formState.isDirty);
  const pending = createInspection.isPending || updateInspection.isPending;
  const goodsReceiptId = useWatch({ control: form.control, name: "goods_receipt_id" });
  const selectedReceiptId = optionalUuid(goodsReceiptId);
  const receiptQuery = useGoodsReceipt(selectedReceiptId);
  const receipt = receiptQuery.data;
  const users = usersQuery.data ?? [];
  const postedReceipts = receiptsQuery.data?.data ?? [];

  useEffect(() => {
    form.reset(toFormValues(inspection, defaultGoodsReceiptId));
  }, [defaultGoodsReceiptId, form, inspection]);

  const lineLabels = useMemo(() => {
    const labels = new Map<string, string>();
    for (const line of receipt?.lines ?? []) {
      labels.set(line.id, line.description || `Line ${line.line_number}`);
    }
    return labels;
  }, [receipt?.lines]);

  useEffect(() => {
    if (inspection || disabled) {
      return;
    }
    if (!receipt) {
      return;
    }
    const current = form.getValues("lines");
    if (current.length > 0) {
      return;
    }
    const holdLines = receipt.lines.filter((line) => qtyIsPositive(line.qty_on_hold));
    form.setValue(
      "lines",
      holdLines.map((line) => emptyInspectionLine(line.id, line.qty_on_hold)),
    );
  }, [disabled, form, inspection, receipt]);

  async function onSubmit(values: QualityInspectionFormValues) {
    const lines = values.lines.map(toLineInput);
    const payload = {
      inspection_date: values.inspection_date,
      inspector_user_id: optionalUuid(values.inspector_user_id),
      notes: emptyToNull(values.notes),
      lines,
    };
    setWriteError(null);
    try {
      if (inspection) {
        const update: QualityInspectionUpdateRequest = payload;
        await updateInspection.mutateAsync({
          id: inspection.id,
          values: update,
          version: inspection.version,
        });
        toast.success("Quality inspection saved");
        onSuccess?.();
      } else {
        const create: QualityInspectionCreateRequest = {
          ...payload,
          goods_receipt_id: values.goods_receipt_id,
        };
        const created = await createInspection.mutateAsync(create);
        toast.success("Quality inspection created");
        router.push(`/quality-inspections/${created.id}`);
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
        <StockWriteAlert periodLocked={Boolean(inspection?.period_locked)} error={writeError} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <FormField
            control={form.control}
            name="goods_receipt_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Goods receipt</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    form.setValue("lines", []);
                  }}
                  disabled={disabled || isEdit || Boolean(defaultGoodsReceiptId)}
                  placeholder="Select goods receipt"
                  searchPlaceholder="Search goods receipt…"
                  options={
                    isEdit && inspection
                      ? [{ value: inspection.goods_receipt_id, label: "Current goods receipt" }]
                      : postedReceipts.map((row) => ({
                          value: row.id,
                          label: row.document_number || row.id,
                        }))
                  }
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="inspection_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Inspection date</FormLabel>
                <FormControl>
                  <Input type="date" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {canReadUsers ? (
            <FormField
              control={form.control}
              name="inspector_user_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inspector</FormLabel>
                  <MasterSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={disabled || usersQuery.isLoading}
                    placeholder="None"
                    searchPlaceholder="Search user…"
                    options={[
                      { value: OPTIONAL_SELECT_NONE, label: "None" },
                      ...users.map((user) => ({
                        value: user.id,
                        label: user.name,
                      })),
                    ]}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}
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
          <p className="text-muted-foreground text-xs">
            Accepted, rejected, and rework must add up to inspected quantity. Rejected quantity
            needs a disposition.
          </p>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full caption-bottom text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-3 py-2 text-left font-medium">Line</th>
                  <th className="px-3 py-2 text-right font-medium">On hold</th>
                  <th className="px-3 py-2 text-right font-medium">Inspected</th>
                  <th className="px-3 py-2 text-right font-medium">Accepted</th>
                  <th className="px-3 py-2 text-right font-medium">Rejected</th>
                  <th className="px-3 py-2 text-right font-medium">Rework</th>
                  <th className="px-3 py-2 text-left font-medium">Disposition</th>
                  <th className="px-3 py-2 text-left font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {fields.length === 0 ? (
                  <tr>
                    <td className="text-muted-foreground px-3 py-4" colSpan={8}>
                      Select a posted goods receipt with quantity on hold.
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
                          {receiptLine ? formatDecimal(receiptLine.qty_on_hold) : "—"}
                        </td>
                        {(
                          [
                            "qty_inspected",
                            "qty_accepted",
                            "qty_rejected",
                            "qty_rework",
                          ] as const
                        ).map((name) => (
                          <td key={name} className="w-28 px-3 py-2 align-top">
                            <FormField
                              control={form.control}
                              name={`lines.${index}.${name}`}
                              render={({ field: qtyField }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      inputMode="decimal"
                                      className="text-right"
                                      disabled={disabled}
                                      aria-label={`Line ${index + 1} ${name.replace("qty_", "")}`}
                                      {...qtyField}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </td>
                        ))}
                        <td className="min-w-44 px-3 py-2 align-top">
                          <FormField
                            control={form.control}
                            name={`lines.${index}.disposition`}
                            render={({ field: dispositionField }) => (
                              <FormItem>
                                <Select
                                  value={dispositionField.value || OPTIONAL_SELECT_NONE}
                                  onValueChange={(value) =>
                                    dispositionField.onChange(
                                      value === OPTIONAL_SELECT_NONE ? "" : value,
                                    )
                                  }
                                  disabled={disabled}
                                >
                                  <FormControl>
                                    <SelectTrigger aria-label={`Line ${index + 1} disposition`}>
                                      <SelectValue placeholder="None" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value={OPTIONAL_SELECT_NONE}>None</SelectItem>
                                    {QC_DISPOSITIONS.map((disposition) => (
                                      <SelectItem key={disposition} value={disposition}>
                                        {QC_DISPOSITION_LABELS[disposition]}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
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
              {isEdit ? "Save Changes" : "Create inspection"}
            </Button>
          </div>
        ) : null}
      </form>
    </Form>
  );
}
