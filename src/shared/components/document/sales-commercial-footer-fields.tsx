"use client";

import type { FieldPath, FieldValues, Path, UseFormReturn } from "react-hook-form";
import { useWatch } from "react-hook-form";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import {
  DISCOUNT_TYPE_LABELS,
  DISCOUNT_TYPES,
} from "@/modules/erp/sales-orders/schemas";
import { useAllTaxes } from "@/modules/erp/accounting/taxes/queries";
import type { DocumentTotals } from "@/shared/components/document/schemas";
import { DecimalInput } from "@/shared/components/form/decimal-input";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
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
import {
  useLiveDocumentTotals,
  type CommercialLineForTotals,
} from "@/shared/hooks/use-live-document-totals";
import { formatMoney } from "@/shared/lib/format";

type CommercialTotalsForm = {
  lines: unknown[];
  discount_type?: string | null;
  discount_value?: string | null;
  shipping_amount?: string | null;
  adjustment_amount?: string | null;
  prices_include_tax?: boolean;
  currency_id: string;
};

export function SalesCommercialFooterFields<T extends FieldValues & CommercialTotalsForm>({
  form,
  disabled,
  currencies,
  savedTotals,
  showInvoiced = true,
}: {
  form: UseFormReturn<T>;
  disabled?: boolean;
  currencies: readonly { id: string; code: string }[];
  savedTotals?: DocumentTotals | null;
  showInvoiced?: boolean;
}) {
  const control = form.control;
  const taxesQuery = useAllTaxes();
  const taxes = taxesQuery.data ?? [];
  const currencyId = useWatch({ control: form.control, name: "currency_id" as Path<T> }) as string;
  const lines = useWatch({ control: form.control, name: "lines" as Path<T> });
  const discountType = useWatch({ control: form.control, name: "discount_type" as Path<T> }) as
    | string
    | null
    | undefined;
  const discountValue = useWatch({ control: form.control, name: "discount_value" as Path<T> }) as
    | string
    | null
    | undefined;
  const shippingAmount = useWatch({
    control: form.control,
    name: "shipping_amount" as Path<T>,
  }) as string | null | undefined;
  const adjustmentAmount = useWatch({
    control: form.control,
    name: "adjustment_amount" as Path<T>,
  }) as string | null | undefined;
  const pricesIncludeTax = useWatch({
    control: form.control,
    name: "prices_include_tax" as Path<T>,
  }) as boolean | undefined;

  const live = useLiveDocumentTotals({
    lines: (lines ?? []) as CommercialLineForTotals[],
    taxes,
    discountType: discountType === OPTIONAL_SELECT_NONE ? null : discountType,
    discountValue,
    shippingAmount,
    adjustmentAmount,
    pricesIncludeTax,
    roundOffRule: "NONE",
  });
  const currencyCode =
    currencies.find((item) => item.id === currencyId)?.code ??
    currencies.find((item) => item.id === savedTotals?.currency_id)?.code ??
    "";

  const subtotal = live.subtotal || savedTotals?.subtotal || "0";
  const grandTotal = live.grand_total || savedTotals?.grand_total || "0";

  return (
    <div
      data-slot="form-grid"
      className="grid grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-2 lg:grid-cols-3"
    >
      <FormItem>
        <FormLabel>Sub total</FormLabel>
        <Input
          disabled
          readOnly
          className="bg-muted/40 text-right"
          value={formatMoney(subtotal, currencyCode)}
        />
      </FormItem>
      <FormItem>
        <FormLabel>Discount</FormLabel>
        <div className="flex gap-2">
          <FormField
            control={control}
            name={"discount_type" as FieldPath<T>}
            render={({ field }) => (
              <Select
                value={String(field.value ?? OPTIONAL_SELECT_NONE)}
                onValueChange={field.onChange}
                disabled={disabled}
              >
                <FormControl>
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={OPTIONAL_SELECT_NONE}>—</SelectItem>
                  {DISCOUNT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {DISCOUNT_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FormField
            control={control}
            name={"discount_value" as FieldPath<T>}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <DecimalInput kind="money" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </FormItem>
      <FormField
        control={form.control}
        name={"shipping_amount" as FieldPath<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Freight</FormLabel>
            <FormControl>
              <DecimalInput kind="money" disabled={disabled} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormItem>
        <FormLabel>Total</FormLabel>
        <Input
          disabled
          readOnly
          className="bg-muted/40 text-right"
          value={formatMoney(grandTotal, currencyCode)}
        />
      </FormItem>
      <FormField
        control={control}
        name={"marks" as FieldPath<T>}
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>Marks</FormLabel>
            <FormControl>
              <Input disabled={disabled} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="col-span-full flex flex-wrap items-center gap-x-6 gap-y-2">
        <FormField
          control={form.control}
          name={"prices_include_tax" as FieldPath<T>}
          render={({ field }) => (
            <FormItem variant="checkbox">
              <FormControl>
                <Checkbox
                  checked={Boolean(field.value)}
                  disabled={disabled}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
              </FormControl>
              <FormLabel>Prices include VAT</FormLabel>
            </FormItem>
          )}
        />
        {showInvoiced ? (
          <FormField
            control={control}
            name={"is_invoiced" as FieldPath<T>}
            render={({ field }) => (
              <FormItem variant="checkbox">
                <FormControl>
                  <Checkbox checked={Boolean(field.value)} disabled />
                </FormControl>
                <FormLabel>Invoiced</FormLabel>
              </FormItem>
            )}
          />
        ) : null}
      </div>
    </div>
  );
}
