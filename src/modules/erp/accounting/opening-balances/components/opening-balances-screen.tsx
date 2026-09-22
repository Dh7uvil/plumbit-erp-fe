"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { Loader2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

import { useAllAccounts } from "@/modules/erp/accounting/accounts/queries";
import {
  useCommitOpeningBalances,
  usePreviewOpeningBalances,
  useResetOpeningBalances,
} from "@/modules/erp/accounting/opening-balances/mutations";
import { useOpeningBalanceState } from "@/modules/erp/accounting/opening-balances/queries";
import {
  OPENING_BALANCE_STEPS,
  OpeningBalanceFormSchema,
  emptyGlLine,
  emptyOpenItem,
  emptyStockLine,
  type OpeningBalanceFormValues,
  type OpeningBalancePreview,
  type OpeningBalanceState,
} from "@/modules/erp/accounting/opening-balances/schemas";
import { useAllCustomers } from "@/modules/crm/customers/queries";
import { useAllSuppliers } from "@/modules/erp/suppliers/queries";
import { useAllProducts } from "@/modules/inventory-management/products/queries";
import { useAllWarehouses } from "@/modules/inventory-management/warehouses/queries";
import { useCurrentTenant } from "@/modules/users-management/tenants/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { DataTableError } from "@/shared/components/data-table/states";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { PageHeader } from "@/shared/components/layout/page-header";
import { WizardSteps } from "@/shared/components/layout/wizard-steps";
import { MasterSelect } from "@/shared/components/form/master-select";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { TableActionTooltip } from "@/shared/components/data-table/row-actions";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { DecimalInput } from "@/shared/components/form/decimal-input";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { formatDate, formatReportMoney } from "@/shared/lib/format";
import { applyFieldErrors } from "@/shared/lib/form-errors";

