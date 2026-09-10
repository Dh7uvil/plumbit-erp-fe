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
import { useDeliveryNote, useDeliveryNotes } from "@/modules/inventory-management/delivery-notes/queries";
import { deliveryNoteDisplayNumber } from "@/modules/inventory-management/delivery-notes/schemas";
import {
  useCreateSalesReturn,
  useUpdateSalesReturn,
} from "@/modules/inventory-management/sales-returns/mutations";
import {
  RETURN_DISPOSITION_HELP,
  RETURN_DISPOSITION_LABELS,
  RETURN_DISPOSITIONS,
  SALES_RETURN_REASON_LABELS,
  SALES_RETURN_REASONS,
  SalesReturnFormSchema,
  emptySalesReturnLine,
  isBlankSalesReturnLine,
  type ReturnDisposition,
  type SalesReturn,
  type SalesReturnCreateRequest,
  type SalesReturnFormValues,
  type SalesReturnLineInput,
  type SalesReturnUpdateRequest,
} from "@/modules/inventory-management/sales-returns/schemas";
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

function toLineInput(line: SalesReturnFormValues["lines"][number]): SalesReturnLineInput {
  return {
    delivery_note_line_id: line.delivery_note_line_id,
    product_id: optionalUuid(line.product_id),
    quantity: line.quantity,
    unit_id: optionalUuid(line.unit_id),
    rate: emptyToNull(line.rate) ?? "0",
    disposition: line.disposition as ReturnDisposition,
    notes: emptyToNull(line.notes),
  };
}

