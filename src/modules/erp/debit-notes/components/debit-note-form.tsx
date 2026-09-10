"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { useCreateDebitNote, useUpdateDebitNote } from "@/modules/erp/debit-notes/mutations";
import {
  DEBIT_NOTE_REASON_LABELS,
  DEBIT_NOTE_REASONS,
  DISCOUNT_TYPES,
  DebitNoteFormSchema,
  PLACE_OF_SUPPLY_LABELS,
  PLACES_OF_SUPPLY,
  isBlankDebitNoteLine,
  type DebitNote,
  type DebitNoteCreateRequest,
  type DebitNoteFormValues,
  type DebitNoteLineFormValues,
  type DebitNoteLineInput,
  type DebitNoteReason,
  type DebitNoteUpdateRequest,
  type DiscountType,
  type PlaceOfSupply,
} from "@/modules/erp/debit-notes/schemas";
import { usePurchaseInvoice, usePurchaseInvoices } from "@/modules/erp/purchase-invoices/queries";
import { purchaseInvoiceDisplayNumber } from "@/modules/erp/purchase-invoices/schemas";
import { useAllSuppliers } from "@/modules/erp/suppliers/queries";
import { emptyToNull } from "@/modules/users-management/tenants/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { emptyDocumentLine } from "@/shared/components/document/schemas";
import { DocumentLinesEditor } from "@/shared/components/document/document-lines-editor";
import { DocumentTotalsPanel } from "@/shared/components/document/document-totals-panel";
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
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";

function todayIsoDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function optionalUuid(value: string): string | null {
  return !value || value === OPTIONAL_SELECT_NONE ? null : value;
}

function toLineInput(line: DebitNoteLineFormValues): DebitNoteLineInput {
  return {
    product_id: optionalUuid(line.product_id),
    description: emptyToNull(line.description),
    quantity: line.quantity.trim(),
    unit_id: optionalUuid(line.unit_id),
    rate: emptyToNull(line.rate),
    purchase_invoice_line_id: line.purchase_invoice_line_id ?? "",
    expense_account_id: optionalUuid(line.expense_account_id ?? ""),
    discount_type: DISCOUNT_TYPES.includes(line.discount_type as DiscountType)
      ? (line.discount_type as DiscountType)
      : null,
    discount_value: emptyToNull(line.discount_value),
    tax_id: optionalUuid(line.tax_id),
  };
}

function emptyLine(): DebitNoteLineFormValues {
  return {
    ...emptyDocumentLine(),
    purchase_invoice_line_id: "",
    expense_account_id: OPTIONAL_SELECT_NONE,
  };
}

function toFormLines(note: DebitNote | null): DebitNoteLineFormValues[] {
  const lines = note?.lines ?? [];
  if (lines.length === 0) {
    return [emptyLine()];
  }
  return lines.map((line) => ({
    product_id: line.product_id ?? OPTIONAL_SELECT_NONE,
    description: line.description ?? "",
    quantity: line.quantity,
    unit_id: line.unit_id ?? OPTIONAL_SELECT_NONE,
    rate: line.rate ?? "",
    discount_type: line.discount_type ?? OPTIONAL_SELECT_NONE,
    discount_value: line.discount_value ?? "",
    tax_id: line.tax_id ?? OPTIONAL_SELECT_NONE,
    purchase_invoice_line_id: line.purchase_invoice_line_id,
    expense_account_id: line.expense_account_id ?? OPTIONAL_SELECT_NONE,
  }));
}

function toFormValues(note: DebitNote | null): DebitNoteFormValues {
  return {
    purchase_invoice_id: note?.purchase_invoice_id ?? OPTIONAL_SELECT_NONE,
    supplier_id: note?.supplier_id ?? OPTIONAL_SELECT_NONE,
    reason_code: note?.reason_code ?? "PRICE_ADJUSTMENT",
    branch_id: note?.branch_id ?? OPTIONAL_SELECT_NONE,
    debit_note_date: note?.debit_note_date ?? todayIsoDate(),
    currency_id: note?.currency_id ?? OPTIONAL_SELECT_NONE,
    notes: note?.notes ?? "",
    discount_type: note?.discount_type ?? OPTIONAL_SELECT_NONE,
    discount_value: note?.discount_value ?? "",
    shipping_amount: note?.shipping_amount ?? "0",
    adjustment_amount: note?.adjustment_amount ?? "0",
    round_off_amount: note?.round_off_amount ?? "0",
    place_of_supply: note?.place_of_supply ?? OPTIONAL_SELECT_NONE,
    lines: toFormLines(note),
  };
}

function toCreateRequest(values: DebitNoteFormValues): DebitNoteCreateRequest {
  return {
    purchase_invoice_id: values.purchase_invoice_id,
    supplier_id: values.supplier_id,
    reason_code: values.reason_code,
    branch_id: optionalUuid(values.branch_id),
    debit_note_date: emptyToNull(values.debit_note_date),
    currency_id: optionalUuid(values.currency_id),
    notes: emptyToNull(values.notes),
    discount_type: DISCOUNT_TYPES.includes(values.discount_type as DiscountType)
      ? (values.discount_type as DiscountType)
      : null,
    discount_value: emptyToNull(values.discount_value),
    shipping_amount: values.shipping_amount.trim() || "0",
    adjustment_amount: values.adjustment_amount.trim() || "0",
    round_off_amount: values.round_off_amount.trim() || "0",
    place_of_supply: PLACES_OF_SUPPLY.includes(values.place_of_supply as PlaceOfSupply)
      ? (values.place_of_supply as PlaceOfSupply)
      : null,
    lines: values.lines.filter((line) => !isBlankDebitNoteLine(line)).map(toLineInput),
  };
}

