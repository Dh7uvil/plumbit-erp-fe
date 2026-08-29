"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { useCreateCustomer, useUpdateCustomer } from "@/modules/crm/customers/mutations";
import {
  COMPANY_TYPE_LABELS,
  COMPANY_TYPES,
  CustomerFormSchema,
  TAX_TREATMENT_LABELS,
  TAX_TREATMENTS,
  type Customer,
  type CustomerFormValues,
} from "@/modules/crm/customers/schemas";
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

function toFormValues(customer: Customer | null, defaultCurrencyId: string): CustomerFormValues {
  return {
    name: customer?.name ?? "",
    code: customer?.code ?? "",
    company_type: customer?.company_type ?? "CUSTOMER",
    trn: customer?.trn ?? "",
    tax_treatment: customer?.tax_treatment ?? "UNREGISTERED",
    currency_id: customer?.currency_id ?? defaultCurrencyId,
    default_price_list_id: customer?.default_price_list_id ?? OPTIONAL_SELECT_NONE,
    payment_terms_id: customer?.payment_terms_id ?? OPTIONAL_SELECT_NONE,
    credit_limit: customer?.credit_limit ?? "",
    salesperson_id: customer?.salesperson_id ?? OPTIONAL_SELECT_NONE,
    billing_address: customer ? addressToFormValues(customer.billing_address) : EMPTY_ADDRESS_FORM,
    shipping_address: customer
      ? addressToFormValues(customer.shipping_address)
      : EMPTY_ADDRESS_FORM,
    notes: customer?.notes ?? "",
    is_active: customer?.is_active ?? true,
  };
}

export function CustomerForm({
  customer,
  disabled = false,
  onSuccess,
  showCancel = false,
  onCancel,
}: {
  customer: Customer | null;
  disabled?: boolean;
  onSuccess?: () => void;
  showCancel?: boolean;
  onCancel?: () => void;
}) {
  const can = useCan();
  const canReadUsers = can(userPermissions.read);
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const currenciesQuery = useAllCurrencies();
  const priceListsQuery = useAllPriceLists();
  const paymentTermsQuery = useAllPaymentTerms();
  const usersQuery = useAllUsers(canReadUsers);
  const [formError, setFormError] = useState<string | null>(null);
  const isEdit = Boolean(customer);

  const currencies = currenciesQuery.data ?? [];
  const priceLists = priceListsQuery.data ?? [];
  const paymentTerms = paymentTermsQuery.data ?? [];
  const users = usersQuery.data ?? [];
  const defaultCurrencyId =
    currencies.find((currency) => currency.is_base)?.id ??
    currencies[0]?.id ??
    OPTIONAL_SELECT_NONE;

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(CustomerFormSchema),
    values: toFormValues(customer, defaultCurrencyId),
  });

  async function onSubmit(values: CustomerFormValues) {
    setFormError(null);
    try {
      if (customer) {
        await updateCustomer.mutateAsync({ id: customer.id, values });
        toast.success("Customer updated");
      } else {
        await createCustomer.mutateAsync(values);
        toast.success("Customer created");
      }
      onSuccess?.();
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createCustomer.isPending || updateCustomer.isPending;

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
                    placeholder="CUST-001"
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
                    placeholder="Customer name"
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
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isEdit || disabled}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {COMPANY_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {COMPANY_TYPE_LABELS[type]}
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
              {isEdit ? "Save Changes" : "Create Customer"}
            </Button>
          </div>
        ) : null}
      </form>
    </Form>
  );
}
