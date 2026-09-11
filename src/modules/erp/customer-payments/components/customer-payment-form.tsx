"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { CustomerFormDialog } from "@/modules/crm/customers/components/customer-form-dialog";
import { customerPermissions } from "@/modules/crm/customers/permissions";
import { useAllCustomers, useCustomer, useCustomerOpenItems } from "@/modules/crm/customers/queries";
import { isCashOrBankAccount } from "@/modules/erp/accounting/accounts/schemas";
import { useAllAccounts } from "@/modules/erp/accounting/accounts/queries";
import { useAllTaxes } from "@/modules/erp/accounting/taxes/queries";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import {
  useCreateCustomerPayment,
  useUpdateCustomerPayment,
} from "@/modules/erp/customer-payments/mutations";
import { useProformaInvoices } from "@/modules/erp/proforma-invoices/queries";
import { useSalesOrders } from "@/modules/erp/sales-orders/queries";
import {
  CustomerPaymentFormSchema,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  type CustomerPayment,
  type CustomerPaymentCreateRequest,
  type CustomerPaymentFormValues,
  type CustomerPaymentUpdateRequest,
  type PaymentMethod,
} from "@/modules/erp/customer-payments/schemas";
import { emptyToNull } from "@/modules/users-management/tenants/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import {
  PaymentAllocationEditor,
  defaultAllocationAmounts,
  paymentAllocationsPayload,
} from "@/shared/components/document/payment-allocation-editor";
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

function toFormValues(payment: CustomerPayment | null, defaults?: CustomerPaymentFormDefaults): CustomerPaymentFormValues {
  return {
    customer_id: payment?.customer_id ?? defaults?.customerId ?? OPTIONAL_SELECT_NONE,
    payment_date: payment?.payment_date ?? todayIsoDate(),
    currency_id: payment?.currency_id ?? OPTIONAL_SELECT_NONE,
    amount_received: payment?.amount_received ?? "",
    bank_charges: payment?.bank_charges && payment.bank_charges !== "0" ? payment.bank_charges : "",
    payment_account_id: payment?.payment_account_id ?? OPTIONAL_SELECT_NONE,
    payment_method: payment?.payment_method ?? "TT",
    reference: payment?.reference ?? "",
    proforma_invoice_id: payment?.proforma_invoice_id ?? defaults?.proformaInvoiceId ?? OPTIONAL_SELECT_NONE,
    sales_order_id: payment?.sales_order_id ?? defaults?.salesOrderId ?? OPTIONAL_SELECT_NONE,
    tax_id: payment?.tax_id ?? OPTIONAL_SELECT_NONE,
    notes: payment?.notes ?? "",
  };
}

function toCreateRequest(
  values: CustomerPaymentFormValues,
  allocations: CustomerPaymentCreateRequest["allocations"],
): CustomerPaymentCreateRequest {
  return {
    customer_id: values.customer_id,
    payment_date: emptyToNull(values.payment_date),
    currency_id: optionalUuid(values.currency_id),
    amount_received: values.amount_received.trim(),
    bank_charges: values.bank_charges.trim() || "0",
    payment_account_id: values.payment_account_id,
    payment_method: values.payment_method,
    reference: emptyToNull(values.reference),
    proforma_invoice_id: optionalUuid(values.proforma_invoice_id),
    sales_order_id: optionalUuid(values.sales_order_id),
    tax_id: optionalUuid(values.tax_id),
    notes: emptyToNull(values.notes),
    allocations,
  };
}

function toUpdateRequest(
  values: CustomerPaymentFormValues,
  allocations: CustomerPaymentCreateRequest["allocations"],
): CustomerPaymentUpdateRequest {
  const created = toCreateRequest(values, allocations);
  return {
    payment_date: created.payment_date,
    currency_id: created.currency_id,
    amount_received: created.amount_received,
    bank_charges: created.bank_charges,
    payment_account_id: created.payment_account_id,
    payment_method: created.payment_method,
    reference: created.reference,
    proforma_invoice_id: created.proforma_invoice_id,
    sales_order_id: created.sales_order_id,
    tax_id: created.tax_id,
    notes: created.notes,
    allocations: created.allocations ?? [],
  };
}

export type CustomerPaymentFormDefaults = {
  customerId?: string;
  invoiceId?: string;
  proformaInvoiceId?: string;
  salesOrderId?: string;
};

