"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { isCashOrBankAccount } from "@/modules/erp/accounting/accounts/schemas";
import { useAllAccounts } from "@/modules/erp/accounting/accounts/queries";
import { useAllCostCenters } from "@/modules/erp/accounting/cost-centers/queries";
import { journalBalanceTotals } from "@/modules/erp/accounting/journals/balance";
import { EntryBookLinesEditor } from "@/modules/erp/accounting/vouchers/components/entry-book-lines-editor";
import { EntryBookSelect } from "@/modules/erp/accounting/vouchers/components/entry-book-select";
import { entryBookFor } from "@/modules/erp/accounting/vouchers/entry-books";
import { useCreateVoucher, useUpdateVoucher } from "@/modules/erp/accounting/vouchers/mutations";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  VOUCHER_ENTRY_BOOK_LABELS,
  VoucherEntryFormSchema,
  emptyVoucherEntryLine,
  isBlankVoucherEntryLine,
  isJournalVoucher,
  parseVoucherEntryBook,
  vouchersListHref,
  type Voucher,
  type VoucherCreateRequest,
  type VoucherEntryFormLine,
  type VoucherEntryFormValues,
  type VoucherEntryType,
  type VoucherUpdateRequest,
} from "@/modules/erp/accounting/vouchers/schemas";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { useAllBranches } from "@/modules/users-management/branches/queries";
import { emptyToNull } from "@/modules/users-management/tenants/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { MasterSelect } from "@/shared/components/form/master-select";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
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
import { Label } from "@/shared/components/ui/label";
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

function todayIsoDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function optionalUuid(value: string | undefined): string | null {
  return !value || value === OPTIONAL_SELECT_NONE ? null : value;
}

function toFormValues(
  voucher: Voucher | null,
  entryBook: VoucherEntryType,
  defaultCurrencyId?: string,
): VoucherEntryFormValues {
  if (!voucher) {
    return {
      voucher_type: entryBook,
      voucher_date: todayIsoDate(),
      payment_account_id: OPTIONAL_SELECT_NONE,
      currency_id: defaultCurrencyId ?? OPTIONAL_SELECT_NONE,
      payment_method: entryBook.startsWith("BANK") ? "TT" : "CASH",
      cheque_number: "",
      cheque_date: "",
      external_reference: "",
      reference: "",
      branch_id: OPTIONAL_SELECT_NONE,
      cost_center_id: OPTIONAL_SELECT_NONE,
      narration: "",
      enable_vat_details: false,
      lines: [emptyVoucherEntryLine(), emptyVoucherEntryLine()],
    };
  }

  const lines: VoucherEntryFormLine[] =
    voucher.lines.length > 0
      ? voucher.lines.map((line) => ({
          account_id: line.account_id,
          debit: line.debit === "0" || line.debit === "0.0000" ? "" : line.debit,
          credit: line.credit === "0" || line.credit === "0.0000" ? "" : line.credit,
          party_type: line.party_type ?? OPTIONAL_SELECT_NONE,
          party_id: line.party_id ?? OPTIONAL_SELECT_NONE,
          tax_id: line.tax_id ?? OPTIONAL_SELECT_NONE,
          branch_id: line.branch_id ?? OPTIONAL_SELECT_NONE,
          cost_center_id: line.cost_center_id ?? OPTIONAL_SELECT_NONE,
          due_date: "",
          external_reference: "",
          description: line.description ?? "",
        }))
      : [emptyVoucherEntryLine(), emptyVoucherEntryLine()];

  return {
    voucher_type: voucher.voucher_type as VoucherEntryType,
    voucher_date: voucher.voucher_date,
    payment_account_id: voucher.payment_account_id ?? OPTIONAL_SELECT_NONE,
    currency_id: voucher.currency_id,
    payment_method: voucher.payment_method ?? (voucher.voucher_type.startsWith("BANK") ? "TT" : "CASH"),
    cheque_number: voucher.cheque_number ?? "",
    cheque_date: voucher.cheque_date ?? "",
    external_reference: voucher.external_reference ?? "",
    reference: voucher.reference ?? "",
    branch_id: voucher.branch_id ?? OPTIONAL_SELECT_NONE,
    cost_center_id: voucher.cost_center_id ?? OPTIONAL_SELECT_NONE,
    narration: voucher.narration ?? "",
    enable_vat_details: voucher.lines.some((line) => Boolean(line.tax_id)),
    lines,
  };
}

