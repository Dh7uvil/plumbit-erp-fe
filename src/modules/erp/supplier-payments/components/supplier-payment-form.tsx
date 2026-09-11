"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { isCashOrBankAccount } from "@/modules/erp/accounting/accounts/schemas";
import { useAllAccounts } from "@/modules/erp/accounting/accounts/queries";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { usePurchaseOrders } from "@/modules/erp/purchase-orders/queries";
import { SupplierFormDialog } from "@/modules/erp/suppliers/components/supplier-form-dialog";
import { supplierPermissions } from "@/modules/erp/suppliers/permissions";
import { useAllSuppliers, useSupplier, useSupplierOpenItems } from "@/modules/erp/suppliers/queries";
import {
  useCreateSupplierPayment,
  useUpdateSupplierPayment,
} from "@/modules/erp/supplier-payments/mutations";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  SupplierPaymentFormSchema,
  type PaymentMethod,
  type SupplierPayment,
  type SupplierPaymentCreateRequest,
  type SupplierPaymentFormValues,
  type SupplierPaymentUpdateRequest,
} from "@/modules/erp/supplier-payments/schemas";
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

export type SupplierPaymentFormDefaults = {
  supplierId?: string;
  invoiceId?: string;
  purchaseOrderId?: string;
};

function toFormValues(
  payment: SupplierPayment | null,
  defaults?: SupplierPaymentFormDefaults,
): SupplierPaymentFormValues {
  return {
    supplier_id: payment?.supplier_id ?? defaults?.supplierId ?? OPTIONAL_SELECT_NONE,
    payment_date: payment?.payment_date ?? todayIsoDate(),
    currency_id: payment?.currency_id ?? OPTIONAL_SELECT_NONE,
    amount_paid: payment?.amount_paid ?? "",
    bank_charges: payment?.bank_charges && payment.bank_charges !== "0" ? payment.bank_charges : "",
    payment_account_id: payment?.payment_account_id ?? OPTIONAL_SELECT_NONE,
    payment_method: payment?.payment_method ?? "TT",
    reference: payment?.reference ?? "",
    purchase_order_id: payment?.purchase_order_id ?? defaults?.purchaseOrderId ?? OPTIONAL_SELECT_NONE,
    notes: payment?.notes ?? "",
  };
}

function toCreateRequest(
  values: SupplierPaymentFormValues,
  allocations: SupplierPaymentCreateRequest["allocations"],
): SupplierPaymentCreateRequest {
  return {
    supplier_id: values.supplier_id,
    payment_date: emptyToNull(values.payment_date),
    currency_id: optionalUuid(values.currency_id),
    amount_paid: values.amount_paid.trim(),
    bank_charges: values.bank_charges.trim() || "0",
    payment_account_id: values.payment_account_id,
    payment_method: values.payment_method,
    reference: emptyToNull(values.reference),
    purchase_order_id: optionalUuid(values.purchase_order_id),
    notes: emptyToNull(values.notes),
    allocations,
  };
}

function toUpdateRequest(
  values: SupplierPaymentFormValues,
  allocations: SupplierPaymentCreateRequest["allocations"],
): SupplierPaymentUpdateRequest {
  const created = toCreateRequest(values, allocations);
  return {
    payment_date: created.payment_date,
    currency_id: created.currency_id,
    amount_paid: created.amount_paid,
    bank_charges: created.bank_charges,
    payment_account_id: created.payment_account_id,
    payment_method: created.payment_method,
    reference: created.reference,
    purchase_order_id: created.purchase_order_id,
    notes: created.notes,
    allocations: created.allocations ?? [],
  };
}

