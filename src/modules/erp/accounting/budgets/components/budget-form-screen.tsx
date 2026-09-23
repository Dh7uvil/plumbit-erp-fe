"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { useAllAccounts } from "@/modules/erp/accounting/accounts/queries";
import { accountPermissions } from "@/modules/erp/accounting/accounts/permissions";
import { useCreateBudget } from "@/modules/erp/accounting/budgets/mutations";
import { BudgetFormSchema, type BudgetFormValues } from "@/modules/erp/accounting/budgets/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
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
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";
import { useCan } from "@/shared/providers/session-provider";

export function BudgetFormScreen() {
  const router = useRouter();
  const can = useCan();
  const accountsQuery = useAllAccounts({}, can(accountPermissions.read));
  const createBudget = useCreateBudget();
  const [formError, setFormError] = useState<string | null>(null);
  const accounts = (accountsQuery.data ?? []).filter((account) => !account.is_group);
  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(BudgetFormSchema),
    defaultValues: {
      name: "",
      fiscal_year: String(new Date().getFullYear()),
      account_id: "",
      period_start: "",
      amount: "",
      notes: "",
    },
  });
  useDirtyFormGuard(form.formState.isDirty);

  async function onSubmit(values: BudgetFormValues) {
    setFormError(null);
    try {
      const created = await createBudget.mutateAsync({
        name: values.name,
        fiscal_year: Number(values.fiscal_year),
        notes: values.notes || undefined,
        lines: [
          {
            account_id: values.account_id,
            period_start: values.period_start,
            amount: values.amount,
          },
        ],
      });
      form.reset(values);
      router.push(`/budgets/${created.id}`);
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="New budget"
        subtitle="Budget amounts are plans. Saving does not post to the ledger."
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex max-w-xl flex-col gap-3">
          {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fiscal_year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fiscal year</FormLabel>
                <FormControl>
                  <Input inputMode="numeric" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="account_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account</FormLabel>
                <Select value={field.value || undefined} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an account" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {accounts.map((account) => (
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
          <FormField
            control={form.control}
            name="period_start"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Period</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input inputMode="decimal" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={createBudget.isPending}>
              {createBudget.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Create budget
            </Button>
          </div>
        </form>
      </Form>
    </ListPage>
  );
}
