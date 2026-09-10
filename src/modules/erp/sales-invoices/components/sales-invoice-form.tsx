"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { ContactFormDialog } from "@/modules/crm/contacts/components/contact-form-dialog";
import { contactPermissions } from "@/modules/crm/contacts/permissions";
import { useAllContacts } from "@/modules/crm/contacts/queries";
import { CustomerFormDialog } from "@/modules/crm/customers/components/customer-form-dialog";
import { customerPermissions } from "@/modules/crm/customers/permissions";
import { useAllCustomers, useCustomer } from "@/modules/crm/customers/queries";
import { PaymentTermFormDialog } from "@/modules/erp/accounting/payment-terms/components/payment-term-form-dialog";
import { paymentTermPermissions } from "@/modules/erp/accounting/payment-terms/permissions";
import { useAllPaymentTerms } from "@/modules/erp/accounting/payment-terms/queries";
import { TermsTemplateFormDialog } from "@/modules/erp/accounting/terms-templates/components/terms-template-form-dialog";
import { termsTemplatePermissions } from "@/modules/erp/accounting/terms-templates/permissions";
import { useAllTermsTemplates } from "@/modules/erp/accounting/terms-templates/queries";
import { CurrencyFormDialog } from "@/modules/erp/currencies/components/currency-form-dialog";
import { currencyPermissions } from "@/modules/erp/currencies/permissions";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { useCreateSalesInvoice, useUpdateSalesInvoice } from "@/modules/erp/sales-invoices/mutations";
import {
  DISCOUNT_TYPE_LABELS,
  DISCOUNT_TYPES,
  isBlankSalesInvoiceLine,
  PLACE_OF_SUPPLY_LABELS,
  PLACES_OF_SUPPLY,
  SalesInvoiceFormSchema,
  TAX_TREATMENT_LABELS,
  type DiscountType,
  type PlaceOfSupply,
  type SalesInvoice,
  type SalesInvoiceCreateRequest,
  type SalesInvoiceFormValues,
  type SalesInvoiceLineFormValues,
  type SalesInvoiceLineInput,
  type SalesInvoiceUpdateRequest,
} from "@/modules/erp/sales-invoices/schemas";
import { emptyDocumentLine } from "@/shared/components/document/schemas";
import { DocumentLinesEditor } from "@/shared/components/document/document-lines-editor";
import { DocumentTotalsPanel } from "@/shared/components/document/document-totals-panel";
import { BranchFormDialog } from "@/modules/users-management/branches/components/branch-form-dialog";
import { branchPermissions } from "@/modules/users-management/branches/permissions";
import { useAllBranches } from "@/modules/users-management/branches/queries";
import { userPermissions } from "@/modules/users-management/users/permissions";
import { useAllUsers } from "@/modules/users-management/users/queries";
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

type ComposeField =
  | "currency_id"
  | "payment_terms_id"
  | "salesperson_id"
  | "contact_id"
  | "place_of_supply"
  | "terms_and_conditions";

function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function optionalUuid(value: string): string | null {
  return !value || value === OPTIONAL_SELECT_NONE ? null : value;
}

function optionalDiscountType(value: string): DiscountType | null {
  return DISCOUNT_TYPES.includes(value as DiscountType) ? (value as DiscountType) : null;
}

function optionalPlaceOfSupply(value: string): PlaceOfSupply | null {
  return PLACES_OF_SUPPLY.includes(value as PlaceOfSupply) ? (value as PlaceOfSupply) : null;
}

function toLineInput(line: SalesInvoiceLineFormValues): SalesInvoiceLineInput {
  return {
    product_id: optionalUuid(line.product_id),
    description: emptyToNull(line.description),
    quantity: line.quantity.trim(),
    unit_id: optionalUuid(line.unit_id),
    rate: emptyToNull(line.rate),
    discount_type: optionalDiscountType(line.discount_type),
    discount_value: emptyToNull(line.discount_value),
    tax_id: optionalUuid(line.tax_id),
    sales_order_line_id: optionalUuid(line.sales_order_line_id),
    delivery_note_id: optionalUuid(line.delivery_note_id),
    delivery_note_line_id: optionalUuid(line.delivery_note_line_id),
  };
}

