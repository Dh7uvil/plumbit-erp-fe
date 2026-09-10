"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { PaymentTermFormDialog } from "@/modules/erp/accounting/payment-terms/components/payment-term-form-dialog";
import { paymentTermPermissions } from "@/modules/erp/accounting/payment-terms/permissions";
import { useAllPaymentTerms } from "@/modules/erp/accounting/payment-terms/queries";
import { CurrencyFormDialog } from "@/modules/erp/currencies/components/currency-form-dialog";
import { currencyPermissions } from "@/modules/erp/currencies/permissions";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import {
  useCreatePurchaseInvoice,
  useUpdatePurchaseInvoice,
} from "@/modules/erp/purchase-invoices/mutations";
import {
  BILL_TYPE_LABELS,
  BILL_TYPES,
  DISCOUNT_TYPE_LABELS,
  DISCOUNT_TYPES,
  EXPENSE_CATEGORIES,
  PLACE_OF_SUPPLY_LABELS,
  PLACES_OF_SUPPLY,
  PurchaseInvoiceFormSchema,
  isBlankPurchaseInvoiceLine,
  lineHasPurchasePriceVariance,
  type BillType,
  type DiscountType,
  type ExpenseCategory,
  type PlaceOfSupply,
  type PurchaseInvoice,
  type PurchaseInvoiceCreateRequest,
  type PurchaseInvoiceFormValues,
  type PurchaseInvoiceLineFormValues,
  type PurchaseInvoiceLineInput,
  type PurchaseInvoiceUpdateRequest,
} from "@/modules/erp/purchase-invoices/schemas";
import { SupplierFormDialog } from "@/modules/erp/suppliers/components/supplier-form-dialog";
import { supplierPermissions } from "@/modules/erp/suppliers/permissions";
import { useAllSuppliers, useSupplier } from "@/modules/erp/suppliers/queries";
import { emptyToNull } from "@/modules/users-management/tenants/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { DocumentLinesEditor } from "@/shared/components/document/document-lines-editor";
import { DocumentTotalsPanel } from "@/shared/components/document/document-totals-panel";
import {
  emptyDocumentLine,
  emptyExpenseDocumentLine,
} from "@/shared/components/document/schemas";
import { MasterSelect } from "@/shared/components/form/master-select";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
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

function todayIsoDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function optionalUuid(value: string): string | null {
  return !value || value === OPTIONAL_SELECT_NONE ? null : value;
}

function optionalDiscountType(value: string): DiscountType | null {
  return DISCOUNT_TYPES.includes(value as DiscountType) ? (value as DiscountType) : null;
}

function optionalPlaceOfSupply(value: string): PlaceOfSupply | null {
  return PLACES_OF_SUPPLY.includes(value as PlaceOfSupply) ? (value as PlaceOfSupply) : null;
}

function optionalExpenseCategory(value: string): ExpenseCategory | null {
  return EXPENSE_CATEGORIES.includes(value as ExpenseCategory) ? (value as ExpenseCategory) : null;
}

function emptyProductLine(): PurchaseInvoiceLineFormValues {
  return {
    ...emptyDocumentLine(),
    line_type: "PRODUCT",
    goods_receipt_id: "",
    goods_receipt_line_id: "",
    expense_account_id: OPTIONAL_SELECT_NONE,
    expense_category: OPTIONAL_SELECT_NONE,
    grn_unit_cost: "",
  };
}

function emptyExpenseLine(): PurchaseInvoiceLineFormValues {
  return {
    ...emptyExpenseDocumentLine(),
    goods_receipt_id: "",
    goods_receipt_line_id: "",
    grn_unit_cost: "",
  };
}

function toLineInput(line: PurchaseInvoiceLineFormValues): PurchaseInvoiceLineInput {
  const isExpense = (line.line_type ?? "PRODUCT") === "EXPENSE";
  return {
    line_type: isExpense ? "EXPENSE" : "PRODUCT",
    product_id: isExpense ? null : optionalUuid(line.product_id),
    description: emptyToNull(line.description),
    quantity: isExpense ? "1" : line.quantity.trim(),
    unit_id: isExpense ? null : optionalUuid(line.unit_id),
    rate: emptyToNull(line.rate),
    purchase_order_line_id: optionalUuid(line.purchase_order_line_id ?? ""),
    goods_receipt_id: optionalUuid(line.goods_receipt_id ?? ""),
    goods_receipt_line_id: optionalUuid(line.goods_receipt_line_id ?? ""),
    supplier_product_id: isExpense ? null : optionalUuid(line.supplier_product_id ?? ""),
    supplier_sku: isExpense ? null : emptyToNull(line.supplier_sku ?? ""),
    expense_account_id: isExpense ? optionalUuid(line.expense_account_id ?? "") : null,
    expense_category: isExpense ? optionalExpenseCategory(line.expense_category ?? "") : null,
    discount_type: optionalDiscountType(line.discount_type),
    discount_value: emptyToNull(line.discount_value),
    tax_id: optionalUuid(line.tax_id),
  };
}

