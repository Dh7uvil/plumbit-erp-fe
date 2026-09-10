"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import {
  useCreateAccount,
  useUpdateAccount,
} from "@/modules/erp/accounting/accounts/mutations";
import { useAllAccounts } from "@/modules/erp/accounting/accounts/queries";
import {
  ACCOUNT_SUBTYPE_LABELS,
  ACCOUNT_SUBTYPES,
  ACCOUNT_TYPE_LABELS,
  ACCOUNT_TYPES,
  AccountFormSchema,
  EMPTY_ACCOUNT_FORM,
  type Account,
  type AccountFormValues,
} from "@/modules/erp/accounting/accounts/schemas";
import { CurrencyFormDialog } from "@/modules/erp/currencies/components/currency-form-dialog";
import { currencyPermissions } from "@/modules/erp/currencies/permissions";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { MasterSelect } from "@/shared/components/form/master-select";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
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

function toFormValues(account: Account | null): AccountFormValues {
  if (!account) {
    return EMPTY_ACCOUNT_FORM;
  }
  return {
    code: account.code,
    name: account.name,
    description: account.description ?? "",
    account_type: account.account_type,
    account_subtype: account.account_subtype,
    parent_id: account.parent_id ?? OPTIONAL_SELECT_NONE,
    is_group: account.is_group,
    is_active: account.is_active,
    currency_id: account.currency_id ?? OPTIONAL_SELECT_NONE,
  };
}

export function AccountForm({
  account,
  disabled = false,
  onSuccess,
  showCancel = false,
  onCancel,
}: {
  account: Account | null;
  disabled?: boolean;
  onSuccess?: (entity: Account) => void;
  showCancel?: boolean;
  onCancel?: () => void;
}) {
  const can = useCan();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const groupsQuery = useAllAccounts({ is_group: true });
  const currenciesQuery = useAllCurrencies();
  const [formError, setFormError] = useState<string | null>(null);
  const [creatingCurrency, setCreatingCurrency] = useState(false);
  const isEdit = Boolean(account);
  const codeLocked = account?.is_system === true;

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(AccountFormSchema),
    values: toFormValues(account),
  });
  useDirtyFormGuard(form.formState.isDirty && !disabled);
  const accountType = useWatch({ control: form.control, name: "account_type" });
  const groups = useMemo(
    () =>
      (groupsQuery.data ?? []).filter(
        (row) => row.account_type === accountType && row.id !== account?.id,
      ),
    [account?.id, accountType, groupsQuery.data],
  );
  const currencies = currenciesQuery.data ?? [];
  const pending = createAccount.isPending || updateAccount.isPending;

  async function onSubmit(values: AccountFormValues) {
    setFormError(null);
    try {
      const saved = isEdit
        ? await updateAccount.mutateAsync({
            id: account!.id,
            values,
            isSystem: account!.is_system,
          })
        : await createAccount.mutateAsync(values);
      toast.success(isEdit ? "Account saved" : "Account created");
      form.reset(toFormValues(saved));
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code</FormLabel>
                <FormControl>
                  <Input disabled={disabled || codeLocked} maxLength={20} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input disabled={disabled} maxLength={200} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="account_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select
                  value={field.value}
                  disabled={disabled}
                  onValueChange={(value) => {
                    field.onChange(value);
                    form.setValue("parent_id", OPTIONAL_SELECT_NONE);
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {ACCOUNT_TYPE_LABELS[type]}
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
            name="account_subtype"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subtype</FormLabel>
                <Select value={field.value} disabled={disabled} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Subtype" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ACCOUNT_SUBTYPES.map((subtype) => (
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
          <FormField
            control={form.control}
            name="parent_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parent</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled}
                  placeholder="No parent"
                  searchPlaceholder="Search group…"
                  options={[
                    { value: OPTIONAL_SELECT_NONE, label: "No parent" },
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
          <FormField
            control={form.control}
            name="currency_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled}
                  placeholder="Base currency"
                  searchPlaceholder="Search currency…"
                  createLabel="Create currency"
                  onCreate={
                    can(currencyPermissions.create) ? () => setCreatingCurrency(true) : undefined
                  }
                  options={[
                    { value: OPTIONAL_SELECT_NONE, label: "Base currency" },
                    ...currencies.map((currency) => ({
                      value: currency.id,
                      label: `${currency.code} — ${currency.name}`,
                    })),
                  ]}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="col-span-full">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="is_group"
            render={({ field }) => (
              <FormItem className="col-span-full flex flex-row items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    disabled={disabled}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                </FormControl>
                <FormLabel>Group account (not postable)</FormLabel>
              </FormItem>
            )}
          />
          {isEdit ? (
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="col-span-full flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      disabled={disabled}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                    />
                  </FormControl>
                  <FormLabel>Active</FormLabel>
                </FormItem>
              )}
            />
          ) : null}
        </div>
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
      <CurrencyFormDialog
        open={creatingCurrency}
        currency={null}
        nested
        onCreated={(entity) => form.setValue("currency_id", entity.id, { shouldDirty: true })}
        onOpenChange={setCreatingCurrency}
      />
    </Form>
  );
}
