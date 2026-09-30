"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useForm, useWatch } from "react-hook-form";

import { useAllCustomers } from "@/modules/crm/customers/queries";
import { customerPermissions } from "@/modules/crm/customers/permissions";
import { useAllProducts } from "@/modules/inventory-management/products/queries";
import { productPermissions } from "@/modules/inventory-management/products/permissions";
import { useCreateRecurringTemplate } from "@/modules/erp/accounting/recurring/mutations";
import {
  RecurringFormSchema,
  type RecurringFormValues,
} from "@/modules/erp/accounting/recurring/schemas";
import { useAllSuppliers } from "@/modules/erp/suppliers/queries";
import { supplierPermissions } from "@/modules/erp/suppliers/permissions";
import { todayIsoDate } from "@/modules/erp/accounting/reports/components/inventory-report-filters";
import { EntryBookLinesEditor } from "@/modules/erp/accounting/vouchers/components/entry-book-lines-editor";
import {
  emptyVoucherEntryLine,
  isBlankVoucherEntryLine,
  type VoucherEntryFormLine,
  type VoucherEntryFormValues,
} from "@/modules/erp/accounting/vouchers/schemas";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { currencyPermissions } from "@/modules/erp/currencies/permissions";
import { useAllCostCenters } from "@/modules/erp/accounting/cost-centers/queries";
import { costCenterPermissions } from "@/modules/erp/accounting/cost-centers/permissions";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";
import { useCan } from "@/shared/providers/session-provider";
import { emptyToNull } from "@/modules/users-management/tenants/schemas";

function optionalUuid(value: string): string | undefined {
  return !value || value === OPTIONAL_SELECT_NONE ? undefined : value;
}

function journalLinePayload(lines: VoucherEntryFormLine[]) {
  return lines
    .filter((line) => !isBlankVoucherEntryLine(line))
    .map((line) => ({
      account_id: line.account_id,
      debit: line.debit.trim() || undefined,
      credit: line.credit.trim() || undefined,
      party_type: optionalUuid(line.party_type),
      party_id: optionalUuid(line.party_id),
      tax_id: optionalUuid(line.tax_id ?? ""),
      branch_id: optionalUuid(line.branch_id ?? ""),
      cost_center_id: optionalUuid(line.cost_center_id ?? ""),
      description: emptyToNull(line.description),
    }));
}