export function SupplierPaymentForm({
  payment,
  defaults,
  disabled = false,
  onSuccess,
}: {
  payment: SupplierPayment | null;
  defaults?: SupplierPaymentFormDefaults;
  disabled?: boolean;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const can = useCan();
  const createPayment = useCreateSupplierPayment();
  const updatePayment = useUpdateSupplierPayment();
  const suppliersQuery = useAllSuppliers();
  const currenciesQuery = useAllCurrencies();
  const accountsQuery = useAllAccounts({ is_group: false, is_active: true });
  const [formError, setFormError] = useState<string | null>(null);
  const [creatingSupplier, setCreatingSupplier] = useState(false);
  const [allocationValues, setAllocationValues] = useState<Record<string, string>>(() =>
    Object.fromEntries((payment?.allocations ?? []).map((row) => [row.item_id, row.amount])),
  );

  const form = useForm<SupplierPaymentFormValues>({
    resolver: zodResolver(SupplierPaymentFormSchema),
    defaultValues: toFormValues(payment, defaults),
    values: payment ? toFormValues(payment) : undefined,
  });
  useDirtyFormGuard(form.formState.isDirty && !disabled);

  const supplierId = useWatch({ control: form.control, name: "supplier_id" });
  const amountPaid = useWatch({ control: form.control, name: "amount_paid" });
  const bankCharges = useWatch({ control: form.control, name: "bank_charges" });
  const currencyId = useWatch({ control: form.control, name: "currency_id" });
  const selectedSupplierId = optionalUuid(supplierId);
  const supplierQuery = useSupplier(selectedSupplierId);
  const openItemsQuery = useSupplierOpenItems(selectedSupplierId, !disabled || Boolean(payment));
  const purchaseOrdersQuery = usePurchaseOrders(
    { page_size: 50, supplier_id: selectedSupplierId ?? undefined },
    Boolean(selectedSupplierId),
  );

  const suppliers = suppliersQuery.data ?? [];
  const currencies = currenciesQuery.data ?? [];
  const paymentAccounts = (accountsQuery.data ?? []).filter(isCashOrBankAccount);
  const openItems = openItemsQuery.data ?? [];
  const currencyCode = currencies.find((currency) => currency.id === currencyId)?.code ?? "";

  useEffect(() => {
    if (payment || !supplierQuery.data) {
      return;
    }
    if (form.getValues("currency_id") === OPTIONAL_SELECT_NONE) {
      form.setValue("currency_id", supplierQuery.data.currency_id);
    }
  }, [form, payment, supplierQuery.data]);

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

  async function onSubmit(values: SupplierPaymentFormValues) {
    setFormError(null);
    try {
      if (payment) {
        await updatePayment.mutateAsync({
          id: payment.id,
          values: toUpdateRequest(values, allocationPayload),
          version: payment.version,
        });
        toast.success("Payment saved");
        onSuccess?.();
      } else {
        const created = await createPayment.mutateAsync(toCreateRequest(values, allocationPayload));
        toast.success("Payment created");
        router.push(`/supplier-payments/${created.id}`);
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
            name="supplier_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled || Boolean(payment) || suppliersQuery.isLoading}
                  placeholder="Select a supplier"
                  searchPlaceholder="Search supplier…"
                  createLabel="Create supplier"
                  onCreate={
                    can(supplierPermissions.create) ? () => setCreatingSupplier(true) : undefined
                  }
                  options={[
                    { value: OPTIONAL_SELECT_NONE, label: "Select a supplier" },
                    ...suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name })),
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
            name="amount_paid"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount paid</FormLabel>
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
            name="purchase_order_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase order</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled || !selectedSupplierId}
                  placeholder="Optional"
                  searchPlaceholder="Search purchase order…"
                  options={[
                    { value: OPTIONAL_SELECT_NONE, label: "None" },
                    ...(purchaseOrdersQuery.data?.data ?? []).map((order) => ({
                      value: order.id,
                      label: order.document_number,
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
            received={amountPaid}
            bankCharges={bankCharges}
            unapplied={payment?.amount_unapplied}
            disabled={disabled}
            emptyMessage={
              selectedSupplierId
                ? "No open items for this supplier."
                : "Select a supplier to load open items."
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
              {payment ? "Save Changes" : "Create payment"}
            </Button>
          </div>
        ) : null}
      </form>
      <SupplierFormDialog
        open={creatingSupplier}
        supplier={null}
        nested
        onCreated={(entity) => form.setValue("supplier_id", entity.id)}
        onOpenChange={setCreatingSupplier}
      />
    </Form>
  );
}