function toFormLines(invoice: SalesInvoice | null): SalesInvoiceLineFormValues[] {
  const lines = invoice?.lines ?? [];
  if (lines.length === 0) {
    return [
      {
        ...emptyDocumentLine(),
        sales_order_line_id: "",
        delivery_note_id: "",
        delivery_note_line_id: "",
      },
    ];
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
    sales_order_line_id: line.sales_order_line_id ?? "",
    delivery_note_id: line.delivery_note_id ?? "",
    delivery_note_line_id: line.delivery_note_line_id ?? "",
  }));
}

function toFormValues(invoice: SalesInvoice | null): SalesInvoiceFormValues {
  return {
    customer_id: invoice?.customer_id ?? OPTIONAL_SELECT_NONE,
    contact_id: invoice?.contact_id ?? OPTIONAL_SELECT_NONE,
    branch_id: invoice?.branch_id ?? OPTIONAL_SELECT_NONE,
    invoice_date: invoice?.invoice_date ?? todayIsoDate(),
    salesperson_id: invoice?.salesperson_id ?? OPTIONAL_SELECT_NONE,
    sales_order_id: invoice?.sales_order_id ?? "",
    payment_terms_id: invoice?.payment_terms_id ?? OPTIONAL_SELECT_NONE,
    currency_id: invoice?.currency_id ?? OPTIONAL_SELECT_NONE,
    notes: invoice?.notes ?? "",
    terms_and_conditions: invoice?.terms_and_conditions ?? "",
    terms_template_id: OPTIONAL_SELECT_NONE,
    discount_type: invoice?.discount_type ?? OPTIONAL_SELECT_NONE,
    discount_value: invoice?.discount_value ?? "",
    shipping_amount: invoice?.shipping_amount ?? "0",
    adjustment_amount: invoice?.adjustment_amount ?? "0",
    round_off_amount: invoice?.round_off_amount ?? "0",
    place_of_supply: invoice?.place_of_supply ?? OPTIONAL_SELECT_NONE,
    customer_trn: invoice?.customer_trn ?? "",
    tax_treatment: invoice?.tax_treatment ?? "",
    bill_to_snapshot: invoice?.bill_to_snapshot ?? "",
    ship_to_snapshot: invoice?.ship_to_snapshot ?? "",
    lines: toFormLines(invoice),
  };
}

function toCreateRequest(values: SalesInvoiceFormValues): SalesInvoiceCreateRequest {
  return {
    customer_id: values.customer_id,
    contact_id: optionalUuid(values.contact_id),
    branch_id: optionalUuid(values.branch_id),
    invoice_date: emptyToNull(values.invoice_date),
    salesperson_id: optionalUuid(values.salesperson_id),
    sales_order_id: optionalUuid(values.sales_order_id),
    payment_terms_id: optionalUuid(values.payment_terms_id),
    currency_id: optionalUuid(values.currency_id),
    notes: emptyToNull(values.notes),
    terms_and_conditions: emptyToNull(values.terms_and_conditions),
    terms_template_id: optionalUuid(values.terms_template_id),
    discount_type: optionalDiscountType(values.discount_type),
    discount_value: emptyToNull(values.discount_value),
    shipping_amount: values.shipping_amount.trim() || "0",
    adjustment_amount: values.adjustment_amount.trim() || "0",
    round_off_amount: values.round_off_amount.trim() || "0",
    place_of_supply: optionalPlaceOfSupply(values.place_of_supply),
    lines: values.lines.filter((line) => !isBlankSalesInvoiceLine(line)).map(toLineInput),
  };
}

function toUpdateRequest(values: SalesInvoiceFormValues): SalesInvoiceUpdateRequest {
  const created = toCreateRequest(values);
  return {
    contact_id: created.contact_id,
    branch_id: created.branch_id,
    invoice_date: created.invoice_date,
    salesperson_id: created.salesperson_id,
    sales_order_id: created.sales_order_id,
    payment_terms_id: created.payment_terms_id,
    currency_id: created.currency_id,
    notes: created.notes,
    terms_and_conditions: created.terms_and_conditions,
    discount_type: created.discount_type,
    discount_value: created.discount_value,
    shipping_amount: created.shipping_amount,
    adjustment_amount: created.adjustment_amount,
    round_off_amount: created.round_off_amount,
    place_of_supply: created.place_of_supply,
    lines: created.lines,
  };
}

