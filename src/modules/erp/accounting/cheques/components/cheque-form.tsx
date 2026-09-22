"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { useAllCustomers, useCustomerOpenItems } from "@/modules/crm/customers/queries";
import { useAllBankAccounts } from "@/modules/erp/accounting/bank-accounts/queries";
import { useCreateCheque, useUpdateCheque } from "@/modules/erp/accounting/cheques/mutations";
import type { Cheque, ChequeCreateRequest } from "@/modules/erp/accounting/cheques/schemas";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { useAllSuppliers, useSupplierOpenItems } from "@/modules/erp/suppliers/queries";
import { getErrorMessage } from "@/shared/api/errors";
import {
  CUSTOMER_PAYMENT_ALLOCATE_TYPES,
  PaymentAllocationEditor,
  SUPPLIER_PAYMENT_ALLOCATE_TYPES,
  filterOpenItemsForPaymentAllocation,
  paymentAllocationsPayload,
} from "@/shared/components/document/payment-allocation-editor";
import { DecimalInput } from "@/shared/components/form/decimal-input";
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
import { useBaseCurrency } from "@/shared/hooks/use-base-currency";
import { useDefaultDocumentCurrency } from "@/shared/hooks/use-default-document-currency";
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";

const FormSchema = z.object({
  cheque_number: z.string().min(1, "Cheque number is required"),
  direction: z.enum(["INBOUND", "OUTBOUND"]),
  cheque_date: z.string().min(1, "Cheque date is required"),
  due_date: z.string(),
  amount: z.string().min(1, "Amount is required"),
  currency_id: z.string().uuid("Select a currency"),
  party_id: z.string(),
  bank_account_id: z.string().uuid("Select a bank account"),
  narration: z.string(),
});

type FormValues = z.infer<typeof FormSchema>;

function todayIsoDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function optionalUuid(value: string): string | null {
  return !value || value === OPTIONAL_SELECT_NONE ? null : value;
}

function toFormValues(cheque: Cheque | undefined, baseCurrencyId?: string): FormValues {
  return {
    cheque_number: cheque?.cheque_number ?? "",
    direction: cheque?.direction ?? "INBOUND",
    cheque_date: cheque?.cheque_date ?? todayIsoDate(),
    due_date: cheque?.due_date ?? "",
    amount: cheque?.amount ?? "",
    currency_id: cheque?.currency_id ?? baseCurrencyId ?? "",
    party_id: cheque?.party_id ?? OPTIONAL_SELECT_NONE,
    bank_account_id: cheque?.bank_account_id ?? "",
    narration: cheque?.narration ?? "",
  };
}

