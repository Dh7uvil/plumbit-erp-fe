"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";

import { useAllAccounts } from "@/modules/erp/accounting/accounts/queries";
import { accountPermissions } from "@/modules/erp/accounting/accounts/permissions";
import { useAllCostCenters } from "@/modules/erp/accounting/cost-centers/queries";
import { costCenterPermissions } from "@/modules/erp/accounting/cost-centers/permissions";
import { useCreateBudget } from "@/modules/erp/accounting/budgets/mutations";
import {
  BudgetFormSchema,
  type BudgetFormValues,
} from "@/modules/erp/accounting/budgets/schemas";
import { useAllBranches } from "@/modules/users-management/branches/queries";
import { branchPermissions } from "@/modules/users-management/branches/permissions";
import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { getErrorMessage } from "@/shared/api/errors";
import { MasterSelect } from "@/shared/components/form/master-select";
import { DecimalInput } from "@/shared/components/form/decimal-input";
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
import { Textarea } from "@/shared/components/ui/textarea";
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";
import { useCan } from "@/shared/providers/session-provider";

function emptyLine() {
  return {
    account_id: "",
    period_start: "",
    amount: "",
    cost_center_id: OPTIONAL_SELECT_NONE,
    branch_id: OPTIONAL_SELECT_NONE,
  };
}

export function BudgetFormScreen() {
  const router = useRouter();
  const can = useCan();
  const accountsQuery = useAllAccounts({}, can(accountPermissions.read));
  const costCentersQuery = useAllCostCenters(can(costCenterPermissions.read));
  const branchesQuery = useAllBranches(can(branchPermissions.read));
  const createBudget = useCreateBudget();
  const [formError, setFormError] = useState<string | null>(null);
  const accounts = (accountsQuery.data ?? []).filter((account) => !account.is_group);
  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(BudgetFormSchema),
    defaultValues: {
      name: "",
      fiscal_year: String(new Date().getFullYear()),
      notes: "",
      lines: [emptyLine()],
    },
  });
  const lines = useFieldArray({ control: form.control, name: "lines" });
  useDirtyFormGuard(form.formState.isDirty);

  async function onSubmit(values: BudgetFormValues) {
    setFormError(null);
    try {
      const created = await createBudget.mutateAsync({
        name: values.name,
        fiscal_year: Number(values.fiscal_year),
        notes: values.notes || undefined,
        lines: values.lines.map((line) => ({
          account_id: line.account_id,
          period_start: line.period_start,
          amount: line.amount,
          cost_center_id:
            line.cost_center_id && line.cost_center_id !== OPTIONAL_SELECT_NONE
              ? line.cost_center_id
              : undefined,
          branch_id:
            line.branch_id && line.branch_id !== OPTIONAL_SELECT_NONE ? line.branch_id : undefined,
        })),
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex max-w-3xl flex-col gap-4">
          {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
          <div className="grid gap-3 sm:grid-cols-2">
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
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Lines</p>
              <Button type="button" variant="outline" size="sm" onClick={() => lines.append(emptyLine())}>
                <Plus className="size-3.5" />
                Add line
              </Button>
            </div>
            {lines.fields.map((field, index) => (
              <div key={field.id} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name={`lines.${index}.account_id`}
                  render={({ field: accountField }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Account</FormLabel>
                      <MasterSelect
                        value={accountField.value || ""}
                        onValueChange={accountField.onChange}
                        placeholder="Choose an account"
                        searchPlaceholder="Search account…"
                        options={accounts.map((account) => ({
                          value: account.id,
                          label: `${account.code} — ${account.name}`,
                        }))}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`lines.${index}.period_start`}
                  render={({ field: periodField }) => (
                    <FormItem>
                      <FormLabel>Period</FormLabel>
                      <FormControl>
                        <Input type="date" {...periodField} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`lines.${index}.amount`}
                  render={({ field: amountField }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <DecimalInput kind="money" {...amountField} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`lines.${index}.cost_center_id`}
                  render={({ field: costCenterField }) => (
                    <FormItem>
                      <FormLabel>Cost center</FormLabel>
                      <MasterSelect
                        value={String(costCenterField.value ?? OPTIONAL_SELECT_NONE)}
                        onValueChange={costCenterField.onChange}
                        placeholder="None"
                        searchPlaceholder="Search cost center…"
                        options={[
                          { value: OPTIONAL_SELECT_NONE, label: "None" },
                          ...(costCentersQuery.data ?? []).map((center) => ({
                            value: center.id,
                            label: center.name,
                          })),
                        ]}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`lines.${index}.branch_id`}
                  render={({ field: branchField }) => (
                    <FormItem>
                      <FormLabel>Branch</FormLabel>
                      <MasterSelect
                        value={String(branchField.value ?? OPTIONAL_SELECT_NONE)}
                        onValueChange={branchField.onChange}
                        placeholder="None"
                        searchPlaceholder="Search branch…"
                        options={[
                          { value: OPTIONAL_SELECT_NONE, label: "None" },
                          ...(branchesQuery.data ?? []).map((branch) => ({
                            value: branch.id,
                            label: branch.name,
                          })),
                        ]}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {lines.fields.length > 1 ? (
                  <div className="flex justify-end sm:col-span-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => lines.remove(index)}
                    >
                      <Trash2 className="size-3.5" />
                      Remove line
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
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