export function SalesInvoiceForm({
  invoice,
  disabled = false,
  onSuccess,
}: {
  invoice: SalesInvoice | null;
  disabled?: boolean;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const can = useCan();
  const createInvoice = useCreateSalesInvoice();
  const updateInvoice = useUpdateSalesInvoice();
  const customersQuery = useAllCustomers();
  const contactsQuery = useAllContacts();
  const currenciesQuery = useAllCurrencies();
  const paymentTermsQuery = useAllPaymentTerms();
  const branchesQuery = useAllBranches();
  const termsTemplatesQuery = useAllTermsTemplates(!invoice);
  const usersQuery = useAllUsers(can(userPermissions.read));
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState<
    "customer" | "contact" | "branch" | "currency" | "paymentTerms" | "termsTemplate" | null
  >(null);
  const dirtyCompose = useRef(new Set<ComposeField>());
  const isEdit = Boolean(invoice);
  const sourcedLines = Boolean(invoice?.lines.some((line) => line.delivery_note_line_id));

  const form = useForm<SalesInvoiceFormValues>({
    resolver: zodResolver(SalesInvoiceFormSchema),
    defaultValues: toFormValues(invoice),
    values: invoice ? toFormValues(invoice) : undefined,
  });
  useDirtyFormGuard(form.formState.isDirty && !disabled);

  const customerId = useWatch({ control: form.control, name: "customer_id" });
  const selectedCustomerId = optionalUuid(customerId);
  const customerQuery = useCustomer(isEdit ? null : selectedCustomerId);
  const termsTemplateId = useWatch({ control: form.control, name: "terms_template_id" });
  const taxTreatment = useWatch({ control: form.control, name: "tax_treatment" });
  const customerTrn = useWatch({ control: form.control, name: "customer_trn" });

  const customers = customersQuery.data ?? [];
  const contacts = (contactsQuery.data ?? []).filter(
    (contact) => contact.customer_id === selectedCustomerId,
  );
  const currencies = currenciesQuery.data ?? [];
  const paymentTerms = paymentTermsQuery.data ?? [];
  const branches = branchesQuery.data ?? [];
  const templates = useMemo(() => termsTemplatesQuery.data ?? [], [termsTemplatesQuery.data]);
  const users = usersQuery.data ?? [];

  useEffect(() => {
    const customer = customerQuery.data;
    if (!customer || isEdit) {
      return;
    }
    const dirty = dirtyCompose.current;
    if (!dirty.has("currency_id")) {
      form.setValue("currency_id", customer.currency_id);
    }
    if (!dirty.has("payment_terms_id")) {
      form.setValue("payment_terms_id", customer.payment_terms_id ?? OPTIONAL_SELECT_NONE);
    }
    if (!dirty.has("salesperson_id")) {
      form.setValue("salesperson_id", customer.salesperson_id ?? OPTIONAL_SELECT_NONE);
    }
    form.setValue("customer_trn", customer.trn ?? "");
    form.setValue("tax_treatment", customer.tax_treatment);
  }, [customerQuery.data, form, isEdit]);

  useEffect(() => {
    if (isEdit) {
      return;
    }
    if (!termsTemplateId || termsTemplateId === OPTIONAL_SELECT_NONE) {
      return;
    }
    if (dirtyCompose.current.has("terms_and_conditions")) {
      return;
    }
    const template = templates.find((item) => item.id === termsTemplateId);
    if (template) {
      form.setValue("terms_and_conditions", template.body);
    }
  }, [form, isEdit, templates, termsTemplateId]);

  function markComposeDirty(field: ComposeField) {
    dirtyCompose.current.add(field);
  }

  async function onSubmit(values: SalesInvoiceFormValues) {
    setFormError(null);
    try {
      if (invoice) {
        await updateInvoice.mutateAsync({
          id: invoice.id,
          values: toUpdateRequest(values),
          version: invoice.version,
        });
        toast.success("Sales invoice saved");
        onSuccess?.();
      } else {
        const created = await createInvoice.mutateAsync(toCreateRequest(values));
        toast.success("Sales invoice created");
        router.push(`/sales-invoices/${created.id}`);
      }
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createInvoice.isPending || updateInvoice.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
        {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
        {customerQuery.isFetching && !isEdit ? (
          <p className="text-muted-foreground text-sm">Loading customer defaults…</p>
        ) : null}
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
                  disabled={disabled || isEdit || customersQuery.isLoading}
                  placeholder="Select a customer"
                  searchPlaceholder="Search customer…"
                  createLabel="Create customer"
                  onCreate={
                    can(customerPermissions.create) ? () => setCreating("customer") : undefined
                  }
                  options={[
                    { value: OPTIONAL_SELECT_NONE, label: "Select a customer" },
                    ...customers.map((customer) => ({
                      value: customer.id,
                      label: customer.name,
                    })),
                  ]}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contact_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={(value) => {
                    markComposeDirty("contact_id");
                    field.onChange(value);
                  }}
                  disabled={disabled || contactsQuery.isLoading || !selectedCustomerId}
                  placeholder="None"
                  searchPlaceholder="Search contact…"
                  createLabel="Create contact"
                  onCreate={
                    can(contactPermissions.create) && selectedCustomerId
                      ? () => setCreating("contact")
                      : undefined
                  }
                  options={[
                    { value: OPTIONAL_SELECT_NONE, label: "None" },
                    ...contacts.map((contact) => ({
                      value: contact.id,
                      label: contact.name,
                    })),
                  ]}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="invoice_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Invoice date</FormLabel>
                <FormControl>
                  <Input type="date" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="branch_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Branch</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled || branchesQuery.isLoading}
                  placeholder="None"
                  searchPlaceholder="Search branch…"
                  createLabel="Create branch"
                  onCreate={can(branchPermissions.create) ? () => setCreating("branch") : undefined}
                  options={[
                    { value: OPTIONAL_SELECT_NONE, label: "None" },
                    ...branches.map((branch) => ({
                      value: branch.id,
                      label: `${branch.code} — ${branch.name}`,
                    })),
                  ]}
                />
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
                  onValueChange={(value) => {
                    markComposeDirty("currency_id");
                    field.onChange(value);
                  }}
                  disabled={disabled || currenciesQuery.isLoading}
                  placeholder="Select currency"
                  searchPlaceholder="Search currency…"
                  createLabel="Create currency"
                  onCreate={
                    can(currencyPermissions.create) ? () => setCreating("currency") : undefined
                  }
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
            name="payment_terms_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment terms</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={(value) => {
                    markComposeDirty("payment_terms_id");
                    field.onChange(value);
                  }}
                  disabled={disabled || paymentTermsQuery.isLoading}
                  placeholder="None"
                  searchPlaceholder="Search payment terms…"
                  createLabel="Create payment terms"
                  onCreate={
                    can(paymentTermPermissions.create)
                      ? () => setCreating("paymentTerms")
                      : undefined
                  }
                  options={[
                    { value: OPTIONAL_SELECT_NONE, label: "None" },
                    ...paymentTerms.map((term) => ({
                      value: term.id,
                      label: term.name,
                    })),
                  ]}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="salesperson_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Salesperson</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    markComposeDirty("salesperson_id");
                    field.onChange(value);
                  }}
                  disabled={disabled || usersQuery.isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={OPTIONAL_SELECT_NONE}>None</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
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
            name="place_of_supply"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Place of supply</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    markComposeDirty("place_of_supply");
                    field.onChange(value);
                  }}
                  disabled={disabled}
                >
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
          <FormField
            control={form.control}
            name="shipping_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shipping amount</FormLabel>
                <FormControl>
                  <Input inputMode="decimal" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="adjustment_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adjustment amount</FormLabel>
                <FormControl>
                  <Input inputMode="decimal" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="round_off_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Round off</FormLabel>
                <FormControl>
                  <Input inputMode="decimal" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormItem>
            <FormLabel>Customer TRN</FormLabel>
            <Input value={customerTrn || "—"} disabled />
          </FormItem>
          <div
            className={
              isEdit ? "col-span-full" : "col-span-full grid grid-cols-1 gap-3 sm:grid-cols-2"
            }
          >
            <FormItem>
              <FormLabel>Tax treatment</FormLabel>
              <Input
                value={
                  taxTreatment && taxTreatment in TAX_TREATMENT_LABELS
                    ? TAX_TREATMENT_LABELS[taxTreatment as keyof typeof TAX_TREATMENT_LABELS]
                    : taxTreatment || "—"
                }
                disabled
              />
            </FormItem>
            {!isEdit ? (
              <FormField
                control={form.control}
                name="terms_template_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Terms template</FormLabel>
                    <MasterSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={disabled || termsTemplatesQuery.isLoading}
                      placeholder="None"
                      searchPlaceholder="Search template…"
                      createLabel="Create terms template"
                      onCreate={
                        can(termsTemplatePermissions.create)
                          ? () => setCreating("termsTemplate")
                          : undefined
                      }
                      options={[
                        { value: OPTIONAL_SELECT_NONE, label: "None" },
                        ...templates.map((template) => ({
                          value: template.id,
                          label: template.name,
                        })),
                      ]}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Lines</p>
          {sourcedLines ? (
            <p className="text-muted-foreground text-sm">
              These lines came from a delivery note and cannot be edited here.
            </p>
          ) : null}
          <DocumentLinesEditor
            form={form}
            disabled={disabled || sourcedLines}
            productSide="sales"
          />
        </div>
        {invoice ? <DocumentTotalsPanel totals={invoice} currencies={currencies} /> : null}
        <div className="grid grid-cols-1 gap-3">
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
          <FormField
            control={form.control}
            name="terms_and_conditions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Terms and conditions</FormLabel>
                <FormControl>
                  <Textarea
                    disabled={disabled}
                    className="min-h-24"
                    {...field}
                    onChange={(event) => {
                      markComposeDirty("terms_and_conditions");
                      field.onChange(event);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bill_to_snapshot"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bill to</FormLabel>
                <FormControl>
                  <Textarea disabled {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="ship_to_snapshot"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ship to</FormLabel>
                <FormControl>
                  <Textarea disabled {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        {!disabled ? (
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {isEdit ? "Save Changes" : "Create sales invoice"}
            </Button>
          </div>
        ) : null}
      </form>
      <CustomerFormDialog
        open={creating === "customer"}
        customer={null}
        nested
        onCreated={(entity) => {
          form.setValue("customer_id", entity.id);
          if (entity.contact_id) {
            markComposeDirty("contact_id");
            form.setValue("contact_id", entity.contact_id);
          }
        }}
        onOpenChange={(open) => setCreating(open ? "customer" : null)}
      />
      <ContactFormDialog
        open={creating === "contact"}
        contact={null}
        defaultCustomerId={selectedCustomerId ?? undefined}
        lockCustomer
        nested
        onCreated={(entity) => {
          markComposeDirty("contact_id");
          form.setValue("contact_id", entity.id);
        }}
        onOpenChange={(open) => setCreating(open ? "contact" : null)}
      />
      <BranchFormDialog
        open={creating === "branch"}
        branch={null}
        nested
        onCreated={(entity) => form.setValue("branch_id", entity.id)}
        onOpenChange={(open) => setCreating(open ? "branch" : null)}
      />
      <CurrencyFormDialog
        open={creating === "currency"}
        currency={null}
        nested
        onCreated={(entity) => {
          markComposeDirty("currency_id");
          form.setValue("currency_id", entity.id);
        }}
        onOpenChange={(open) => setCreating(open ? "currency" : null)}
      />
      <PaymentTermFormDialog
        open={creating === "paymentTerms"}
        term={null}
        nested
        onCreated={(entity) => {
          markComposeDirty("payment_terms_id");
          form.setValue("payment_terms_id", entity.id);
        }}
        onOpenChange={(open) => setCreating(open ? "paymentTerms" : null)}
      />
      <TermsTemplateFormDialog
        open={creating === "termsTemplate"}
        template={null}
        nested
        onCreated={(entity) => form.setValue("terms_template_id", entity.id)}
        onOpenChange={(open) => setCreating(open ? "termsTemplate" : null)}
      />
    </Form>
  );
}