function toUpdateRequest(values: DebitNoteFormValues): DebitNoteUpdateRequest {
  const created = toCreateRequest(values);
  return {
    reason_code: created.reason_code,
    branch_id: created.branch_id,
    debit_note_date: created.debit_note_date,
    currency_id: created.currency_id,
    notes: created.notes,
    discount_type: created.discount_type,
    discount_value: created.discount_value,
    shipping_amount: created.shipping_amount,
    adjustment_amount: created.adjustment_amount,
    round_off_amount: created.round_off_amount,
    place_of_supply: created.place_of_supply,
    lines: created.lines,
  };
}

export function DebitNoteForm({
  note,
  disabled = false,
  onSuccess,
}: {
  note: DebitNote | null;
  disabled?: boolean;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const createNote = useCreateDebitNote();
  const updateNote = useUpdateDebitNote();
  const suppliersQuery = useAllSuppliers();
  const currenciesQuery = useAllCurrencies();
  const billsQuery = usePurchaseInvoices({ status: "POSTED", page_size: 100 }, !note);
  const [formError, setFormError] = useState<string | null>(null);
  const sourced = Boolean(note?.lines.some((line) => line.purchase_invoice_line_id));

  const form = useForm<DebitNoteFormValues>({
    resolver: zodResolver(DebitNoteFormSchema),
    defaultValues: toFormValues(note),
    values: note ? toFormValues(note) : undefined,
  });
  useDirtyFormGuard(form.formState.isDirty && !disabled);

  const purchaseInvoiceId = useWatch({ control: form.control, name: "purchase_invoice_id" });
  const selectedBillId = optionalUuid(purchaseInvoiceId);
  const billQuery = usePurchaseInvoice(!note ? selectedBillId : null);
  const suppliers = suppliersQuery.data ?? [];
  const currencies = currenciesQuery.data ?? [];
  const bills = billsQuery.data?.data ?? [];

  useEffect(() => {
    const bill = billQuery.data;
    if (!bill || note) {
      return;
    }
    form.setValue("supplier_id", bill.supplier_id);
    form.setValue("currency_id", bill.currency_id);
    form.setValue(
      "lines",
      bill.lines.length === 0
        ? [emptyLine()]
        : bill.lines.map((line) => ({
            product_id: line.product_id ?? OPTIONAL_SELECT_NONE,
            description: line.description ?? "",
            quantity: line.quantity,
            unit_id: line.unit_id ?? OPTIONAL_SELECT_NONE,
            rate: line.rate ?? "",
            discount_type: line.discount_type ?? OPTIONAL_SELECT_NONE,
            discount_value: line.discount_value ?? "",
            tax_id: line.tax_id ?? OPTIONAL_SELECT_NONE,
            purchase_invoice_line_id: line.id,
            expense_account_id: line.expense_account_id ?? OPTIONAL_SELECT_NONE,
          })),
    );
  }, [billQuery.data, form, note]);

  async function onSubmit(values: DebitNoteFormValues) {
    setFormError(null);
    try {
      if (note) {
        await updateNote.mutateAsync({
          id: note.id,
          values: toUpdateRequest(values),
          version: note.version,
        });
        toast.success("Debit note saved");
        onSuccess?.();
      } else {
        const created = await createNote.mutateAsync(toCreateRequest(values));
        toast.success("Debit note created");
        router.push(`/debit-notes/${created.id}`);
      }
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createNote.isPending || updateNote.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
        {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <FormField
            control={form.control}
            name="purchase_invoice_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase invoice</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled || Boolean(note) || billsQuery.isLoading}
                  placeholder="Select a bill"
                  searchPlaceholder="Search bill…"
                  options={[
                    { value: OPTIONAL_SELECT_NONE, label: "Select a bill" },
                    ...bills.map((bill) => ({
                      value: bill.id,
                      label: purchaseInvoiceDisplayNumber(bill) ?? bill.document_number,
                    })),
                  ]}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="supplier_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled
                  placeholder="Supplier"
                  searchPlaceholder="Search supplier…"
                  options={suppliers.map((supplier) => ({
                    value: supplier.id,
                    label: supplier.name,
                  }))}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="debit_note_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Debit note date</FormLabel>
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
                <Select
                  value={field.value}
                  onValueChange={(value) => field.onChange(value as DebitNoteReason)}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DEBIT_NOTE_REASONS.map((code) => (
                      <SelectItem key={code} value={code}>
                        {DEBIT_NOTE_REASON_LABELS[code]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="currency_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled || currenciesQuery.isLoading}
                  placeholder="Select currency"
                  searchPlaceholder="Search currency…"
                  options={currencies.map((currency) => ({
                    value: currency.id,
                    label: `${currency.code} — ${currency.name}`,
                  }))}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="place_of_supply"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Place of supply</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={OPTIONAL_SELECT_NONE}>None</SelectItem>
                    {PLACES_OF_SUPPLY.map((place) => (
                      <SelectItem key={place} value={place}>
                        {PLACE_OF_SUPPLY_LABELS[place]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Lines</p>
          <DocumentLinesEditor
            form={form}
            disabled={disabled || sourced}
            productSide="purchase"
          />
        </div>
        {note ? <DocumentTotalsPanel totals={note} currencies={currencies} /> : null}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea disabled={disabled} className="min-h-24" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {!disabled ? (
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {note ? "Save Changes" : "Create debit note"}
            </Button>
          </div>
        ) : null}
      </form>
    </Form>
  );
}