function toFormLines(invoice: PurchaseInvoice | null, billType: BillType): PurchaseInvoiceLineFormValues[] {
  const lines = invoice?.lines ?? [];
  if (lines.length === 0) {
    return [billType === "EXPENSE" ? emptyExpenseLine() : emptyProductLine()];
  }
  return lines.map((line) => ({
    line_type: line.line_type,
    product_id: line.product_id ?? OPTIONAL_SELECT_NONE,
    supplier_product_id: line.supplier_product_id ?? OPTIONAL_SELECT_NONE,
    supplier_sku: line.supplier_sku ?? "",
    description: line.description ?? "",
    quantity: line.quantity,
    unit_id: line.unit_id ?? OPTIONAL_SELECT_NONE,
    rate: line.rate ?? "",
    discount_type: line.discount_type ?? OPTIONAL_SELECT_NONE,
    discount_value: line.discount_value ?? "",
    tax_id: line.tax_id ?? OPTIONAL_SELECT_NONE,
    purchase_order_line_id: line.purchase_order_line_id ?? "",
    goods_receipt_id: line.goods_receipt_id ?? "",
    goods_receipt_line_id: line.goods_receipt_line_id ?? "",
    expense_account_id: line.expense_account_id ?? OPTIONAL_SELECT_NONE,
    expense_category: line.expense_category ?? OPTIONAL_SELECT_NONE,
    grn_unit_cost: line.grn_unit_cost ?? "",
  }));
}

function toFormValues(invoice: PurchaseInvoice | null): PurchaseInvoiceFormValues {
  const billType = invoice?.bill_type ?? "GOODS";
  return {
    supplier_id: invoice?.supplier_id ?? OPTIONAL_SELECT_NONE,
    bill_type: billType,
    contact_id: invoice?.contact_id ?? OPTIONAL_SELECT_NONE,
    branch_id: invoice?.branch_id ?? OPTIONAL_SELECT_NONE,
    invoice_date: invoice?.invoice_date ?? todayIsoDate(),
    purchase_order_id: invoice?.purchase_order_id ?? "",
    goods_receipt_id: invoice?.goods_receipt_id ?? "",
    supplier_invoice_number: invoice?.supplier_invoice_number ?? "",
    supplier_invoice_date: invoice?.supplier_invoice_date ?? "",
    payment_terms_id: invoice?.payment_terms_id ?? OPTIONAL_SELECT_NONE,
    currency_id: invoice?.currency_id ?? OPTIONAL_SELECT_NONE,
    notes: invoice?.notes ?? "",
    discount_type: invoice?.discount_type ?? OPTIONAL_SELECT_NONE,
    discount_value: invoice?.discount_value ?? "",
    shipping_amount: invoice?.shipping_amount ?? "0",
    adjustment_amount: invoice?.adjustment_amount ?? "0",
    round_off_amount: invoice?.round_off_amount ?? "0",
    place_of_supply: invoice?.place_of_supply ?? OPTIONAL_SELECT_NONE,
    is_reverse_charge: invoice?.is_reverse_charge ?? false,
    supplier_trn: invoice?.supplier_trn ?? "",
    tax_treatment: invoice?.tax_treatment ?? "",
    lines: toFormLines(invoice, billType),
  };
}

function toCreateRequest(values: PurchaseInvoiceFormValues): PurchaseInvoiceCreateRequest {
  return {
    supplier_id: values.supplier_id,
    bill_type: values.bill_type,
    contact_id: optionalUuid(values.contact_id),
    branch_id: optionalUuid(values.branch_id),
    invoice_date: emptyToNull(values.invoice_date),
    purchase_order_id: optionalUuid(values.purchase_order_id),
    goods_receipt_id: optionalUuid(values.goods_receipt_id),
    supplier_invoice_number: emptyToNull(values.supplier_invoice_number),
    supplier_invoice_date: emptyToNull(values.supplier_invoice_date),
    payment_terms_id: optionalUuid(values.payment_terms_id),
    currency_id: optionalUuid(values.currency_id),
    notes: emptyToNull(values.notes),
    discount_type: optionalDiscountType(values.discount_type),
    discount_value: emptyToNull(values.discount_value),
    shipping_amount: values.shipping_amount.trim() || "0",
    adjustment_amount: values.adjustment_amount.trim() || "0",
    round_off_amount: values.round_off_amount.trim() || "0",
    place_of_supply: optionalPlaceOfSupply(values.place_of_supply),
    is_reverse_charge: values.is_reverse_charge,
    lines: values.lines.filter((line) => !isBlankPurchaseInvoiceLine(line)).map(toLineInput),
  };
}