function toFormValues(
  doc: SalesReturn | null,
  deliveryNoteId?: string,
): SalesReturnFormValues {
  const lines = doc?.lines ?? [];
  return {
    delivery_note_id: doc?.delivery_note_id ?? deliveryNoteId ?? OPTIONAL_SELECT_NONE,
    document_date: doc?.document_date ?? todayIsoDate(),
    reason_code: doc?.reason_code ?? "OTHER",
    notes: doc?.notes ?? "",
    lines:
      lines.length === 0
        ? [emptySalesReturnLine()]
        : lines.map((line) => ({
            delivery_note_line_id: line.delivery_note_line_id,
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

export function SalesReturnForm({
  doc,
  defaultDeliveryNoteId,
  disabled = false,
  onSuccess,
}: {
  doc: SalesReturn | null;
  defaultDeliveryNoteId?: string;
  disabled?: boolean;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const isEdit = Boolean(doc);
  const createReturn = useCreateSalesReturn();
  const updateReturn = useUpdateSalesReturn();
  const notesQuery = useDeliveryNotes({ page_size: 100, status: "POSTED" }, !isEdit);
  const [writeError, setWriteError] = useState<unknown>(null);
  const form = useForm<SalesReturnFormValues>({
    resolver: zodResolver(SalesReturnFormSchema),
    defaultValues: toFormValues(doc, defaultDeliveryNoteId),
  });
  const { fields } = useFieldArray({ control: form.control, name: "lines" });
  useDirtyFormGuard(!disabled && form.formState.isDirty);
  const pending = createReturn.isPending || updateReturn.isPending;
  const deliveryNoteId = useWatch({ control: form.control, name: "delivery_note_id" });
  const selectedNoteId = optionalUuid(deliveryNoteId);
  const noteQuery = useDeliveryNote(selectedNoteId);
  const note = noteQuery.data;
  const postedNotes = notesQuery.data?.data ?? [];

  useEffect(() => {
    form.reset(toFormValues(doc, defaultDeliveryNoteId));
  }, [defaultDeliveryNoteId, doc, form]);

  const lineLabels = useMemo(() => {
    const labels = new Map<string, string>();
    for (const line of note?.lines ?? []) {
      labels.set(line.id, line.description || `Line ${line.line_number}`);
    }
    return labels;
  }, [note?.lines]);

  useEffect(() => {
    if (doc || disabled || !note) {
      return;
    }
    form.setValue(
      "lines",
      note.lines.length === 0
        ? [emptySalesReturnLine()]
        : note.lines.map((line) => ({
            delivery_note_line_id: line.id,
            product_id: line.product_id ?? OPTIONAL_SELECT_NONE,
            description: line.description,
            quantity: line.quantity,
            unit_id: line.unit_id ?? OPTIONAL_SELECT_NONE,
            rate: line.rate,
            disposition: "",
            notes: "",
          })),
    );
  }, [disabled, doc, form, note]);

  async function onSubmit(values: SalesReturnFormValues) {
    const lines = values.lines.filter((line) => !isBlankSalesReturnLine(line)).map(toLineInput);
    const payload = {
      document_date: values.document_date,
      reason_code: values.reason_code,
      notes: emptyToNull(values.notes),
      lines,
    };
    setWriteError(null);
    try {
      if (doc) {
        const update: SalesReturnUpdateRequest = payload;
        await updateReturn.mutateAsync({ id: doc.id, values: update, version: doc.version });
        toast.success("Sales return saved");
        onSuccess?.();
      } else {
        const create: SalesReturnCreateRequest = {
          ...payload,
          delivery_note_id: values.delivery_note_id,
        };
        const created = await createReturn.mutateAsync(create);
        toast.success("Sales return created");
        router.push(`/sales-returns/${created.id}`);
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
            name="delivery_note_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Delivery note</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled || Boolean(doc)}
                  placeholder="Select posted delivery note"
                  searchPlaceholder="Search delivery note…"
                  options={
                    isEdit && doc
                      ? [{ value: doc.delivery_note_id, label: "Current delivery note" }]
                      : [
                          ...(defaultDeliveryNoteId &&
                          !postedNotes.some((row) => row.id === defaultDeliveryNoteId)
                            ? [{ value: defaultDeliveryNoteId, label: "Selected delivery note" }]
                            : []),
                          ...postedNotes.map((row) => ({
                            value: row.id,
                            label: deliveryNoteDisplayNumber(row) ?? row.id,
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
                    {SALES_RETURN_REASONS.map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {SALES_RETURN_REASON_LABELS[reason]}
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
          <p className="text-muted-foreground text-xs">
            Quantity defaults to the delivery note line. The server enforces what is still
            returnable. Each line needs a disposition.
          </p>
          <ul className="text-muted-foreground list-disc pl-5 text-xs">
            {RETURN_DISPOSITIONS.map((disposition) => (
              <li key={disposition}>
                <span className="text-foreground font-medium">
                  {RETURN_DISPOSITION_LABELS[disposition]}:
                </span>{" "}
                {RETURN_DISPOSITION_HELP[disposition]}
              </li>
            ))}
          </ul>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full caption-bottom text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-3 py-2 text-left font-medium">Line</th>
                  <th className="px-3 py-2 text-right font-medium">Shipped</th>
                  <th className="px-3 py-2 text-right font-medium">Return qty</th>
                  <th className="px-3 py-2 text-left font-medium">Disposition</th>
                  <th className="px-3 py-2 text-left font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {fields.length === 0 ||
                (fields.length === 1 && !fields[0]?.delivery_note_line_id) ? (
                  <tr>
                    <td className="text-muted-foreground px-3 py-4" colSpan={5}>
                      Select a posted delivery note to load returnable lines.
                    </td>
                  </tr>
                ) : (
                  fields.map((field, index) => {
                    const noteLine = note?.lines.find(
                      (line) => line.id === field.delivery_note_line_id,
                    );
                    return (
                      <tr key={field.id} className="border-b last:border-0">
                        <td className="px-3 py-2">
                          {lineLabels.get(field.delivery_note_line_id) ??
                            noteLine?.description ??
                            "Line"}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {noteLine ? formatDecimal(noteLine.quantity) : "—"}
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
                                      <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value={OPTIONAL_SELECT_NONE}>Select</SelectItem>
                                    {RETURN_DISPOSITIONS.map((disposition) => (
                                      <SelectItem key={disposition} value={disposition}>
                                        {RETURN_DISPOSITION_LABELS[disposition]}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  {RETURN_DISPOSITIONS.includes(
                                    dispositionField.value as ReturnDisposition,
                                  )
                                    ? RETURN_DISPOSITION_HELP[
                                        dispositionField.value as ReturnDisposition
                                      ]
                                    : "Required."}
                                </FormDescription>
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
              {isEdit ? "Save Changes" : "Create sales return"}
            </Button>
          </div>
        ) : null}
      </form>
    </Form>
  );
}
