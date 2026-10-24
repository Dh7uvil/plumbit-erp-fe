"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { useCreateAccount, useUpdateAccount } from "@/modules/erp/accounting/accounts/mutations";
import { useAllAccounts, useAccountPeriodBalances } from "@/modules/erp/accounting/accounts/queries";
import {
  ACCOUNT_SUBTYPE_LABELS,
  ACCOUNT_SUBTYPES,
  AccountFormSchema,
  EMPTY_ACCOUNT_FORM,
  accountTypeForSubtype,
  composeAccountCode,
  splitAccountCode,
  type Account,
  type AccountFormValues,
} from "@/modules/erp/accounting/accounts/schemas";
import { useAllTaxes } from "@/modules/erp/accounting/taxes/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { MasterSelect } from "@/shared/components/form/master-select";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
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
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";
import { useBaseCurrency } from "@/shared/hooks/use-base-currency";
import { formatReportMoney, formatSignedLedgerBalance } from "@/shared/lib/format";
import { cn } from "@/shared/lib/cn";

const fieldControlClass = "h-9";
const readOnlyFieldClass = "bg-muted/50 text-muted-foreground";

function toFormValues(account: Account | null, defaultCurrencyId?: string): AccountFormValues {
  if (!account) {
    return EMPTY_ACCOUNT_FORM;
  }
  const { subAccountNumber, manualCode } = splitAccountCode(account.code, account.parent_code);
  return {
    code: account.code,
    sub_account_number: subAccountNumber,
    manual_code: manualCode,
    name: account.name,
    description: account.description ?? "",
    account_type: account.account_type,
    account_subtype: account.account_subtype,
    parent_id: account.parent_id ?? OPTIONAL_SELECT_NONE,
    is_group: account.is_group,
    is_active: account.is_active,
    is_blocked: account.is_blocked,
    currency_id: account.currency_id ?? defaultCurrencyId ?? OPTIONAL_SELECT_NONE,
    default_tax_id: account.default_tax_id ?? OPTIONAL_SELECT_NONE,
    ledger_kind: account.is_standalone_ledger
      ? "standalone"
      : account.linked_party_id
        ? "existing_party"
        : "none",
    party_name: account.linked_party_name ?? "",
    party_id: account.linked_party_id ?? OPTIONAL_SELECT_NONE,
  };
}

