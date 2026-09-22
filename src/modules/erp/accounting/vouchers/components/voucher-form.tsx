"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { useCustomerOpenItems } from "@/modules/crm/customers/queries";
import { isCashOrBankAccount, isControlAccount } from "@/modules/erp/accounting/accounts/schemas";
import { useAllAccounts } from "@/modules/erp/accounting/accounts/queries";
import { useAllCostCenters } from "@/modules/erp/accounting/cost-centers/queries";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { useCreateVoucher, useUpdateVoucher } from "@/modules/erp/accounting/vouchers/mutations";
import { VoucherLinesEditor } from "@/modules/erp/accounting/vouchers/components/voucher-lines-editor";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  VOUCHER_ENTRY_BOOK_OPTIONS,
  VOUCHER_TYPES,
  VoucherFormSchema,
  emptyVoucherLine,
  isContraVoucher,
  isReceiptVoucher,
  paymentAccountSubtypeFor,
  type Voucher,
  type VoucherCreateRequest,
  type VoucherFormValues,
  type VoucherEntryType,
  type VoucherType,
  type VoucherUpdateRequest,
} from "@/modules/erp/accounting/vouchers/schemas";
import { useSupplierOpenItems } from "@/modules/erp/suppliers/queries";
import { useAllBranches } from "@/modules/users-management/branches/queries";
import { emptyToNull } from "@/modules/users-management/tenants/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import {
  CUSTOMER_PAYMENT_ALLOCATE_TYPES,
  PaymentAllocationEditor,
  SUPPLIER_PAYMENT_ALLOCATE_TYPES,
  filterOpenItemsForPaymentAllocation,
  paymentAllocationsPayload,
} from "@/shared/components/document/payment-allocation-editor";
import { MasterSelect } from "@/shared/components/form/master-select";
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
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";
import { useBaseCurrency } from "@/shared/hooks/use-base-currency";
import { useDefaultDocumentCurrency } from "@/shared/hooks/use-default-document-currency";
function todayIsoDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function optionalUuid(value: string | undefined): string | null {
  return !value || value === OPTIONAL_SELECT_NONE ? null : value;
}

function toFormValues(
  voucher: Voucher | null,
  voucherType: VoucherType,
  defaultCurrencyId?: string,
): VoucherFormValues {
  if (!voucher) {
    return {
      voucher_type: voucherType,
      voucher_date: todayIsoDate(),
      payment_account_id: OPTIONAL_SELECT_NONE,
      counter_account_id: OPTIONAL_SELECT_NONE,
      total_amount: "",
      currency_id: defaultCurrencyId ?? OPTIONAL_SELECT_NONE,
      party_type: OPTIONAL_SELECT_NONE,
      party_id: OPTIONAL_SELECT_NONE,
      payment_method: voucherType.startsWith("BANK") ? "TT" : "CASH",
      reference: "",
      branch_id: OPTIONAL_SELECT_NONE,
      cost_center_id: OPTIONAL_SELECT_NONE,
      narration: "",
      lines: [emptyVoucherLine()],
    };
  }
  return {
    voucher_type: voucher.voucher_type,
    voucher_date: voucher.voucher_date,
    payment_account_id: voucher.payment_account_id,
    counter_account_id: voucher.counter_account_id ?? OPTIONAL_SELECT_NONE,
    total_amount: voucher.total_amount,
    currency_id: voucher.currency_id,
    party_type: voucher.party_type ?? OPTIONAL_SELECT_NONE,
    party_id: voucher.party_id ?? OPTIONAL_SELECT_NONE,
    payment_method: voucher.payment_method,
    reference: voucher.reference ?? "",
    branch_id: voucher.branch_id ?? OPTIONAL_SELECT_NONE,
    cost_center_id: voucher.cost_center_id ?? OPTIONAL_SELECT_NONE,
    narration: voucher.narration ?? "",
    lines:
      voucher.lines.length > 0
        ? voucher.lines.map((line) => ({
            account_id: line.account_id,
            amount: line.amount,
            party_type: line.party_type ?? OPTIONAL_SELECT_NONE,
            party_id: line.party_id ?? OPTIONAL_SELECT_NONE,
            tax_id: line.tax_id ?? OPTIONAL_SELECT_NONE,
            branch_id: line.branch_id ?? OPTIONAL_SELECT_NONE,
            cost_center_id: line.cost_center_id ?? OPTIONAL_SELECT_NONE,
            description: line.description ?? "",
          }))
        : [emptyVoucherLine()],
  };
}