export function RecurringFormScreen() {
  const router = useRouter();
  const can = useCan();
  const createTemplate = useCreateRecurringTemplate();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<RecurringFormValues>({
    resolver: zodResolver(RecurringFormSchema),
    defaultValues: {
      name: "",
      document_kind: "SALES_INVOICE",
      frequency: "MONTHLY",
      interval: "1",
      next_run_date: todayIsoDate(),
      end_date: "",
      max_runs: "",
      party_id: "",
      product_id: "",
      quantity: "1",
      narration: "",
      currency_id: OPTIONAL_SELECT_NONE,
      branch_id: OPTIONAL_SELECT_NONE,
      cost_center_id: OPTIONAL_SELECT_NONE,
      reference: "",
      lines: [emptyVoucherEntryLine(), emptyVoucherEntryLine()],
    },
  });
  useDirtyFormGuard(form.formState.isDirty);
  const kind = useWatch({ control: form.control, name: "document_kind" });
  const currencyId = useWatch({ control: form.control, name: "currency_id" });
  const customersQuery = useAllCustomers(can(customerPermissions.read) && kind === "SALES_INVOICE");
  const suppliersQuery = useAllSuppliers(
    can(supplierPermissions.read) && kind === "PURCHASE_INVOICE",
  );
  const productsQuery = useAllProducts(can(productPermissions.read) && kind !== "STANDING_JOURNAL");
  const currenciesQuery = useAllCurrencies(
    can(currencyPermissions.read) && kind === "STANDING_JOURNAL",
  );
  const branchesQuery = useAllBranches(
    can(branchPermissions.read) && kind === "STANDING_JOURNAL",
  );
  const costCentersQuery = useAllCostCenters(
    can(costCenterPermissions.read) && kind === "STANDING_JOURNAL",
  );
  const parties =
    kind === "SALES_INVOICE" ? (customersQuery.data ?? []) : (suppliersQuery.data ?? []);
  const currencyCode =
    (currenciesQuery.data ?? []).find((currency) => currency.id === currencyId)?.code ?? null;

  async function onSubmit(values: RecurringFormValues) {
    setFormError(null);
    const maxRuns = values.max_runs?.trim();
    try {
      const templatePayload =
        values.document_kind === "STANDING_JOURNAL"
          ? {
              narration: emptyToNull(values.narration),
              currency_id: optionalUuid(values.currency_id),
              branch_id: optionalUuid(values.branch_id),
              cost_center_id: optionalUuid(values.cost_center_id),
              reference: emptyToNull(values.reference),
              lines: journalLinePayload(values.lines),
            }
          : {
              [values.document_kind === "SALES_INVOICE" ? "customer_id" : "supplier_id"]:
                values.party_id,
              lines: [{ product_id: values.product_id, quantity: values.quantity }],
            };
      const created = await createTemplate.mutateAsync({
        name: values.name,
        document_kind: values.document_kind,
        frequency: values.frequency,
        interval: Number(values.interval),
        next_run_date: values.next_run_date,
        end_date: values.end_date?.trim() || null,
        max_occurrences: maxRuns ? Number(maxRuns) : null,
        template_payload: templatePayload,
      });
      form.reset(values);
      router.push(`/recurring/${created.id}`);
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="New recurring template"
        subtitle="Each run creates a draft. Posting stays a separate action."
      />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex max-w-3xl flex-col gap-3"
        >
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
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="document_kind"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue("party_id", "");
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="SALES_INVOICE">Sales invoice</SelectItem>
                      <SelectItem value="PURCHASE_INVOICE">Purchase bill</SelectItem>
                      <SelectItem value="STANDING_JOURNAL">Standing journal</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency</FormLabel>
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                      <SelectItem value="YEARLY">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="interval"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interval</FormLabel>
                  <FormControl>
                    <Input inputMode="numeric" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="next_run_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Next run</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="max_runs"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max runs</FormLabel>
                <FormControl>
                  <Input inputMode="numeric" placeholder="Unlimited" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {kind === "STANDING_JOURNAL" ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="currency_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <MasterSelect
                        value={field.value || ""}
                        onValueChange={field.onChange}
                        placeholder="Choose a currency"
                        searchPlaceholder="Search currency…"
                        options={(currenciesQuery.data ?? []).map((currency) => ({
                          value: currency.id,
                          label: currency.code,
                        }))}
                      />
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
                        value={field.value || ""}
                        onValueChange={field.onChange}
                        placeholder="Optional"
                        searchPlaceholder="Search branch…"
                        options={(branchesQuery.data ?? []).map((branch) => ({
                          value: branch.id,
                          label: branch.name,
                        }))}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cost_center_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost center</FormLabel>
                      <MasterSelect
                        value={field.value || ""}
                        onValueChange={field.onChange}
                        placeholder="Optional"
                        searchPlaceholder="Search cost center…"
                        options={(costCentersQuery.data ?? []).map((center) => ({
                          value: center.id,
                          label: center.name,
                        }))}
                      />
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
                        <Input {...field} />
                      </FormControl>
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
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <EntryBookLinesEditor
                form={form as unknown as UseFormReturn<VoucherEntryFormValues>}
                disabled={createTemplate.isPending}
                currencyCode={currencyCode}
              />
            </>
          ) : (
            <>
              <FormField
                control={form.control}
                name="party_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{kind === "SALES_INVOICE" ? "Customer" : "Supplier"}</FormLabel>
                    <MasterSelect
                      value={field.value || ""}
                      onValueChange={field.onChange}
                      placeholder={`Choose a ${kind === "SALES_INVOICE" ? "customer" : "supplier"}`}
                      searchPlaceholder="Search…"
                      options={parties.map((party) => ({ value: party.id, label: party.name }))}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="product_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product</FormLabel>
                    <MasterSelect
                      value={field.value || ""}
                      onValueChange={field.onChange}
                      placeholder="Choose a product"
                      searchPlaceholder="Search product…"
                      options={(productsQuery.data ?? []).map((product) => ({
                        value: product.id,
                        label: `${product.sku} — ${product.name}`,
                      }))}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <DecimalInput kind="quantity" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
          <div className="flex justify-end">
            <Button type="submit" disabled={createTemplate.isPending}>
              {createTemplate.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Create template
            </Button>
          </div>
        </form>
      </Form>
    </ListPage>
  );
}