export function CustomerPaymentForm({
  payment,
  defaults,
  disabled = false,
  onSuccess,
}: {
  payment: CustomerPayment | null;
  defaults?: CustomerPaymentFormDefaults;
  disabled?: boolean;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const can = useCan();
  const createPayment = useCreateCustomerPayment();
  const updatePayment = useUpdateCustomerPayment();
  const customersQuery = useAllCustomers();
  const currenciesQuery = useAllCurrencies();
  const accountsQuery = useAllAccounts({ is_group: false, is_active: true });
  const taxesQuery = useAllTaxes();
  const [formError, setFormError] = useState<string | null>(null);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [allocationValues, setAllocationValues] = useState<Record<string, string>>(() =>
    Object.fromEntries((payment?.allocations ?? []).map((row) => [row.item_id, row.amount])),
  );

  const form = useForm<CustomerPaymentFormValues>({
    resolver: zodResolver(CustomerPaymentFormSchema),
    defaultValues: toFormValues(payment, defaults),
    values: payment ? toFormValues(payment) : undefined,
  });
  useDirtyFormGuard(form.formState.isDirty && !disabled);

  const customerId = useWatch({ control: form.control, name: "customer_id" });
  const amountReceived = useWatch({ control: form.control, name: "amount_received" });
  const bankCharges = useWatch({ control: form.control, name: "bank_charges" });
  const currencyId = useWatch({ control: form.control, name: "currency_id" });
  const selectedCustomerId = optionalUuid(customerId);
  const customerQuery = useCustomer(selectedCustomerId);
  const openItemsQuery = useCustomerOpenItems(selectedCustomerId, !disabled || Boolean(payment));
  const proformasQuery = useProformaInvoices(
    { page_size: 50, customer_id: selectedCustomerId ?? undefined },
    Boolean(selectedCustomerId),
  );
  const salesOrdersQuery = useSalesOrders(
    { page_size: 50, customer_id: selectedCustomerId ?? undefined },
    Boolean(selectedCustomerId),
  );

  const customers = customersQuery.data ?? [];
  const currencies = currenciesQuery.data ?? [];
  const paymentAccounts = (accountsQuery.data ?? []).filter(isCashOrBankAccount);
  const taxes = taxesQuery.data ?? [];
  const openItems = openItemsQuery.data ?? [];
  const currencyCode = currencies.find((currency) => currency.id === currencyId)?.code ?? "";

  useEffect(() => {
    if (payment || !customerQuery.data) {
      return;
    }
    if (form.getValues("currency_id") === OPTIONAL_SELECT_NONE) {
      form.setValue("currency_id", customerQuery.data.currency_id);
    }
  }, [customerQuery.data, form, payment]);

  useEffect(() => {
    if (payment || !defaults?.invoiceId || !openItemsQuery.data) {
      return;
    }
    setAllocationValues((current) => {
      if (Object.values(current).some((value) => value.trim())) {
        return current;
      }
      return defaultAllocationAmounts(openItemsQuery.data, defaults.invoiceId);
    });
  }, [defaults?.invoiceId, openItemsQuery.data, payment]);

  const allocationPayload = useMemo(
    () => paymentAllocationsPayload(openItems, allocationValues),
    [allocationValues, openItems],
  );

  async function onSubmit(values: CustomerPaymentFormValues) {
    setFormError(null);
    try {
      if (payment) {
        await updatePayment.mutateAsync({
          id: payment.id,
          values: toUpdateRequest(values, allocationPayload),
          version: payment.version,
        });
        toast.success("Receipt saved");
        onSuccess?.();
      } else {
        const created = await createPayment.mutateAsync(toCreateRequest(values, allocationPayload));
        toast.success("Receipt created");
        router.push(`/customer-payments/${created.id}`);
      }
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createPayment.isPending || updatePayment.isPending;

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
                  disabled={disabled || Boolean(payment) || customersQuery.isLoading}
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
            name="payment_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment date</FormLabel>
                <FormControl>
                  <Input type="date" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amount_received"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount received</FormLabel>
                <FormControl>
                  <Input inputMode="decimal" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bank_charges"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bank charges</FormLabel>
                <FormControl>
                  <Input inputMode="decimal" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="payment_account_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment account</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled || accountsQuery.isLoading}
                  placeholder="Cash or bank"
                  searchPlaceholder="Search account…"
                  options={[
                    { value: OPTIONAL_SELECT_NONE, label: "Select an account" },
                    ...paymentAccounts.map((account) => ({
                      value: account.id,
                      label: `${account.code} — ${account.name}`,
                    })),
                  ]}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="payment_method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Method</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => field.onChange(value as PaymentMethod)}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method} value={method}>
                        {PAYMENT_METHOD_LABELS[method]}
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
            name="reference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reference</FormLabel>
                <FormControl>
                  <Input disabled={disabled} placeholder="TT / UTR / cheque no." {...field} />
                </FormControl>
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
            name="proforma_invoice_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Proforma invoice</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled || !selectedCustomerId}
                  placeholder="Optional"
                  searchPlaceholder="Search proforma…"
                  options={[
                    { value: OPTIONAL_SELECT_NONE, label: "None" },
                    ...(proformasQuery.data?.data ?? []).map((invoice) => ({
                      value: invoice.id,
                      label: invoice.display_number || invoice.document_number,
                    })),
                  ]}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sales_order_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sales order</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled || !selectedCustomerId}
                  placeholder="Optional"
                  searchPlaceholder="Search sales order…"
                  options={[
                    { value: OPTIONAL_SELECT_NONE, label: "None" },
                    ...(salesOrdersQuery.data?.data ?? []).map((order) => ({
                      value: order.id,
                      label: order.document_number,
                    })),
                  ]}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tax_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Advance tax</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled || taxesQuery.isLoading}
                  placeholder="None"
                  searchPlaceholder="Search tax…"
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
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Allocations</p>
          <PaymentAllocationEditor
            items={openItems}
            values={allocationValues}
            onChange={(itemId, amount) =>
              setAllocationValues((current) => ({ ...current, [itemId]: amount }))
            }
            currencyCode={currencyCode}
            received={amountReceived}
            bankCharges={bankCharges}
            unapplied={payment?.amount_unapplied}
            disabled={disabled}
            emptyMessage={
              selectedCustomerId
                ? "No open items for this customer."
                : "Select a customer to load open items."
            }
          />
        </div>
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
              {payment ? "Save Changes" : "Create receipt"}
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