function toUpdateRequest(values: PurchaseInvoiceFormValues): PurchaseInvoiceUpdateRequest {
  const created = toCreateRequest(values);
  return {
    bill_type: created.bill_type,
    contact_id: created.contact_id,
    branch_id: created.branch_id,
    invoice_date: created.invoice_date,
    purchase_order_id: created.purchase_order_id,
    goods_receipt_id: created.goods_receipt_id,
    supplier_invoice_number: created.supplier_invoice_number,
    supplier_invoice_date: created.supplier_invoice_date,
    payment_terms_id: created.payment_terms_id,
    currency_id: created.currency_id,
    notes: created.notes,
    discount_type: created.discount_type,
    discount_value: created.discount_value,
    shipping_amount: created.shipping_amount,
    adjustment_amount: created.adjustment_amount,
    round_off_amount: created.round_off_amount,
    place_of_supply: created.place_of_supply,
    is_reverse_charge: created.is_reverse_charge,
    lines: created.lines,
  };
}

export function PurchaseInvoiceForm({
  invoice,
  disabled = false,
  onSuccess,
}: {
  invoice: PurchaseInvoice | null;
  disabled?: boolean;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const can = useCan();
  const createInvoice = useCreatePurchaseInvoice();
  const updateInvoice = useUpdatePurchaseInvoice();
  const suppliersQuery = useAllSuppliers();
  const currenciesQuery = useAllCurrencies();
  const paymentTermsQuery = useAllPaymentTerms();
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState<"supplier" | "currency" | "paymentTerms" | null>(null);
  const dirtyCompose = useRef(new Set<"currency_id" | "payment_terms_id">());
  const isEdit = Boolean(invoice);
  const sourced = Boolean(
    invoice?.lines.some((line) => line.goods_receipt_line_id || line.purchase_order_line_id),
  );

  const form = useForm<PurchaseInvoiceFormValues>({
    resolver: zodResolver(PurchaseInvoiceFormSchema),
    defaultValues: toFormValues(invoice),
    values: invoice ? toFormValues(invoice) : undefined,
  });
  useDirtyFormGuard(form.formState.isDirty && !disabled);

  const supplierId = useWatch({ control: form.control, name: "supplier_id" });
  const billType = useWatch({ control: form.control, name: "bill_type" });
  const selectedSupplierId = optionalUuid(supplierId);
  const supplierQuery = useSupplier(isEdit ? null : selectedSupplierId);
  const suppliers = suppliersQuery.data ?? [];
  const currencies = currenciesQuery.data ?? [];
  const paymentTerms = paymentTermsQuery.data ?? [];
  const isExpenseBill = billType === "EXPENSE";
  const varianceLines = (invoice?.lines ?? []).filter(lineHasPurchasePriceVariance);

  useEffect(() => {
    const supplier = supplierQuery.data;
    if (!supplier || isEdit) {
      return;
    }
    const dirty = dirtyCompose.current;
    if (!dirty.has("currency_id")) {
      form.setValue("currency_id", supplier.currency_id);
    }
    if (!dirty.has("payment_terms_id")) {
      form.setValue("payment_terms_id", supplier.payment_terms_id ?? OPTIONAL_SELECT_NONE);
    }
    form.setValue("supplier_trn", supplier.trn ?? "");
    form.setValue("tax_treatment", supplier.tax_treatment);
  }, [form, isEdit, supplierQuery.data]);

  async function onSubmit(values: PurchaseInvoiceFormValues) {
    setFormError(null);
    try {
      if (invoice) {
        await updateInvoice.mutateAsync({
          id: invoice.id,
          values: toUpdateRequest(values),
          version: invoice.version,
        });
        toast.success("Purchase invoice saved");
        onSuccess?.();
      } else {
        const created = await createInvoice.mutateAsync(toCreateRequest(values));
        toast.success("Purchase invoice created");
        router.push(`/purchase-invoices/${created.id}`);
      }
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createInvoice.isPending || updateInvoice.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
        {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
        {varianceLines.length > 0 ? (
          <Alert>
            <AlertDescription>
              {varianceLines.length} line{varianceLines.length === 1 ? "" : "s"} differ from the
              goods-receipt unit cost. Posting books purchase-price variance instead of silently
              restating stock cost.
            </AlertDescription>
          </Alert>
        ) : null}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <FormField
            control={form.control}
            name="supplier_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled || Boolean(invoice) || suppliersQuery.isLoading}
                  placeholder="Select a supplier"
                  searchPlaceholder="Search supplier…"
                  createLabel="Create supplier"
                  onCreate={
                    can(supplierPermissions.create) ? () => setCreating("supplier") : undefined
                  }
                  options={[
                    { value: OPTIONAL_SELECT_NONE, label: "Select a supplier" },
                    ...suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name })),
                  ]}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bill_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bill type</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    const next = value as BillType;
                    field.onChange(next);
                    if (!invoice) {
                      form.setValue("lines", [
                        next === "EXPENSE" ? emptyExpenseLine() : emptyProductLine(),
                      ]);
                    }
                  }}
                  disabled={disabled || sourced}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {BILL_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {BILL_TYPE_LABELS[type]}
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
            name="invoice_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Invoice date</FormLabel>
                <FormControl>
                  <Input type="date" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="supplier_invoice_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier invoice number</FormLabel>
                <FormControl>
                  <Input disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="supplier_invoice_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier invoice date</FormLabel>
                <FormControl>
                  <Input type="date" disabled={disabled} {...field} />
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
                  onValueChange={(value) => {
                    dirtyCompose.current.add("currency_id");
                    field.onChange(value);
                  }}
                  disabled={disabled || currenciesQuery.isLoading}
                  placeholder="Select currency"
                  searchPlaceholder="Search currency…"
                  createLabel="Create currency"
                  onCreate={
                    can(currencyPermissions.create) ? () => setCreating("currency") : undefined
                  }
                  options={currencies.map((currency) => ({
                    value: currency.id,
                    label: `${currency.code} — ${currency.name}`,
                  }))}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="payment_terms_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment terms</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={(value) => {
                    dirtyCompose.current.add("payment_terms_id");
                    field.onChange(value);
                  }}
                  disabled={disabled || paymentTermsQuery.isLoading}
                  placeholder="None"
                  searchPlaceholder="Search terms…"
                  createLabel="Create payment terms"
                  onCreate={
                    can(paymentTermPermissions.create)
                      ? () => setCreating("paymentTerms")
                      : undefined
                  }
                  options={[
                    { value: OPTIONAL_SELECT_NONE, label: "None" },
                    ...paymentTerms.map((term) => ({ value: term.id, label: term.name })),
                  ]}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="place_of_supply"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Place of supply</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={OPTIONAL_SELECT_NONE}>None</SelectItem>
                    {PLACES_OF_SUPPLY.map((place) => (
                      <SelectItem key={place} value={place}>
                        {PLACE_OF_SUPPLY_LABELS[place]}
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
            name="discount_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Header discount type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={OPTIONAL_SELECT_NONE}>None</SelectItem>
                    {DISCOUNT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {DISCOUNT_TYPE_LABELS[type]}
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
            name="discount_value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Header discount value</FormLabel>
                <FormControl>
                  <Input inputMode="decimal" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="is_reverse_charge"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    disabled={disabled}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                </FormControl>
                <FormLabel>Reverse charge (import VAT)</FormLabel>
              </FormItem>
            )}
          />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Lines</p>
          <DocumentLinesEditor
            form={form}
            disabled={disabled || sourced}
            productSide="purchase"
            lineMode={isExpenseBill ? "expense" : "standard"}
            supplierCatalog={
              isExpenseBill || !selectedSupplierId
                ? undefined
                : { supplierId: selectedSupplierId }
            }
          />
        </div>
        {invoice ? <DocumentTotalsPanel totals={invoice} currencies={currencies} /> : null}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea disabled={disabled} className="min-h-24" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {!disabled ? (
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {invoice ? "Save Changes" : "Create purchase invoice"}
            </Button>
          </div>
        ) : null}
      </form>
      <SupplierFormDialog
        open={creating === "supplier"}
        supplier={null}
        nested
        onCreated={(entity) => form.setValue("supplier_id", entity.id)}
        onOpenChange={(open) => setCreating(open ? "supplier" : null)}
      />
      <CurrencyFormDialog
        open={creating === "currency"}
        nested
        onCreated={(entity) => form.setValue("currency_id", entity.id)}
        onOpenChange={(open) => setCreating(open ? "currency" : null)}
      />
      <PaymentTermFormDialog
        open={creating === "paymentTerms"}
        nested
        onCreated={(entity) => form.setValue("payment_terms_id", entity.id)}
        onOpenChange={(open) => setCreating(open ? "paymentTerms" : null)}
      />
    </Form>
  );
}