function toLinePayload(lines: VoucherFormValues["lines"]) {
  return lines
    .filter((line) => line.account_id !== OPTIONAL_SELECT_NONE && line.amount.trim())
    .map((line) => ({
      account_id: line.account_id,
      amount: line.amount.trim(),
      party_type: optionalUuid(line.party_type),
      party_id: optionalUuid(line.party_id),
      tax_id: optionalUuid(line.tax_id),
      branch_id: optionalUuid(line.branch_id),
      cost_center_id: optionalUuid(line.cost_center_id),
      description: emptyToNull(line.description),
    }));
}

function toCreateRequest(
  values: VoucherFormValues,
  allocations: VoucherCreateRequest["allocations"],
): VoucherCreateRequest {
  return {
    voucher_type: values.voucher_type,
    voucher_date: emptyToNull(values.voucher_date),
    payment_account_id: values.payment_account_id,
    counter_account_id: null,
    total_amount: values.total_amount.trim(),
    currency_id: optionalUuid(values.currency_id),
    party_type: optionalUuid(values.party_type),
    party_id: optionalUuid(values.party_id),
    payment_method: values.payment_method,
    reference: emptyToNull(values.reference),
    branch_id: optionalUuid(values.branch_id),
    cost_center_id: optionalUuid(values.cost_center_id),
    narration: emptyToNull(values.narration),
    lines: toLinePayload(values.lines),
    allocations,
  };
}

function toUpdateRequest(
  values: VoucherFormValues,
  allocations: VoucherCreateRequest["allocations"],
): VoucherUpdateRequest {
  const created = toCreateRequest(values, allocations);
  return {
    voucher_date: created.voucher_date,
    payment_account_id: created.payment_account_id,
    counter_account_id: created.counter_account_id,
    total_amount: created.total_amount,
    currency_id: created.currency_id,
    party_type: created.party_type,
    party_id: created.party_id,
    payment_method: created.payment_method,
    reference: created.reference,
    branch_id: created.branch_id,
    cost_center_id: created.cost_center_id,
    narration: created.narration,
    lines: created.lines,
    allocations: created.allocations ?? [],
  };
}