export function ChequeForm({
  cheque,
  disabled = false,
}: {
  cheque?: Cheque | null;
  disabled?: boolean;
}) {
  const router = useRouter();
  const isEdit = Boolean(cheque);
  const createCheque = useCreateCheque();
  const updateCheque = useUpdateCheque();
  const bankAccountsQuery = useAllBankAccounts();
  const currenciesQuery = useAllCurrencies();
  const customersQuery = useAllCustomers();
  const suppliersQuery = useAllSuppliers();
  const { baseCurrencyId, baseCurrencyCode } = useBaseCurrency();
  const [allocationValues, setAllocationValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      (cheque?.allocations ?? [])
        .filter((row) => !row.reversed_at)
        .map((row) => [row.item_id, row.amount]),
    ),
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: toFormValues(cheque ?? undefined, baseCurrencyId),
    values: cheque ? toFormValues(cheque, baseCurrencyId) : undefined,
  });
  useDirtyFormGuard(form.formState.isDirty && !disabled);
  useDefaultDocumentCurrency(form, isEdit, baseCurrencyId);

  const direction = useWatch({ control: form.control, name: "direction" });
  const partyId = optionalUuid(useWatch({ control: form.control, name: "party_id" }) ?? "");
  const currencyId = useWatch({ control: form.control, name: "currency_id" });
  const amount = useWatch({ control: form.control, name: "amount" }) ?? "";
  const inbound = direction === "INBOUND";

  const customerOpenItemsQuery = useCustomerOpenItems(partyId, inbound && Boolean(partyId));
  const supplierOpenItemsQuery = useSupplierOpenItems(partyId, !inbound && Boolean(partyId));

  const openItems = filterOpenItemsForPaymentAllocation(
    inbound ? (customerOpenItemsQuery.data ?? []) : (supplierOpenItemsQuery.data ?? []),
    inbound ? CUSTOMER_PAYMENT_ALLOCATE_TYPES : SUPPLIER_PAYMENT_ALLOCATE_TYPES,
  );

  const allocationPayload = useMemo(
    () => paymentAllocationsPayload(openItems, allocationValues),
    [allocationValues, openItems],
  );

  const currencies = currenciesQuery.data ?? [];
  const currencyCode = currencies.find((currency) => currency.id === currencyId)?.code ?? "";
  const bankAccounts = bankAccountsQuery.data ?? [];
  const parties = inbound ? (customersQuery.data ?? []) : (suppliersQuery.data ?? []);

  async function onSubmit(values: FormValues) {
    const payload: ChequeCreateRequest = {
      cheque_number: values.cheque_number.trim(),
      direction: values.direction,
      cheque_date: values.cheque_date,
      due_date: values.due_date.trim() || null,
      amount: values.amount.trim(),
      currency_id: values.currency_id,
      party_type: partyId ? (inbound ? "CUSTOMER" : "SUPPLIER") : null,
      party_id: partyId,
      bank_account_id: values.bank_account_id,
      narration: values.narration.trim() || null,
      allocations: allocationPayload.length > 0 ? allocationPayload : undefined,
    };
    try {
      if (cheque) {
        await updateCheque.mutateAsync({
          id: cheque.id,
          payload: { ...payload, version: cheque.version },
        });
        toast.success("Cheque updated");
        router.push(`/cheques/${cheque.id}`);
      } else {
        const created = await createCheque.mutateAsync(payload);
        toast.success("Cheque created");
        router.push(`/cheques/${created.id}`);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="direction"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Direction</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    form.setValue("party_id", OPTIONAL_SELECT_NONE);
                    setAllocationValues({});
                  }}
                  disabled={disabled || isEdit}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="INBOUND">Inbound (received)</SelectItem>
                    <SelectItem value="OUTBOUND">Outbound (issued)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cheque_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cheque number</FormLabel>
                <FormControl>
                  <Input {...field} disabled={disabled} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="cheque_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cheque date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} disabled={disabled} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="due_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due date (PDC)</FormLabel>
                <FormControl>
                  <Input type="date" {...field} disabled={disabled} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <DecimalInput kind="money" disabled={disabled} {...field} />
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
                <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.id} value={currency.id}>
                        {currency.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="party_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{inbound ? "Customer" : "Supplier"}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${inbound ? "customer" : "supplier"}`} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={OPTIONAL_SELECT_NONE}>None</SelectItem>
                    {parties.map((party) => (
                      <SelectItem key={party.id} value={party.id}>
                        {party.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bank_account_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bank account</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bank account" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {bankAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_name} — {account.bank_name}
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
          name="narration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Narration</FormLabel>
              <FormControl>
                <Textarea {...field} disabled={disabled} rows={2} />
              </FormControl>
            </FormItem>
          )}
        />
        {partyId ? (
          <PaymentAllocationEditor
            items={openItems}
            values={allocationValues}
            onChange={(itemId, value) =>
              setAllocationValues((current) => ({ ...current, [itemId]: value }))
            }
            currencyCode={currencyCode}
            baseCurrencyCode={baseCurrencyCode}
            received={amount}
            bankCharges="0"
            disabled={disabled}
            emptyMessage={
              inbound
                ? "No open invoices or opening AR for this customer."
                : "No open bills or opening AP for this supplier."
            }
          />
        ) : null}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={disabled || createCheque.isPending || updateCheque.isPending}
          >
            {cheque ? "Save changes" : "Create cheque"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
