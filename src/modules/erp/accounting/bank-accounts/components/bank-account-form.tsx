"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  useCreateBankAccount,
  useUpdateBankAccount,
} from "@/modules/erp/accounting/bank-accounts/mutations";
import type { BankAccount } from "@/modules/erp/accounting/bank-accounts/schemas";
import { useAccounts } from "@/modules/erp/accounting/accounts/queries";
import { isCashOrBankAccount } from "@/modules/erp/accounting/accounts/schemas";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { useBaseCurrency } from "@/shared/hooks/use-base-currency";
import { getErrorMessage } from "@/shared/api/errors";
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
import { Switch } from "@/shared/components/ui/switch";

const FormSchema = z.object({
  account_id: z.string().uuid("Select a bank GL account"),
  account_name: z.string().min(1, "Account name is required"),
  bank_name: z.string().min(1, "Bank name is required"),
  branch_name: z.string(),
  account_number: z.string(),
  iban: z.string(),
  swift: z.string(),
  currency_id: z.string().uuid("Select a currency"),
  opening_balance: z.string(),
  opening_date: z.string(),
  is_default: z.boolean(),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof FormSchema>;

export function BankAccountForm({
  bankAccount,
  disabled = false,
  onSuccess,
  onCancel,
  showCancel = false,
}: {
  bankAccount?: BankAccount | null;
  disabled?: boolean;
  onSuccess?: (entity: BankAccount) => void;
  onCancel?: () => void;
  showCancel?: boolean;
}) {
  const createBankAccount = useCreateBankAccount();
  const updateBankAccount = useUpdateBankAccount();
  const accountsQuery = useAccounts({ page: 1, page_size: 200 });
  const currenciesQuery = useAllCurrencies();
  const { baseCurrencyId } = useBaseCurrency();
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      account_id: bankAccount?.account_id ?? "",
      account_name: bankAccount?.account_name ?? "",
      bank_name: bankAccount?.bank_name ?? "",
      branch_name: bankAccount?.branch_name ?? "",
      account_number: bankAccount?.account_number ?? "",
      iban: bankAccount?.iban ?? "",
      swift: bankAccount?.swift ?? "",
      currency_id: bankAccount?.currency_id ?? baseCurrencyId ?? "",
      opening_balance: bankAccount?.opening_balance ?? "0",
      opening_date: bankAccount?.opening_date ?? "",
      is_default: bankAccount?.is_default ?? false,
      is_active: bankAccount?.is_active ?? true,
    },
  });

  useEffect(() => {
    if (!bankAccount && baseCurrencyId && !form.getValues("currency_id")) {
      form.setValue("currency_id", baseCurrencyId);
    }
  }, [bankAccount, baseCurrencyId, form]);

  const bankAccounts = (accountsQuery.data?.data ?? []).filter(
    (row) => isCashOrBankAccount(row) && row.account_subtype === "BANK" && !row.is_group,
  );

  async function onSubmit(values: FormValues) {
    try {
      const payload = {
        ...values,
        branch_name: values.branch_name || null,
        account_number: values.account_number || null,
        iban: values.iban || null,
        swift: values.swift || null,
        opening_date: values.opening_date.trim() || null,
      };
      const saved = bankAccount
        ? await updateBankAccount.mutateAsync({ id: bankAccount.id, payload })
        : await createBankAccount.mutateAsync(payload);
      toast.success(bankAccount ? "Bank account updated" : "Bank account created");
      onSuccess?.(saved);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {!bankAccount ? (
          <FormField
            control={form.control}
            name="account_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GL bank account</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {bankAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.code} — {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}
        <FormField
          control={form.control}
          name="account_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account name</FormLabel>
              <FormControl>
                <Input {...field} disabled={disabled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bank_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bank name</FormLabel>
              <FormControl>
                <Input {...field} disabled={disabled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="account_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account number</FormLabel>
                <FormControl>
                  <Input {...field} disabled={disabled} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="iban"
            render={({ field }) => (
              <FormItem>
                <FormLabel>IBAN</FormLabel>
                <FormControl>
                  <Input {...field} disabled={disabled} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="opening_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Opening date</FormLabel>
              <FormControl>
                <Input type="date" {...field} disabled={disabled} />
              </FormControl>
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
                  {(currenciesQuery.data ?? []).map((currency) => (
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
        <FormField
          control={form.control}
          name="is_default"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-md border p-3">
              <FormLabel>Default bank account</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={disabled}
                />
              </FormControl>
            </FormItem>
          )}
        />
        {bankAccount ? (
          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-md border p-3">
                <FormLabel>Active</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={disabled}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        ) : null}
        <div className="flex justify-end gap-2">
          {showCancel ? (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
          <Button type="submit" disabled={disabled}>
            {bankAccount ? "Save changes" : "Create bank account"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
