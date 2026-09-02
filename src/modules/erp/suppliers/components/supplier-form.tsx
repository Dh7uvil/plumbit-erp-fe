"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { ContactFormDialog } from "@/modules/crm/contacts/components/contact-form-dialog";
import { useCreateContact, useUpdateContact } from "@/modules/crm/contacts/mutations";
import { contactPermissions } from "@/modules/crm/contacts/permissions";
import { usePartyContacts } from "@/modules/crm/contacts/queries";
import { toInitialContactRequest, type CreatedParty } from "@/modules/crm/contacts/schemas";
import { PaymentTermFormDialog } from "@/modules/erp/accounting/payment-terms/components/payment-term-form-dialog";
import { paymentTermPermissions } from "@/modules/erp/accounting/payment-terms/permissions";
import { useAllPaymentTerms } from "@/modules/erp/accounting/payment-terms/queries";
import { CurrencyFormDialog } from "@/modules/erp/currencies/components/currency-form-dialog";
import { currencyPermissions } from "@/modules/erp/currencies/permissions";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
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
import { PriceListFormDialog } from "@/modules/inventory-management/price-lists/components/price-list-form-dialog";
import { priceListPermissions } from "@/modules/inventory-management/price-lists/permissions";
import { useAllPriceLists } from "@/modules/inventory-management/price-lists/queries";
import {
  addressToFormValues,
  EMPTY_ADDRESS_FORM,
} from "@/modules/users-management/tenants/schemas";
import { userPermissions } from "@/modules/users-management/users/permissions";
import { useAllUsers } from "@/modules/users-management/users/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { BillingShippingFields } from "@/shared/components/form/billing-shipping-fields";
import { MasterSelect } from "@/shared/components/form/master-select";
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

function toSupplierCompanyType(type: Supplier["company_type"] | undefined): SupplierCompanyType {
  return type === "BOTH" ? "BOTH" : "SUPPLIER";
}