export function AccountForm({
  account,
  disabled = false,
  lockGroupFlag = false,
  onSuccess,
  showCancel = false,
  onCancel,
}: {
  account: Account | null;
  disabled?: boolean;
  /** When true, the group/postable flag cannot be changed (posted lines or children). */
  lockGroupFlag?: boolean;
  onSuccess?: (entity: Account) => void;
  showCancel?: boolean;
  onCancel?: () => void;
}) {
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const groupsQuery = useAllAccounts({ is_group: true });
  const taxesQuery = useAllTaxes();
  const [formError, setFormError] = useState<string | null>(null);
  const isEdit = Boolean(account);
  const { baseCurrencyId } = useBaseCurrency();
  const codeLocked = account?.is_system === true;
  const periodBalancesQuery = useAccountPeriodBalances(
    account?.id ?? null,
    undefined,
    isEdit && !account?.is_group,
  );

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(AccountFormSchema),
    values: toFormValues(account, baseCurrencyId),
  });
  useDirtyFormGuard(form.formState.isDirty && !disabled);
  const accountSubtype = useWatch({ control: form.control, name: "account_subtype" });
  const isGroup = useWatch({ control: form.control, name: "is_group" });
  const parentId = useWatch({ control: form.control, name: "parent_id" });
  const subAccountNumber = useWatch({ control: form.control, name: "sub_account_number" });
  const manualCode = useWatch({ control: form.control, name: "manual_code" });
  const selectedTax =
    taxesQuery.data?.find((tax) => tax.id === account?.default_tax_id) ??
    (account?.default_tax_id
      ? { name: "Tax", rate: account.default_tax_rate ?? "0" }
      : null);
  const subtypeOptions = ACCOUNT_SUBTYPES;
  const groups = useMemo(
    () => (groupsQuery.data ?? []).filter((row) => row.id !== account?.id),
    [account?.id, groupsQuery.data],
  );
  const selectedParent = useMemo(
    () => groups.find((row) => row.id === parentId) ?? null,
    [groups, parentId],
  );
  const pending = createAccount.isPending || updateAccount.isPending;
  const hasMainAccount = !isGroup && parentId !== OPTIONAL_SELECT_NONE && parentId !== "";
  const showAccountNumberField = isGroup || !hasMainAccount || manualCode;

  useEffect(() => {
    form.setValue("account_type", accountTypeForSubtype(accountSubtype));
  }, [accountSubtype, form]);

  useEffect(() => {
    if (manualCode || codeLocked || !hasMainAccount || !selectedParent) {
      return;
    }
    const composed = composeAccountCode(selectedParent.code, subAccountNumber);
    if (form.getValues("code") !== composed) {
      form.setValue("code", composed, { shouldDirty: true });
    }
  }, [
    codeLocked,
    form,
    hasMainAccount,
    manualCode,
    selectedParent,
    subAccountNumber,
  ]);

  async function onSubmit(values: AccountFormValues) {
    setFormError(null);
    try {
      const payload: AccountFormValues = {
        ...values,
        account_type: accountTypeForSubtype(values.account_subtype),
        description: values.name,
      };
      const saved = isEdit
        ? await updateAccount.mutateAsync({
            id: account!.id,
            values: payload,
            isSystem: account!.is_system,
            existing: account!,
          })
        : await createAccount.mutateAsync(payload);
      toast.success(isEdit ? "Account saved" : "Account created");
      form.reset(toFormValues(saved, baseCurrencyId));
      onSuccess?.(saved);
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  return (
    <Form {...form}>
      <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
        <div
          data-slot="form-grid"
          className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          <FormField
            control={form.control}
            name="is_group"
            render={({ field }) => (
              <FormItem className="col-span-full flex flex-row items-center gap-2.5 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    disabled={disabled || lockGroupFlag}
                    onCheckedChange={(checked) => {
                      const next = checked === true;
                      field.onChange(next);
                      if (next) {
                        form.setValue("parent_id", OPTIONAL_SELECT_NONE);
                        form.setValue("sub_account_number", "");
                      }
                    }}
                  />
                </FormControl>
                <FormLabel className="leading-snug">
                  Main account
                  {lockGroupFlag ? (
                    <span className="text-muted-foreground ml-1 text-xs font-normal">
                      (locked after journal activity or children)
                    </span>
                  ) : null}
                </FormLabel>
              </FormItem>
            )}
          />
          {!isGroup ? (
            <FormField
              control={form.control}
              name="parent_id"
              render={({ field }) => (
                <FormItem className="lg:col-span-2">
                  <FormLabel>Main account</FormLabel>
                  <MasterSelect
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      if (value === OPTIONAL_SELECT_NONE) {
                        form.setValue("sub_account_number", "");
                        form.setValue("manual_code", true);
                      } else {
                        form.setValue("manual_code", false);
                      }
                    }}
                    disabled={disabled}
                    placeholder="Select main account"
                    searchPlaceholder="Search main account…"
                    options={[
                      { value: OPTIONAL_SELECT_NONE, label: "Select main account" },
                      ...groups.map((row) => ({
                        value: row.id,
                        label: `${row.code} — ${row.name}`,
                      })),
                    ]}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}
          {!isGroup && hasMainAccount ? (
            <FormField
              control={form.control}
              name="sub_account_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sub account number</FormLabel>
                  <FormControl>
                    <Input
                      disabled={disabled || codeLocked}
                      maxLength={20}
                      className={cn(fieldControlClass, "font-mono tabular-nums")}
                      {...field}
                      onChange={(event) => {
                        field.onChange(event);
                        form.setValue("manual_code", false, { shouldDirty: true });
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}
          {showAccountNumberField ? (
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isGroup ? "Main account number" : "Account number"}</FormLabel>
                  <FormControl>
                    <Input
                      disabled={disabled || codeLocked}
                      maxLength={20}
                      className={cn(fieldControlClass, "font-mono tabular-nums")}
                      {...field}
                      onChange={(event) => {
                        field.onChange(event);
                        form.setValue("manual_code", true, { shouldDirty: true });
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input disabled={disabled} maxLength={200} className={fieldControlClass} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="account_subtype"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Financial category</FormLabel>
                <Select value={field.value} disabled={disabled} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className={fieldControlClass}>
                      <SelectValue placeholder="Financial category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {subtypeOptions.map((subtype) => (
                      <SelectItem key={subtype} value={subtype}>
                        {ACCOUNT_SUBTYPE_LABELS[subtype]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          {isEdit && selectedTax ? (
            <FormItem>
              <FormLabel>Tax type</FormLabel>
              <FormControl>
                <Input
                  disabled
                  readOnly
                  value={selectedTax.name}
                  className={cn(fieldControlClass, readOnlyFieldClass)}
                />
              </FormControl>
              <FormDescription>Rate: {selectedTax.rate}% (read-only)</FormDescription>
            </FormItem>
          ) : null}
          <FormField
            control={form.control}
            name="is_blocked"
            render={({ field }) => (
              <FormItem className="col-span-full flex flex-row items-center gap-2.5 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    disabled={disabled}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                </FormControl>
                <FormLabel className="font-normal leading-snug">Blocked</FormLabel>
              </FormItem>
            )}
          />
          {isEdit ? (
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="col-span-full flex flex-row items-center gap-2.5 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      disabled={disabled}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                    />
                  </FormControl>
                  <FormLabel className="font-normal leading-snug">Active (status)</FormLabel>
                </FormItem>
              )}
            />
          ) : null}
        </div>
        {isEdit && !account?.is_group && periodBalancesQuery.data ? (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-3 py-2 font-medium">Period</th>
                  <th className="px-3 py-2 font-medium text-right">Debit</th>
                  <th className="px-3 py-2 font-medium text-right">Credit</th>
                  <th className="px-3 py-2 font-medium text-right">Cur. balance</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-3 py-2 font-medium">OP. Balance</td>
                  <td className="px-3 py-2" />
                  <td className="px-3 py-2" />
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatSignedLedgerBalance(
                      periodBalancesQuery.data.opening,
                      periodBalancesQuery.data.currency_code,
                      account!.account_type,
                    )}
                  </td>
                </tr>
                {periodBalancesQuery.data.periods.map((row) => (
                  <tr key={row.period} className="border-b">
                    <td className="px-3 py-2 tabular-nums">
                      {String(row.period).padStart(2, "0")}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatReportMoney(row.debit, periodBalancesQuery.data.currency_code)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatReportMoney(row.credit, periodBalancesQuery.data.currency_code)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatSignedLedgerBalance(
                        row.closing,
                        periodBalancesQuery.data.currency_code,
                        account!.account_type,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        {disabled ? null : (
          <div className="flex justify-end gap-2">
            {showCancel ? (
              <Button type="button" variant="outline" disabled={pending} onClick={onCancel}>
                Cancel
              </Button>
            ) : null}
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {isEdit ? "Save" : "Create account"}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