function filledLines(lines: VoucherEntryFormLine[]): VoucherEntryFormLine[] {
  return lines.filter((line) => !isBlankVoucherEntryLine(line));
}

function journalLinePayload(lines: VoucherEntryFormLine[]): VoucherCreateRequest["lines"] {
  return filledLines(lines).map((line) => ({
    account_id: line.account_id,
    debit: line.debit.trim() || undefined,
    credit: line.credit.trim() || undefined,
    party_type: optionalUuid(line.party_type),
    party_id: optionalUuid(line.party_id),
    tax_id: optionalUuid(line.tax_id),
    branch_id: optionalUuid(line.branch_id),
    cost_center_id: optionalUuid(line.cost_center_id),
    description: emptyToNull(line.description),
  }));
}

function cashBankLinePayload(
  values: VoucherEntryFormValues,
  accountsById: Map<string, { account_subtype: string }>,
  paymentSubtype: "CASH" | "BANK",
): { paymentAccountId: string; lines: VoucherCreateRequest["lines"]; totalAmount: string } {
  const lines = filledLines(values.lines);
  let paymentAccountId = values.payment_account_id;
  const counterLines: VoucherCreateRequest["lines"] = [];

  for (const line of lines) {
    const account = accountsById.get(line.account_id);
    const isPaymentAccount =
      account &&
      isCashOrBankAccount(account as Parameters<typeof isCashOrBankAccount>[0]) &&
      account.account_subtype === paymentSubtype;
    const amount = line.debit.trim() || line.credit.trim();
    if (isPaymentAccount && paymentAccountId === OPTIONAL_SELECT_NONE) {
      paymentAccountId = line.account_id;
      continue;
    }
    if (!amount) {
      continue;
    }
    counterLines.push({
      account_id: line.account_id,
      amount,
      party_type: optionalUuid(line.party_type),
      party_id: optionalUuid(line.party_id),
      tax_id: optionalUuid(line.tax_id),
      branch_id: optionalUuid(line.branch_id),
      cost_center_id: optionalUuid(line.cost_center_id),
      description: emptyToNull(line.description),
    });
  }

  const totalAmount = counterLines
    .reduce((sum, line) => sum + Number(line.amount ?? 0), 0)
    .toFixed(4);

  return { paymentAccountId, lines: counterLines, totalAmount };
}

function toCreateRequest(
  values: VoucherEntryFormValues,
  accountsById: Map<string, { account_subtype: string }>,
): VoucherCreateRequest {
  const book = entryBookFor(values.voucher_type);
  const base = {
    voucher_type: values.voucher_type,
    voucher_date: emptyToNull(values.voucher_date),
    currency_id: optionalUuid(values.currency_id),
    cheque_number: emptyToNull(values.cheque_number),
    cheque_date: emptyToNull(values.cheque_date),
    external_reference: emptyToNull(values.external_reference),
    reference: emptyToNull(values.reference),
    branch_id: optionalUuid(values.branch_id),
    cost_center_id: optionalUuid(values.cost_center_id),
    narration: emptyToNull(values.narration),
    allocations: [],
  };

  if (isJournalVoucher(values.voucher_type)) {
    return {
      ...base,
      payment_account_id: null,
      payment_method: null,
      lines: journalLinePayload(values.lines),
    };
  }

  const { paymentAccountId, lines, totalAmount } = cashBankLinePayload(
    values,
    accountsById,
    book.paymentSubtype!,
  );

  return {
    ...base,
    payment_account_id: paymentAccountId,
    payment_method: values.payment_method,
    total_amount: totalAmount,
    lines,
  };
}