export function VoucherForm({
  voucher,
  voucherType: initialVoucherType = "CASH_RECEIPT",
  disabled = false,
  onSuccess,
}: {
  voucher: Voucher | null;
  voucherType?: VoucherEntryType;
  disabled?: boolean;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const createVoucher = useCreateVoucher();
  const updateVoucher = useUpdateVoucher(voucher?.id ?? "");
  const accountsQuery = useAllAccounts({ is_group: false, is_active: true });
  const currenciesQuery = useAllCurrencies();
  const branchesQuery = useAllBranches();
  const costCentersQuery = useAllCostCenters();
  const [formError, setFormError] = useState<string | null>(null);
  const [allocationValues, setAllocationValues] = useState<Record<string, string>>(() =>
    Object.fromEntries((voucher?.allocations ?? []).map((row) => [row.item_id, row.amount])),
  );
  const isEdit = Boolean(voucher);
  const { baseCurrencyId } = useBaseCurrency();

  const form = useForm<VoucherFormValues>({
    resolver: zodResolver(VoucherFormSchema),
    defaultValues: toFormValues(voucher, initialVoucherType, baseCurrencyId),
    values: voucher ? toFormValues(voucher, voucher.voucher_type, baseCurrencyId) : undefined,
  });
  useDirtyFormGuard(form.formState.isDirty && !disabled);
  useDefaultDocumentCurrency(form, isEdit, baseCurrencyId);

  useEffect(() => {
    if (voucher) {
      return;
    }
    form.reset(toFormValues(null, initialVoucherType, baseCurrencyId));
    setAllocationValues({});
  }, [baseCurrencyId, form, initialVoucherType, voucher]);

  const selectedType =
    useWatch({ control: form.control, name: "voucher_type" }) ?? initialVoucherType;
  const legacyContra = isContraVoucher(selectedType as VoucherType);
  const receipt = isReceiptVoucher(selectedType as VoucherType);
  const partyId = optionalUuid(useWatch({ control: form.control, name: "party_id" }));
  const currencyId = useWatch({ control: form.control, name: "currency_id" });
  const totalAmount = useWatch({ control: form.control, name: "total_amount" });
  const watchedLines = useWatch({ control: form.control, name: "lines" });
  const customerOpenItemsQuery = useCustomerOpenItems(partyId, receipt && Boolean(partyId));
  const supplierOpenItemsQuery = useSupplierOpenItems(partyId, !receipt && Boolean(partyId));

  const accounts = accountsQuery.data ?? [];
  const subtype = paymentAccountSubtypeFor(selectedType);
  const paymentAccounts = accounts.filter((account) => {
    if (!isCashOrBankAccount(account)) {
      return false;
    }
    return subtype ? account.account_subtype === subtype : true;
  });
  const currencies = currenciesQuery.data ?? [];
  const currencyCode = currencies.find((currency) => currency.id === currencyId)?.code ?? "";

  const hasArApLines = useMemo(() => {
    const byId = new Map(accounts.map((account) => [account.id, account]));
    return (watchedLines ?? []).some((line) => {
      const account = byId.get(line.account_id);
      return account ? isControlAccount(account) : false;
    });
  }, [accounts, watchedLines]);

  const openItems = filterOpenItemsForPaymentAllocation(
    receipt ? (customerOpenItemsQuery.data ?? []) : (supplierOpenItemsQuery.data ?? []),
    receipt ? CUSTOMER_PAYMENT_ALLOCATE_TYPES : SUPPLIER_PAYMENT_ALLOCATE_TYPES,
    voucher?.id,
  );

  const allocationPayload = useMemo(
    () => (hasArApLines ? paymentAllocationsPayload(openItems, allocationValues) : []),
    [allocationValues, hasArApLines, openItems],
  );

  async function onSubmit(values: VoucherFormValues) {
    setFormError(null);
    try {
      if (voucher) {
        await updateVoucher.mutateAsync({
          ...toUpdateRequest(values, allocationPayload),
          version: voucher.version,
        });
        toast.success("Voucher saved");
        onSuccess?.();
      } else {
        const created = await createVoucher.mutateAsync(toCreateRequest(values, allocationPayload));
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

  const pending = createVoucher.isPending || updateVoucher.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
        {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
        <div className="grid grid-cols-1 gap-x-3 gap-y-2 border-b pb-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="voucher_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Entry book</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    const nextType = value as VoucherEntryType;
                    field.onChange(nextType);
                    form.setValue("payment_account_id", OPTIONAL_SELECT_NONE);
                    form.setValue("counter_account_id", OPTIONAL_SELECT_NONE);
                    form.setValue("payment_method", nextType.startsWith("BANK") ? "TT" : "CASH");
                    if ((form.getValues("lines") ?? []).length === 0) {
                      form.setValue("lines", [emptyVoucherLine()]);
                    }
                  }}
                  disabled={disabled || isEdit}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select entry book" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {VOUCHER_ENTRY_BOOK_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormItem>
            <FormLabel>Voucher no.</FormLabel>
            <FormControl>
              <Input value={voucher?.document_number ?? "Assigned on save"} disabled readOnly />
            </FormControl>
          </FormItem>
          <FormField
            control={form.control}
            name="narration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input disabled={disabled} placeholder="Voucher description" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div
          data-slot="form-grid"
          className="grid grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-2 lg:grid-cols-3"
        >
          <FormField
            control={form.control}
            name="voucher_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" disabled={disabled} {...field} />
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
                  placeholder="Select account"
                  searchPlaceholder="Search account…"
                  options={[
                    { value: OPTIONAL_SELECT_NONE, label: "Select account" },
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
            name="total_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total amount</FormLabel>
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
                <MasterSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled || currenciesQuery.isLoading}
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
          <FormField
            control={form.control}
            name="payment_method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Method</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
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
                  <Input disabled={disabled} placeholder="Cheque / UTR / reference" {...field} />
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
                  disabled={disabled || branchesQuery.isLoading}
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
                  disabled={disabled || costCentersQuery.isLoading}
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
        </div>

        {!legacyContra ? (
          <VoucherLinesEditor form={form} disabled={disabled} currencyCode={currencyCode} />
        ) : null}

        {hasArApLines && partyId ? (
          <PaymentAllocationEditor
            items={openItems}
            values={allocationValues}
            onChange={(itemId, amount) =>
              setAllocationValues((current) => ({ ...current, [itemId]: amount }))
            }
            currencyCode={currencyCode}
            received={totalAmount}
            bankCharges="0"
            disabled={disabled}
          />
        ) : hasArApLines ? (
          <p className="text-muted-foreground text-sm">
            Select a party on an AR/AP line to allocate against open items.
          </p>
        ) : null}

        {!disabled ? (
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {isEdit ? "Save voucher" : "Create voucher"}
            </Button>
          </div>
        ) : null}
      </form>
    </Form>
  );
}