const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function OpeningBalancesScreen() {
  const stateQuery = useOpeningBalanceState();
  const state = stateQuery.data;

  if (stateQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (stateQuery.isError) {
    return (
      <DataTableError
        message={getErrorMessage(stateQuery.error)}
        onRetry={() => stateQuery.refetch()}
      />
    );
  }

  if (state?.committed) {
    return <CommittedOpeningBalances />;
  }

  return <OpeningBalanceWizard state={state ?? null} />;
}

function CommittedOpeningBalances() {
  const stateQuery = useOpeningBalanceState();
  const reset = useResetOpeningBalances();
  const [confirmReset, setConfirmReset] = useState(false);
  const state = stateQuery.data;

  async function onReset() {
    try {
      await reset.mutateAsync();
      toast.success("Opening balances reset");
      setConfirmReset(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Opening balances" subtitle="Books are live. This screen is read-only." />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Committed state</CardTitle>
        </CardHeader>
        <CardContent
          data-slot="form-grid"
          className="grid grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-2"
        >
          <p className="text-sm">
            Books start {state?.books_start_date ? formatDate(state.books_start_date) : "—"}
          </p>
          <p className="text-sm">
            Hard lock {state?.hard_lock_date ? formatDate(state.hard_lock_date) : "—"}
          </p>
          <p className="text-sm">
            Journal{" "}
            {state?.journal_entry_id ? (
              <Link
                href={`/journals/${state.journal_entry_id}`}
                className="cursor-pointer hover:underline"
              >
                {state.document_number ?? "Opening journal"}
              </Link>
            ) : (
              "—"
            )}
          </p>
          <p className="text-sm">
            Committed {state?.committed_at ? formatDate(state.committed_at) : "—"}
          </p>
        </CardContent>
      </Card>
      {state?.can_reset ? (
        <Button
          type="button"
          variant="destructive"
          className="self-start"
          onClick={() => setConfirmReset(true)}
        >
          Reset opening balances
        </Button>
      ) : (
        <p className="text-muted-foreground text-sm">
          Reset is unavailable because later posted activity exists.
        </p>
      )}
      <ConfirmActionDialog
        open={confirmReset}
        title="Reset opening balances"
        description="This reverses the opening journal, drops opening stock layers, and clears the books start lock. Only possible while nothing has posted after go-live."
        confirmLabel="Reset"
        variant="destructive"
        pending={reset.isPending}
        onOpenChange={setConfirmReset}
        onConfirm={() => void onReset()}
      />
    </div>
  );
}

function OpeningBalanceWizard({ state }: { state: OpeningBalanceState | null }) {
  const tenantQuery = useCurrentTenant();
  const accountsQuery = useAllAccounts({ is_group: false, is_active: true });
  const customersQuery = useAllCustomers();
  const suppliersQuery = useAllSuppliers();
  const warehousesQuery = useAllWarehouses();
  const productsQuery = useAllProducts();
  const previewMutation = usePreviewOpeningBalances();
  const commitMutation = useCommitOpeningBalances();
  const [step, setStep] = useState<(typeof OPENING_BALANCE_STEPS)[number]["id"]>("dates");
  const [preview, setPreview] = useState<OpeningBalancePreview | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmCommit, setConfirmCommit] = useState(false);
  const [acknowledgeActivity, setAcknowledgeActivity] = useState(false);
  const form = useForm<OpeningBalanceFormValues>({
    resolver: zodResolver(OpeningBalanceFormSchema),
    defaultValues: {
      books_start_date: "",
      gl_lines: [emptyGlLine()],
      ar_items: [emptyOpenItem()],
      ap_items: [emptyOpenItem()],
      stock_lines: [emptyStockLine()],
    },
  });
  const glArray = useFieldArray({ control: form.control, name: "gl_lines" });
  const arArray = useFieldArray({ control: form.control, name: "ar_items" });
  const apArray = useFieldArray({ control: form.control, name: "ap_items" });
  const stockArray = useFieldArray({ control: form.control, name: "stock_lines" });
  const postableAccounts = (accountsQuery.data ?? []).filter((row) => !row.is_group);
  const customers = customersQuery.data ?? [];
  const suppliers = suppliersQuery.data ?? [];
  const warehouses = warehousesQuery.data ?? [];
  const products = (productsQuery.data ?? []).filter((row) => row.track_inventory);
  const stepIndex = OPENING_BALANCE_STEPS.findIndex((item) => item.id === step);
  const fiscalLabel = useMemo(() => {
    const month = tenantQuery.data?.fiscal_year_start_month ?? 1;
    const day = tenantQuery.data?.fiscal_year_start_day ?? 1;
    return `${MONTH_LABELS[month - 1] ?? month} ${day}`;
  }, [tenantQuery.data]);

  async function goPreview() {
    setFormError(null);
    const valid = await form.trigger("books_start_date");
    if (!valid) {
      setStep("dates");
      return;
    }
    try {
      const result = await previewMutation.mutateAsync(form.getValues());
      setPreview(result);
      setStep("preview");
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  async function onCommit() {
    setFormError(null);
    try {
      await commitMutation.mutateAsync({
        values: form.getValues(),
        acknowledgeExistingActivity: acknowledgeActivity,
      });
      toast.success("Opening balances committed");
      setConfirmCommit(false);
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        setConfirmCommit(false);
        return;
      }
      setFormError(getErrorMessage(error));
      setConfirmCommit(false);
    }
  }

  function next() {
    if (step === "stock") {
      void goPreview();
      return;
    }
    const nextStep = OPENING_BALANCE_STEPS[stepIndex + 1];
    if (nextStep) {
      setStep(nextStep.id);
    }
  }

  function back() {
    const prev = OPENING_BALANCE_STEPS[stepIndex - 1];
    if (prev) {
      setStep(prev.id);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Opening balances"
        subtitle="Guided go-live. Debits increase assets; credits increase liabilities. Customer (AR) amounts are what they owe you; supplier (AP) amounts are what you owe them."
      />
      <WizardSteps steps={[...OPENING_BALANCE_STEPS]} currentStep={step} />
      {state?.has_posted_activity || (state?.posted_journal_count ?? 0) > 0 ? (
        <Alert>
          <AlertTitle>Posted activity already exists</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <span>
              This tenant already has {state?.posted_journal_count ?? 0} posted journal
              {(state?.posted_journal_count ?? 0) === 1 ? "" : "s"}
              {state?.stock_movement_count
                ? ` and ${state.stock_movement_count} stock movement${state.stock_movement_count === 1 ? "" : "s"}`
                : ""}
              . Committing opening balances after live posting can lock posted dates or insert
              opening entries after activity. Prefer inventory catch-up unless you have period
              override and explicitly acknowledge this.
            </span>
            <Link
              href="/reports/stock-valuation-gl"
              className="text-sm font-medium underline-offset-4 hover:underline"
            >
              Open Stock valuation vs GL
            </Link>
          </AlertDescription>
        </Alert>
      ) : null}
      {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
      <Form {...form}>
        <form className="flex flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
          {step === "dates" ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Fiscal year and books start</CardTitle>
              </CardHeader>
              <CardContent
                data-slot="form-grid"
                className="grid grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-2"
              >
                <div>
                  <p className="text-muted-foreground text-xs font-medium">Fiscal year start</p>
                  <p className="text-sm">{fiscalLabel}</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Change month and day in Organization Settings.
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name="books_start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Books start date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          ) : null}
          {step === "gl" ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">GL balances</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {glArray.fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                    <FormField
                      control={form.control}
                      name={`gl_lines.${index}.account_id`}
                      render={({ field: accountField }) => (
                        <FormItem>
                          <FormLabel>Account</FormLabel>
                          <MasterSelect
                            value={accountField.value}
                            onValueChange={accountField.onChange}
                            placeholder="Select account"
                            options={postableAccounts.map((row) => ({
                              value: row.id,
                              label: `${row.code} — ${row.name}`,
                            }))}
                          />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`gl_lines.${index}.debit`}
                      render={({ field: debitField }) => (
                        <FormItem>
                          <FormLabel>Debit</FormLabel>
                          <FormControl>
                            <DecimalInput kind="money" {...debitField} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`gl_lines.${index}.credit`}
                      render={({ field: creditField }) => (
                        <FormItem>
                          <FormLabel>Credit</FormLabel>
                          <FormControl>
                            <DecimalInput kind="money" {...creditField} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2">
                      <FormField
                        control={form.control}
                        name={`gl_lines.${index}.description`}
                        render={({ field: descField }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Input {...descField} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <TableActionTooltip label="Remove GL line">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Remove GL line"
                          onClick={() => glArray.remove(index)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TableActionTooltip>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="self-start"
                  onClick={() => glArray.append(emptyGlLine())}
                >
                  <Plus className="size-3.5" />
                  Add GL line
                </Button>
              </CardContent>
            </Card>
          ) : null}
          {step === "ar" || step === "ap" ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {step === "ar" ? "Open receivables" : "Open payables"}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {(step === "ar" ? arArray : apArray).fields.map((field, index) => {
                  const name = step === "ar" ? "ar_items" : "ap_items";
                  const parties = step === "ar" ? customers : suppliers;
                  const array = step === "ar" ? arArray : apArray;
                  return (
                    <div key={field.id} className="grid grid-cols-1 gap-2 sm:grid-cols-5">
                      <FormField
                        control={form.control}
                        name={`${name}.${index}.party_id`}
                        render={({ field: partyField }) => (
                          <FormItem>
                            <FormLabel>{step === "ar" ? "Customer" : "Supplier"}</FormLabel>
                            <MasterSelect
                              value={partyField.value}
                              onValueChange={partyField.onChange}
                              placeholder={step === "ar" ? "Customer" : "Supplier"}
                              options={parties.map((row) => ({ value: row.id, label: row.name }))}
                            />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`${name}.${index}.amount`}
                        render={({ field: amountField }) => (
                          <FormItem>
                            <FormLabel>
                              Amount
                              {step === "ar" ? " (what they owe you)" : " (what you owe them)"}
                            </FormLabel>
                            <FormControl>
                              <DecimalInput kind="money" {...amountField} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`${name}.${index}.due_date`}
                        render={({ field: dueField }) => (
                          <FormItem>
                            <FormLabel>Due date</FormLabel>
                            <FormControl>
                              <Input type="date" {...dueField} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`${name}.${index}.external_reference`}
                        render={({ field: refField }) => (
                          <FormItem>
                            <FormLabel>Invoice no.</FormLabel>
                            <FormControl>
                              <Input {...refField} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <TableActionTooltip label="Remove open item">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Remove open item"
                          onClick={() => array.remove(index)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TableActionTooltip>
                    </div>
                  );
                })}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="self-start"
                  onClick={() => (step === "ar" ? arArray : apArray).append(emptyOpenItem())}
                >
                  <Plus className="size-3.5" />
                  Add item
                </Button>
              </CardContent>
            </Card>
          ) : null}
          {step === "stock" ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Opening stock</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {stockArray.fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 gap-2 sm:grid-cols-5">
                    <FormField
                      control={form.control}
                      name={`stock_lines.${index}.warehouse_id`}
                      render={({ field: warehouseField }) => (
                        <FormItem>
                          <FormLabel>Warehouse</FormLabel>
                          <MasterSelect
                            value={warehouseField.value}
                            onValueChange={warehouseField.onChange}
                            placeholder="Select warehouse"
                            options={warehouses.map((row) => ({
                              value: row.id,
                              label: `${row.code} — ${row.name}`,
                            }))}
                          />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`stock_lines.${index}.product_id`}
                      render={({ field: productField }) => (
                        <FormItem>
                          <FormLabel>Product</FormLabel>
                          <MasterSelect
                            value={productField.value}
                            onValueChange={productField.onChange}
                            placeholder="Select product"
                            options={products.map((row) => ({
                              value: row.id,
                              label: `${row.sku} — ${row.name}`,
                            }))}
                          />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`stock_lines.${index}.quantity`}
                      render={({ field: qtyField }) => (
                        <FormItem>
                          <FormLabel>Qty</FormLabel>
                          <FormControl>
                            <DecimalInput kind="quantity" {...qtyField} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`stock_lines.${index}.unit_cost`}
                      render={({ field: costField }) => (
                        <FormItem>
                          <FormLabel>Unit cost</FormLabel>
                          <FormControl>
                            <DecimalInput kind="money" {...costField} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <TableActionTooltip label="Remove stock line">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Remove stock line"
                        onClick={() => stockArray.remove(index)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </TableActionTooltip>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="self-start"
                  onClick={() => stockArray.append(emptyStockLine())}
                >
                  <Plus className="size-3.5" />
                  Add stock line
                </Button>
              </CardContent>
            </Card>
          ) : null}
          {step === "preview" || step === "commit" ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preview</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {previewMutation.isPending ? <Skeleton className="h-32 w-full" /> : null}
                {preview ? (
                  <>
                    <p className="text-sm">
                      Entry date {formatDate(preview.entry_date)}. Opening balance equity difference{" "}
                      {formatReportMoney(preview.difference)}.
                    </p>
                    <p className="text-sm">
                      Totals debit {formatReportMoney(preview.total_debit)} / credit{" "}
                      {formatReportMoney(preview.total_credit)}. Inventory value{" "}
                      {formatReportMoney(preview.inventory_value)}.
                    </p>
                    <ul className="flex flex-col gap-1 text-sm">
                      {preview.lines.map((line, index) => (
                        <li key={`${line.account_id}-${index}`}>
                          {line.account_code} {line.account_name}: Dr{" "}
                          {formatReportMoney(line.debit)} / Cr {formatReportMoney(line.credit)}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm">Run preview from Opening stock.</p>
                )}
                {step === "commit" ? (
                  <>
                    <Alert>
                      <AlertDescription>
                        Commit writes one opening-balance journal dated the day before books start,
                        open AR/AP lines on that journal, and opening stock layers through stock
                        posting. Books start date and hard lock are set. This cannot be undone
                        except by Reset while nothing else has posted.
                      </AlertDescription>
                    </Alert>
                    {(state?.posted_journal_count ?? 0) > 0 ? (
                      <label className="flex items-start gap-2 text-sm">
                        <Checkbox
                          checked={acknowledgeActivity}
                          onCheckedChange={(checked) => setAcknowledgeActivity(checked === true)}
                        />
                        <span>
                          I acknowledge existing posted journals and still want to commit. This
                          requires period override.
                        </span>
                      </label>
                    ) : null}
                  </>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
          <div className="flex justify-between">
            <Button type="button" variant="outline" disabled={stepIndex === 0} onClick={back}>
              Back
            </Button>
            {step === "commit" ? (
              <Button
                type="button"
                disabled={
                  !preview ||
                  commitMutation.isPending ||
                  ((state?.posted_journal_count ?? 0) > 0 && !acknowledgeActivity)
                }
                onClick={() => setConfirmCommit(true)}
              >
                {commitMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Commit opening balances
              </Button>
            ) : (
              <Button type="button" disabled={previewMutation.isPending} onClick={next}>
                {previewMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                {step === "stock" ? "Preview" : "Next"}
              </Button>
            )}
          </div>
        </form>
      </Form>
      <ConfirmActionDialog
        open={confirmCommit}
        title="Commit opening balances"
        description="One opening journal, AR/AP open items, and opening stock layers will be written. Books start and hard lock dates will be set."
        confirmLabel="Commit"
        pending={commitMutation.isPending}
        onOpenChange={setConfirmCommit}
        onConfirm={() => void onCommit()}
      />
    </div>
  );
}
