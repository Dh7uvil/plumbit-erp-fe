"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useCreateContact, useUpdateContact } from "@/modules/crm/contacts/mutations";
import {
  ContactFormSchema,
  type Contact,
  type ContactFormValues,
} from "@/modules/crm/contacts/schemas";
import { useCompanyOptions } from "@/modules/crm/contacts/use-company-options";
import { CustomerFormDialog } from "@/modules/crm/customers/components/customer-form-dialog";
import { customerPermissions } from "@/modules/crm/customers/permissions";
import { SupplierFormDialog } from "@/modules/erp/suppliers/components/supplier-form-dialog";
import { supplierPermissions } from "@/modules/erp/suppliers/permissions";
import { emptyToNull } from "@/modules/users-management/tenants/schemas";
import { getErrorMessage } from "@/shared/api/errors";
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
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";
import { useCan } from "@/shared/providers/session-provider";

function toFormValues(
  contact: Contact | null,
  defaultCustomerId?: string,
  defaultIsPrimary = false,
): ContactFormValues {
  return {
    customer_id: contact?.customer_id ?? defaultCustomerId ?? "",
    name: contact?.name ?? "",
    email: contact?.email ?? "",
    phone: contact?.phone ?? "",
    is_primary: contact?.is_primary ?? defaultIsPrimary,
    is_active: contact?.is_active ?? true,
  };
}

export function ContactForm({
  contact,
  defaultCustomerId,
  lockCustomer = false,
  defaultIsPrimary = false,
  disabled = false,
  onSuccess,
  showCancel = false,
  onCancel,
}: {
  contact: Contact | null;
  defaultCustomerId?: string;
  lockCustomer?: boolean;
  defaultIsPrimary?: boolean;
  disabled?: boolean;
  onSuccess?: (entity: { id: string }) => void;
  showCancel?: boolean;
  onCancel?: () => void;
}) {
  const can = useCan();
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const companiesQuery = useCompanyOptions(!lockCustomer);
  const [formError, setFormError] = useState<string | null>(null);
  const [creatingCompany, setCreatingCompany] = useState<"customer" | "supplier" | null>(null);
  const isEdit = Boolean(contact);
  const customerLocked = lockCustomer || isEdit;

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(ContactFormSchema),
    values: toFormValues(contact, defaultCustomerId, defaultIsPrimary),
  });
  useDirtyFormGuard(form.formState.isDirty && !disabled);

  const companies = companiesQuery.companies;

  async function onSubmit(values: ContactFormValues) {
    setFormError(null);
    try {
      if (contact) {
        await updateContact.mutateAsync({
          id: contact.id,
          values: {
            name: values.name.trim(),
            email: emptyToNull(values.email),
            phone: emptyToNull(values.phone),
            is_primary: values.is_primary,
            is_active: values.is_active,
          },
        });
        toast.success("Contact updated");
        onSuccess?.(contact);
      } else {
        const created = await createContact.mutateAsync({
          customer_id: values.customer_id,
          name: values.name.trim(),
          email: emptyToNull(values.email),
          phone: emptyToNull(values.phone),
          is_primary: values.is_primary,
        });
        toast.success("Contact created");
        onSuccess?.(created);
      }
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createContact.isPending || updateContact.isPending;

  return (
    <Form {...form}>
      <form
        onSubmit={disabled ? (event) => event.preventDefault() : form.handleSubmit(onSubmit)}
        className="flex flex-col gap-3"
      >
        {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {lockCustomer ? null : (
            <FormField
              control={form.control}
              name="customer_id"
              render={({ field }) => (
                <FormItem className="col-span-full">
                  <FormLabel>Company</FormLabel>
                  {customerLocked ? (
                    <FormControl>
                      <Input
                        value={companies.find((company) => company.id === field.value)?.name ?? "—"}
                        disabled
                      />
                    </FormControl>
                  ) : (
                    <MasterSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={companiesQuery.isLoading || disabled}
                      placeholder="Select a company"
                      searchPlaceholder="Search company…"
                      createActions={[
                        ...(can(customerPermissions.create) && !disabled
                          ? [
                              {
                                label: "Create customer",
                                onSelect: () => setCreatingCompany("customer"),
                              },
                            ]
                          : []),
                        ...(can(supplierPermissions.create) && !disabled
                          ? [
                              {
                                label: "Create supplier",
                                onSelect: () => setCreatingCompany("supplier"),
                              },
                            ]
                          : []),
                      ]}
                      options={companies.map((company) => ({
                        value: company.id,
                        label: company.name,
                      }))}
                    />
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="col-span-full">
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Contact name"
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
            name="email"
            render={({ field }) => (
              <FormItem className="col-span-full">
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
            name="phone"
            render={({ field }) => (
              <FormItem className="col-span-full">
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input maxLength={50} disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div
            className={
              isEdit ? "col-span-full grid grid-cols-1 gap-3 sm:grid-cols-2" : "col-span-full"
            }
          >
            <FormField
              control={form.control}
              name="is_primary"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      disabled={disabled}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                    />
                  </FormControl>
                  <FormLabel>Primary contact</FormLabel>
                </FormItem>
              )}
            />
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
          </div>
        </div>
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
                {isEdit ? "Save Changes" : "Create Contact"}
              </Button>
            ) : null}
          </div>
        ) : null}
      </form>
      <CustomerFormDialog
        open={creatingCompany === "customer"}
        customer={null}
        nested
        onCreated={(entity) => form.setValue("customer_id", entity.id)}
        onOpenChange={(open) => setCreatingCompany(open ? "customer" : null)}
      />
      <SupplierFormDialog
        open={creatingCompany === "supplier"}
        supplier={null}
        nested
        onCreated={(entity) => form.setValue("customer_id", entity.id)}
        onOpenChange={(open) => setCreatingCompany(open ? "supplier" : null)}
      />
    </Form>
  );
}
