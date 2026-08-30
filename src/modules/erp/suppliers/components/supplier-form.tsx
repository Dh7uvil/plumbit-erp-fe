"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { useCreateSupplier, useUpdateSupplier } from "@/modules/erp/suppliers/mutations";
import {
  SUPPLIER_COMPANY_TYPE_LABELS,
  SUPPLIER_COMPANY_TYPES,
  SupplierFormSchema,
  TAX_TREATMENT_LABELS,
  TAX_TREATMENTS,
  type Supplier,
  type SupplierCompanyType,
  type SupplierFormValues,
} from "@/modules/erp/suppliers/schemas";
import { useAllPaymentTerms } from "@/modules/erp/accounting/payment-terms/queries";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { useAllPriceLists } from "@/modules/inventory-management/price-lists/queries";
import {
  addressToFormValues,
  EMPTY_ADDRESS_FORM,
} from "@/modules/users-management/tenants/schemas";
import { userPermissions } from "@/modules/users-management/users/permissions";
import { useAllUsers } from "@/modules/users-management/users/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { AddressFields } from "@/shared/components/form/address-fields";
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
import { useCan } from "@/shared/providers/session-provider";

function toSupplierCompanyType(type: Supplier["company_type"] | undefined): SupplierCompanyType {
  return type === "BOTH" ? "BOTH" : "SUPPLIER";
}

function toFormValues(supplier: Supplier | null, defaultCurrencyId: string): SupplierFormValues {
  return {
    name: supplier?.name ?? "",
    code: supplier?.code ?? "",
    company_type: toSupplierCompanyType(supplier?.company_type),
    trn: supplier?.trn ?? "",
    tax_treatment: supplier?.tax_treatment ?? "UNREGISTERED",
    currency_id: supplier?.currency_id ?? defaultCurrencyId,
    default_price_list_id: supplier?.default_price_list_id ?? OPTIONAL_SELECT_NONE,
    payment_terms_id: supplier?.payment_terms_id ?? OPTIONAL_SELECT_NONE,
    credit_limit: supplier?.credit_limit ?? "",
    salesperson_id: supplier?.salesperson_id ?? OPTIONAL_SELECT_NONE,
    billing_address: supplier ? addressToFormValues(supplier.billing_address) : EMPTY_ADDRESS_FORM,
    shipping_address: supplier
      ? addressToFormValues(supplier.shipping_address)
      : EMPTY_ADDRESS_FORM,
    notes: supplier?.notes ?? "",
    is_active: supplier?.is_active ?? true,
  };
}

export function SupplierForm({
  supplier,
  disabled = false,
  onSuccess,
  showCancel = false,
  onCancel,
}: {
  supplier: Supplier | null;
  disabled?: boolean;
  onSuccess?: () => void;
  showCancel?: boolean;
  onCancel?: () => void;
}) {
  const can = useCan();
  const canReadUsers = can(userPermissions.read);
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const currenciesQuery = useAllCurrencies();
  const priceListsQuery = useAllPriceLists();
  const paymentTermsQuery = useAllPaymentTerms();
  const usersQuery = useAllUsers(canReadUsers);
  const [formError, setFormError] = useState<string | null>(null);
  const isEdit = Boolean(supplier);

  const currencies = currenciesQuery.data ?? [];
  const priceLists = priceListsQuery.data ?? [];
  const paymentTerms = paymentTermsQuery.data ?? [];
  const users = usersQuery.data ?? [];
  const defaultCurrencyId =
    currencies.find((currency) => currency.is_base)?.id ??
    currencies[0]?.id ??
    OPTIONAL_SELECT_NONE;

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(SupplierFormSchema),
    values: toFormValues(supplier, defaultCurrencyId),
  });

  async function onSubmit(values: SupplierFormValues) {
    setFormError(null);
    try {
      if (supplier) {
        await updateSupplier.mutateAsync({ id: supplier.id, values });
        toast.success("Supplier updated");
      } else {
        await createSupplier.mutateAsync(values);
        toast.success("Supplier created");
      }
      onSuccess?.();
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createSupplier.isPending || updateSupplier.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
        {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code</FormLabel>
                <FormControl>
                  <Input
                    placeholder="SUP-001"
                    maxLength={50}
                    disabled={isEdit || disabled}
                    {...field}
                  />
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
                  <Input
                    placeholder="Supplier name"
                    maxLength={200}
                    disabled={disabled}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="company_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SUPPLIER_COMPANY_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {SUPPLIER_COMPANY_TYPE_LABELS[type]}
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
            name="tax_treatment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tax treatment</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TAX_TREATMENTS.map((treatment) => (
                      <SelectItem key={treatment} value={treatment}>
                        {TAX_TREATMENT_LABELS[treatment]}
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
            name="trn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>TRN</FormLabel>
                <FormControl>
                  <Input maxLength={50} disabled={disabled} {...field} />
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
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled || currenciesQuery.isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={OPTIONAL_SELECT_NONE}>None</SelectItem>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.id} value={currency.id}>
                        {currency.code} — {currency.name}
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
            name="default_price_list_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price list</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled || priceListsQuery.isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={OPTIONAL_SELECT_NONE}>None</SelectItem>
                    {priceLists.map((priceList) => (
                      <SelectItem key={priceList.id} value={priceList.id}>
                        {priceList.name}
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
            name="payment_terms_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment terms</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled || paymentTermsQuery.isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={OPTIONAL_SELECT_NONE}>None</SelectItem>
                    {paymentTerms.map((term) => (
                      <SelectItem key={term.id} value={term.id}>
                        {term.name}
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
            name="credit_limit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Credit limit</FormLabel>
                <FormControl>
                  <Input inputMode="decimal" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {canReadUsers ? (
            <FormField
              control={form.control}
              name="salesperson_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Salesperson</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={disabled || usersQuery.isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={OPTIONAL_SELECT_NONE}>None</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
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
            name="notes"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <p className="text-sm font-medium sm:col-span-2">Billing address</p>
          <AddressFields control={form.control} name="billing_address" disabled={disabled} />
          <p className="text-sm font-medium sm:col-span-2">Shipping address</p>
          <AddressFields control={form.control} name="shipping_address" disabled={disabled} />
          {isEdit ? (
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0 sm:col-span-2">
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
        {!disabled ? (
          <div className="flex justify-end gap-2">
            {showCancel ? (
              <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
                Cancel
              </Button>
            ) : null}
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {isEdit ? "Save Changes" : "Create Supplier"}
            </Button>
          </div>
        ) : null}
      </form>
    </Form>
  );
}
