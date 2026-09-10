"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { CustomerFormDialog } from "@/modules/crm/customers/components/customer-form-dialog";
import { customerPermissions } from "@/modules/crm/customers/permissions";
import { useAllCustomers } from "@/modules/crm/customers/queries";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { useCreateCreditNote, useUpdateCreditNote } from "@/modules/erp/credit-notes/mutations";
import {
  CREDIT_NOTE_REASON_LABELS,
  CREDIT_NOTE_REASONS,
  CreditNoteFormSchema,
  DISCOUNT_TYPE_LABELS,
  DISCOUNT_TYPES,
  PLACE_OF_SUPPLY_LABELS,
  PLACES_OF_SUPPLY,
  isBlankCreditNoteLine,
  type CreditNote,
  type CreditNoteCreateRequest,
  type CreditNoteFormValues,
  type CreditNoteLineFormValues,
  type CreditNoteLineInput,
  type CreditNoteReason,
  type CreditNoteUpdateRequest,
  type DiscountType,
  type PlaceOfSupply,
} from "@/modules/erp/credit-notes/schemas";
import { emptyDocumentLine } from "@/shared/components/document/schemas";
import { DocumentLinesEditor } from "@/shared/components/document/document-lines-editor";
import { DocumentTotalsPanel } from "@/shared/components/document/document-totals-panel";
import { emptyToNull } from "@/modules/users-management/tenants/schemas";
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
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";
import { useCan } from "@/shared/providers/session-provider";

function todayIsoDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function optionalUuid(value: string): string | null {
  return !value || value === OPTIONAL_SELECT_NONE ? null : value;
}

function toLineInput(line: CreditNoteLineFormValues): CreditNoteLineInput {
  return {
    product_id: optionalUuid(line.product_id),
    description: emptyToNull(line.description),
    quantity: line.quantity.trim(),
    unit_id: optionalUuid(line.unit_id),
    rate: emptyToNull(line.rate),
    discount_type: DISCOUNT_TYPES.includes(line.discount_type as DiscountType)
      ? (line.discount_type as DiscountType)
      : null,
    discount_value: emptyToNull(line.discount_value),
    tax_id: optionalUuid(line.tax_id),
    sales_invoice_line_id: optionalUuid(line.sales_invoice_line_id ?? ""),
    sales_return_line_id: optionalUuid(line.sales_return_line_id ?? ""),
  };
}

function toFormLines(note: CreditNote | null): CreditNoteLineFormValues[] {
  const lines = note?.lines ?? [];
  if (lines.length === 0) {
    return [{ ...emptyDocumentLine(), sales_invoice_line_id: "", sales_return_line_id: "" }];
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
    sales_invoice_line_id: line.sales_invoice_line_id ?? "",
    sales_return_line_id: line.sales_return_line_id ?? "",
  }));
}

function toFormValues(note: CreditNote | null): CreditNoteFormValues {
  return {
    customer_id: note?.customer_id ?? OPTIONAL_SELECT_NONE,
    sales_invoice_id: note?.sales_invoice_id ?? "",
    sales_return_id: note?.sales_return_id ?? "",
    reason_code: note?.reason_code ?? "PRICE_ADJUSTMENT",
    branch_id: note?.branch_id ?? OPTIONAL_SELECT_NONE,
    credit_note_date: note?.credit_note_date ?? todayIsoDate(),
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

function toCreateRequest(values: CreditNoteFormValues): CreditNoteCreateRequest {
  return {
    customer_id: values.customer_id,
    sales_invoice_id: optionalUuid(values.sales_invoice_id),
    sales_return_id: optionalUuid(values.sales_return_id),
    reason_code: values.reason_code,
    branch_id: optionalUuid(values.branch_id),
    credit_note_date: emptyToNull(values.credit_note_date),
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
    lines: values.lines.filter((line) => !isBlankCreditNoteLine(line)).map(toLineInput),
  };
}

function toUpdateRequest(values: CreditNoteFormValues): CreditNoteUpdateRequest {
  const created = toCreateRequest(values);
  return {
    sales_invoice_id: created.sales_invoice_id,
    sales_return_id: created.sales_return_id,
    reason_code: created.reason_code,
    branch_id: created.branch_id,
    credit_note_date: created.credit_note_date,
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

export function CreditNoteForm({
  note,
  disabled = false,
  onSuccess,
}: {
  note: CreditNote | null;
  disabled?: boolean;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const can = useCan();
  const createNote = useCreateCreditNote();
  const updateNote = useUpdateCreditNote();
  const customersQuery = useAllCustomers();
  const currenciesQuery = useAllCurrencies();
  const [formError, setFormError] = useState<string | null>(null);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const sourced = Boolean(
    note?.lines.some((line) => line.sales_invoice_line_id || line.sales_return_line_id),
  );

  const form = useForm<CreditNoteFormValues>({
    resolver: zodResolver(CreditNoteFormSchema),
    defaultValues: toFormValues(note),
    values: note ? toFormValues(note) : undefined,
  });
  useDirtyFormGuard(form.formState.isDirty && !disabled);

  const customers = customersQuery.data ?? [];
  const currencies = currenciesQuery.data ?? [];

  async function onSubmit(values: CreditNoteFormValues) {
    setFormError(null);
    try {
      if (note) {
        await updateNote.mutateAsync({
          id: note.id,
          values: toUpdateRequest(values),
          version: note.version,
        });
        toast.success("Credit note saved");
        onSuccess?.();
      } else {
        const created = await createNote.mutateAsync(toCreateRequest(values));
        toast.success("Credit note created");
        router.push(`/credit-notes/${created.id}`);
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
            name="customer_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled || Boolean(note) || customersQuery.isLoading}
                  placeholder="Select a customer"
                  searchPlaceholder="Search customer…"
                  createLabel="Create customer"
                  onCreate={
                    can(customerPermissions.create) ? () => setCreatingCustomer(true) : undefined
                  }
                  options={[
                    { value: OPTIONAL_SELECT_NONE, label: "Select a customer" },
                    ...customers.map((customer) => ({ value: customer.id, label: customer.name })),
                  ]}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="credit_note_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Credit note date</FormLabel>
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
                  onValueChange={(value) => field.onChange(value as CreditNoteReason)}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CREDIT_NOTE_REASONS.map((code) => (
                      <SelectItem key={code} value={code}>
                        {CREDIT_NOTE_REASON_LABELS[code]}
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
          <FormField
            control={form.control}
            name="discount_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Header discount type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
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
          <FormField
            control={form.control}
            name="discount_value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Header discount value</FormLabel>
                <FormControl>
                  <Input inputMode="decimal" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Lines</p>
          <DocumentLinesEditor form={form} disabled={disabled || sourced} productSide="sales" />
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
              {note ? "Save Changes" : "Create credit note"}
            </Button>
          </div>
        ) : null}
      </form>
      <CustomerFormDialog
        open={creatingCustomer}
        customer={null}
        nested
        onCreated={(entity) => form.setValue("customer_id", entity.id)}
        onOpenChange={setCreatingCustomer}
      />
    </Form>
  );
}