function toUpdateRequest(
  values: VoucherEntryFormValues,
  accountsById: Map<string, { account_subtype: string }>,
): VoucherUpdateRequest {
  const created = toCreateRequest(values, accountsById);
  return {
    voucher_date: created.voucher_date,
    payment_account_id: created.payment_account_id,
    counter_account_id: created.counter_account_id,
    total_amount: created.total_amount,
    currency_id: created.currency_id,
    party_type: created.party_type,
    party_id: created.party_id,
    payment_method: created.payment_method,
    cheque_number: created.cheque_number,
    cheque_date: created.cheque_date,
    external_reference: created.external_reference,
    reference: created.reference,
    branch_id: created.branch_id,
    cost_center_id: created.cost_center_id,
    narration: created.narration,
    lines: created.lines,
    allocations: created.allocations ?? [],
  };
}

export function VoucherEntryScreen({ voucher }: { voucher?: Voucher | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const entryBook = parseVoucherEntryBook(
    voucher?.voucher_type ?? searchParams.get("voucher_type"),
  );
  const book = entryBookFor(entryBook);
  const createVoucher = useCreateVoucher();
  const updateVoucher = useUpdateVoucher(voucher?.id ?? "");
  const accountsQuery = useAllAccounts({ is_group: false, is_active: true });
  const currenciesQuery = useAllCurrencies();
  const branchesQuery = useAllBranches();
  const costCentersQuery = useAllCostCenters();
  const [formError, setFormError] = useState<string | null>(null);
  const isEdit = Boolean(voucher);
  const { baseCurrencyId } = useBaseCurrency();

  const form = useForm<VoucherEntryFormValues>({
    resolver: zodResolver(VoucherEntryFormSchema),
    defaultValues: toFormValues(voucher ?? null, entryBook, baseCurrencyId),
    values: voucher ? toFormValues(voucher, voucher.voucher_type as VoucherEntryType, baseCurrencyId) : undefined,
  });
  useDirtyFormGuard(form.formState.isDirty && !isEdit);

  useEffect(() => {
    if (voucher) {
      return;
    }
    form.reset(toFormValues(null, entryBook, baseCurrencyId));
  }, [baseCurrencyId, entryBook, form, voucher]);

  const selectedType = useWatch({ control: form.control, name: "voucher_type" }) ?? entryBook;
  const selectedBook = entryBookFor(selectedType);
  const enableVatDetails = useWatch({ control: form.control, name: "enable_vat_details" }) ?? false;
  const currencyId = useWatch({ control: form.control, name: "currency_id" });
  const watchedLines = useWatch({ control: form.control, name: "lines" });
  const currencies = currenciesQuery.data ?? [];
  const currencyCode = currencies.find((currency) => currency.id === currencyId)?.code ?? "";
  const accounts = accountsQuery.data ?? [];
  const accountsById = useMemo(
    () => new Map(accounts.map((account) => [account.id, account])),
    [accounts],
  );
  const totals = journalBalanceTotals(watchedLines ?? []);
  const backHref = vouchersListHref(selectedType);
  const subtitle = VOUCHER_ENTRY_BOOK_LABELS[selectedType];
  const pending = createVoucher.isPending || updateVoucher.isPending;

  async function onSubmit(values: VoucherEntryFormValues) {
    setFormError(null);
    if (!isJournalVoucher(values.voucher_type)) {
      const book = entryBookFor(values.voucher_type);
      const { paymentAccountId } = cashBankLinePayload(values, accountsById, book.paymentSubtype!);
      if (!paymentAccountId || paymentAccountId === OPTIONAL_SELECT_NONE) {
        setFormError("Add a cash or bank account line for the payment account.");
        return;
      }
    }
    try {
      if (voucher) {
        await updateVoucher.mutateAsync({
          ...toUpdateRequest(values, accountsById),
          version: voucher.version,
        });
        toast.success("Voucher saved");
        router.push(`/vouchers/${voucher.id}`);
      } else {
        const created = await createVoucher.mutateAsync(toCreateRequest(values, accountsById));
        toast.success("Voucher created");
        router.push(`/vouchers/${created.id}`);
      }
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Voucher entry"
        subtitle={subtitle}
        actions={
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href={backHref}>Back</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Voucher entry</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
              {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
              <div className="grid grid-cols-1 gap-x-3 gap-y-2 border-b pb-4 sm:grid-cols-2 lg:grid-cols-4">
                <FormField
                  control={form.control}
                  name="voucher_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entry book</FormLabel>
                      <FormControl>
                        <EntryBookSelect
                          value={field.value as VoucherEntryType}
                          onChange={(nextType) => {
                            field.onChange(nextType);
                            form.setValue("payment_account_id", OPTIONAL_SELECT_NONE);
                            form.setValue(
                              "payment_method",
                              nextType.startsWith("BANK") ? "TT" : "CASH",
                            );
                            if (!isEdit) {
                              router.replace(`/vouchers/entry?voucher_type=${nextType}`);
                            }
                          }}
                          disabled={isEdit}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem>
                  <FormLabel>Period</FormLabel>
                  <FormControl>
                    <Input
                      value={voucher?.period != null ? String(voucher.period) : "—"}
                      disabled
                      readOnly
                    />
                  </FormControl>
                </FormItem>
                <FormItem>
                  <FormLabel>Voucher no.</FormLabel>
                  <FormControl>
                    <Input
                      value={voucher?.document_number ?? "Assigned on save"}
                      disabled
                      readOnly
                    />
                  </FormControl>
                </FormItem>
                <FormField
                  control={form.control}
                  name="voucher_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cheque_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cheque no.</FormLabel>
                      <FormControl>
                        <Input disabled={!selectedBook.requiresCheque} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cheque_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cheque date</FormLabel>
                      <FormControl>
                        <Input type="date" disabled={!selectedBook.requiresCheque} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="narration"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Voucher description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="external_reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IMP/EXP ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Import / export reference" {...field} />
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
                        disabled={currenciesQuery.isLoading}
                        placeholder="Currency"
                        searchPlaceholder="Search currency…"
                        options={[
                          { value: OPTIONAL_SELECT_NONE, label: "Select currency" },
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
                {!isJournalVoucher(selectedType) ? (
                  <FormField
                    control={form.control}
                    name="payment_method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Method</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
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
                ) : null}
                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference</FormLabel>
                      <FormControl>
                        <Input placeholder="Cheque / UTR / reference" {...field} />
                      </FormControl>
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
                        value={field.value ?? OPTIONAL_SELECT_NONE}
                        onValueChange={field.onChange}
                        disabled={branchesQuery.isLoading}
                        placeholder="Optional"
                        searchPlaceholder="Search branch…"
                        options={[
                          { value: OPTIONAL_SELECT_NONE, label: "None" },
                          ...(branchesQuery.data ?? []).map((branch) => ({
                            value: branch.id,
                            label: `${branch.code} — ${branch.name}`,
                          })),
                        ]}
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
                        value={field.value ?? OPTIONAL_SELECT_NONE}
                        onValueChange={field.onChange}
                        disabled={costCentersQuery.isLoading}
                        placeholder="Optional"
                        searchPlaceholder="Search cost center…"
                        options={[
                          { value: OPTIONAL_SELECT_NONE, label: "None" },
                          ...(costCentersQuery.data ?? []).map((row) => ({
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
                  name="enable_vat_details"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex h-9 items-center gap-2 pt-6">
                        <Checkbox
                          id="enable-vat-details"
                          checked={field.value}
                          onCheckedChange={(checked) => field.onChange(checked === true)}
                        />
                        <Label htmlFor="enable-vat-details">Enable VAT details</Label>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <EntryBookLinesEditor
                form={form}
                disabled={false}
                currencyCode={currencyCode}
                showVatDetails={enableVatDetails}
              />

              <div className="text-muted-foreground flex flex-wrap gap-4 text-xs">
                <span>
                  Debit total {totals.totalDebit || "0"} · Credit total {totals.totalCredit || "0"}
                </span>
                {!totals.isBalanced && isJournalVoucher(selectedType) ? (
                  <span>Difference {totals.difference}</span>
                ) : null}
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={pending}>
                  {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                  {isEdit ? "Save voucher" : "Create voucher"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