function toFormValues(supplier: Supplier | null, defaultCurrencyId: string): SupplierFormValues {
  return {
    name: supplier?.name ?? "",
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
    same_as_billing: false,
    notes: supplier?.notes ?? "",
    is_active: supplier?.is_active ?? true,
    initial_contact_name: "",
    initial_contact_email: "",
    initial_contact_phone: "",
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
  onSuccess?: (entity: CreatedParty) => void;
  showCancel?: boolean;
  onCancel?: () => void;
}) {
  const can = useCan();
  const canReadUsers = can(userPermissions.read);
  const canCreateCurrency = can(currencyPermissions.create);
  const canCreatePriceList = can(priceListPermissions.create);
  const canCreatePaymentTerm = can(paymentTermPermissions.create);
  const canCreateContact = can(contactPermissions.create);
  const canReadContacts = can(contactPermissions.read);
  const canUpdateContact = can(contactPermissions.update);
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const currenciesQuery = useAllCurrencies();
  const priceListsQuery = useAllPriceLists();
  const paymentTermsQuery = useAllPaymentTerms();
  const usersQuery = useAllUsers(canReadUsers);
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState<
    "currency" | "priceList" | "paymentTerm" | "contact" | null
  >(null);
  const [contactId, setContactId] = useState<string | null>(null);
  const isEdit = Boolean(supplier);
  const showCreateContact = !isEdit && canCreateContact;
  const showEditContact = isEdit && canReadContacts;
  const contactsQuery = usePartyContacts(supplier?.id ?? null, showEditContact);
  const contacts = contactsQuery.data ?? [];
  const primaryContactId =
    contacts.find((item) => item.is_primary)?.id ?? contacts[0]?.id ?? OPTIONAL_SELECT_NONE;
  const selectedContactId = contactId ?? primaryContactId;

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
  useDirtyFormGuard(form.formState.isDirty && !disabled);

  async function onSubmit(values: SupplierFormValues) {
    setFormError(null);
    try {
      if (supplier) {
        await updateSupplier.mutateAsync({ id: supplier.id, values });
        toast.success("Supplier updated");
        onSuccess?.({ id: supplier.id });
        return;
      }
      const created = await createSupplier.mutateAsync(values);
      const contactPayload = canCreateContact ? toInitialContactRequest(created.id, values) : null;
      if (contactPayload) {
        try {
          const contact = await createContact.mutateAsync(contactPayload);
          toast.success("Supplier created");
          onSuccess?.({ id: created.id, contact_id: contact.id });
        } catch {
          toast.success("Supplier created");
          toast.error("Supplier was created but the contact was not. Add it from Contacts.");
          return;
        }
        return;
      }
      toast.success("Supplier created");
      onSuccess?.({ id: created.id });
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  async function handlePartyContactChange(value: string) {
    setContactId(value);
    if (!supplier || value === OPTIONAL_SELECT_NONE || !canUpdateContact) {
      return;
    }
    try {
      await updateContact.mutateAsync({ id: value, values: { is_primary: true } });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const pending = createSupplier.isPending || updateSupplier.isPending || createContact.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
        {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
        <section className="flex flex-col gap-3">
          <div
            className={
              showCreateContact || showEditContact
                ? "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
                : "grid grid-cols-1 gap-3 sm:grid-cols-2"
            }
          >
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
            {showCreateContact ? (
              <FormField
                control={form.control}
                name="initial_contact_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Optional"
                        maxLength={200}
                        disabled={disabled}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}
            {showEditContact ? (
              <FormItem>
                <FormLabel>Contact</FormLabel>
                <MasterSelect
                  value={selectedContactId}
                  onValueChange={handlePartyContactChange}
                  disabled={disabled || contactsQuery.isLoading}
                  placeholder="None"
                  searchPlaceholder="Search contact…"
                  createLabel="Create contact"
                  onCreate={
                    canCreateContact && !disabled ? () => setCreating("contact") : undefined
                  }
                  options={[
                    { value: OPTIONAL_SELECT_NONE, label: "None" },
                    ...contacts.map((contact) => ({
                      value: contact.id,
                      label: contact.name,
                    })),
                  ]}
                />
              </FormItem>
            ) : null}
          </div>
          {showCreateContact ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="initial_contact_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" maxLength={255} disabled={disabled} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="initial_contact_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input maxLength={50} disabled={disabled} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ) : null}
        </section>
        <section className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                  <MasterSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={disabled || currenciesQuery.isLoading}
                    placeholder="Select a currency"
                    searchPlaceholder="Search currency…"
                    createLabel="Create currency"
                    onCreate={canCreateCurrency ? () => setCreating("currency") : undefined}
                    options={[
                      { value: OPTIONAL_SELECT_NONE, label: "None" },
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
              name="default_price_list_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price list</FormLabel>
                  <MasterSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={disabled || priceListsQuery.isLoading}
                    placeholder="None"
                    searchPlaceholder="Search price list…"
                    createLabel="Create price list"
                    onCreate={canCreatePriceList ? () => setCreating("priceList") : undefined}
                    options={[
                      { value: OPTIONAL_SELECT_NONE, label: "None" },
                      ...priceLists.map((priceList) => ({
                        value: priceList.id,
                        label: priceList.name,
                      })),
                    ]}
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
                    onValueChange={field.onChange}
                    disabled={disabled || paymentTermsQuery.isLoading}
                    placeholder="None"
                    searchPlaceholder="Search payment terms…"
                    createLabel="Create payment terms"
                    onCreate={canCreatePaymentTerm ? () => setCreating("paymentTerm") : undefined}
                    options={[
                      { value: OPTIONAL_SELECT_NONE, label: "None" },
                      ...paymentTerms.map((term) => ({
                        value: term.id,
                        label: term.name,
                      })),
                    ]}
                  />
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
          </div>
        </section>
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea disabled={disabled} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <BillingShippingFields disabled={disabled} />
        {isEdit ? (
          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
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
        {showCancel || !disabled ? (
          <div className="flex justify-end gap-2">
            {showCancel ? (
              <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
                {disabled ? "Close" : "Cancel"}
              </Button>
            ) : null}
            {!disabled ? (
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                {isEdit ? "Save Changes" : "Create Supplier"}
              </Button>
            ) : null}
          </div>
        ) : null}
      </form>
      <CurrencyFormDialog
        open={creating === "currency"}
        currency={null}
        nested
        onCreated={(entity) => form.setValue("currency_id", entity.id)}
        onOpenChange={(open) => setCreating(open ? "currency" : null)}
      />
      <PriceListFormDialog
        open={creating === "priceList"}
        nested
        onCreated={(entity) => form.setValue("default_price_list_id", entity.id)}
        onOpenChange={(open) => setCreating(open ? "priceList" : null)}
      />
      <PaymentTermFormDialog
        open={creating === "paymentTerm"}
        term={null}
        nested
        onCreated={(entity) => form.setValue("payment_terms_id", entity.id)}
        onOpenChange={(open) => setCreating(open ? "paymentTerm" : null)}
      />
      {supplier ? (
        <ContactFormDialog
          open={creating === "contact"}
          contact={null}
          nested
          lockCustomer
          defaultCustomerId={supplier.id}
          defaultIsPrimary
          onCreated={(entity) => setContactId(entity.id)}
          onOpenChange={(open) => setCreating(open ? "contact" : null)}
        />
      ) : null}
    </Form>
  );
}
