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
import { customerPermissions } from "@/modules/crm/customers/permissions";
import { useAllCustomers } from "@/modules/crm/customers/queries";
import { EntityAttachmentsPanel } from "@/modules/users-management/attachments/components/entity-attachments-panel";
import { emptyToNull } from "@/modules/users-management/tenants/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
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
import { useCan } from "@/shared/providers/session-provider";

function toFormValues(contact: Contact | null, defaultCustomerId?: string): ContactFormValues {
  return {
    customer_id: contact?.customer_id ?? defaultCustomerId ?? "",
    name: contact?.name ?? "",
    email: contact?.email ?? "",
    phone: contact?.phone ?? "",
    is_primary: contact?.is_primary ?? false,
    is_active: contact?.is_active ?? true,
  };
}

export function ContactFormDialog({
  open,
  contact,
  defaultCustomerId,
  lockCustomer = false,
  onOpenChange,
}: {
  open: boolean;
  contact: Contact | null;
  defaultCustomerId?: string;
  lockCustomer?: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const can = useCan();
  const customersQuery = useAllCustomers(!lockCustomer && can(customerPermissions.read));
  const [formError, setFormError] = useState<string | null>(null);
  const isEdit = Boolean(contact);
  const customerLocked = lockCustomer || isEdit;

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(ContactFormSchema),
    values: toFormValues(contact, defaultCustomerId),
  });

  const customers = customersQuery.data ?? [];

  function handleOpenChange(next: boolean) {
    if (!next) {
      setFormError(null);
    }
    onOpenChange(next);
  }

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
      } else {
        await createContact.mutateAsync({
          customer_id: values.customer_id,
          name: values.name.trim(),
          email: emptyToNull(values.email),
          phone: emptyToNull(values.phone),
          is_primary: values.is_primary,
        });
        toast.success("Contact created");
      }
      handleOpenChange(false);
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createContact.isPending || updateContact.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Contact" : "New Contact"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
            {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {lockCustomer ? null : (
                <FormField
                  control={form.control}
                  name="customer_id"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Customer</FormLabel>
                      {customerLocked ? (
                        <FormControl>
                          <Input
                            value={
                              customers.find((customer) => customer.id === field.value)?.name ?? "—"
                            }
                            disabled
                          />
                        </FormControl>
                      ) : (
                        <Select
                          value={field.value || undefined}
                          onValueChange={field.onChange}
                          disabled={customersQuery.isLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a customer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {customers.map((customer) => (
                              <SelectItem key={customer.id} value={customer.id}>
                                {customer.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Contact name" maxLength={200} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" maxLength={255} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input maxLength={50} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-col gap-2 sm:col-span-2">
                <FormField
                  control={form.control}
                  name="is_primary"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
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
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                {isEdit ? "Save Changes" : "Create Contact"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        {contact ? <EntityAttachmentsPanel entityType="CONTACT" entityId={contact.id} /> : null}
      </DialogContent>
    </Dialog>
  );
}
