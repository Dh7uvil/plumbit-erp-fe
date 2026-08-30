"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ContactsPanel } from "@/modules/crm/contacts/components/contacts-panel";
import { customerPermissions } from "@/modules/crm/customers/permissions";
import { SupplierForm } from "@/modules/erp/suppliers/components/supplier-form";
import { useAddSupplierAddress, useDeleteSupplierAddress } from "@/modules/erp/suppliers/mutations";
import { supplierPermissions } from "@/modules/erp/suppliers/permissions";
import { useSupplier } from "@/modules/erp/suppliers/queries";
import {
  ExtraAddressFormSchema,
  type ExtraAddressFormValues,
  type SupplierExtraAddress,
} from "@/modules/erp/suppliers/schemas";
import { EntityAttachmentsPanel } from "@/modules/users-management/attachments/components/entity-attachments-panel";
import {
  EMPTY_ADDRESS_FORM,
  emptyToNull,
  toAddressPayload,
  type AddressPayload,
} from "@/modules/users-management/tenants/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { AddressFields } from "@/shared/components/form/address-fields";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
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
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { useCan } from "@/shared/providers/session-provider";

const ADDRESS_HEADERS = ["Label", "Address", "Defaults", "Actions"] as const;

function formatAddress(address: AddressPayload | null | undefined): string {
  if (!address) {
    return "—";
  }
  const parts = [
    address.address_line_1,
    address.address_line_2,
    address.city,
    address.state,
    address.country,
    address.postal_code,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}

export function SupplierDetailScreen({ supplierId }: { supplierId: string }) {
  const can = useCan();
  const canUpdate = can(supplierPermissions.update);
  const supplierQuery = useSupplier(supplierId);
  const addAddress = useAddSupplierAddress();
  const deleteAddress = useDeleteSupplierAddress();
  const [addressOpen, setAddressOpen] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [deletingAddress, setDeletingAddress] = useState<SupplierExtraAddress | null>(null);

  const supplier = supplierQuery.data;
  const extraAddresses = supplier?.extra_addresses ?? [];

  const addressForm = useForm<ExtraAddressFormValues>({
    resolver: zodResolver(ExtraAddressFormSchema),
    defaultValues: {
      label: "",
      address: EMPTY_ADDRESS_FORM,
      is_default_billing: false,
      is_default_shipping: false,
    },
  });

  async function onAddAddress(values: ExtraAddressFormValues) {
    if (!supplier) {
      return;
    }
    setAddressError(null);
    try {
      await addAddress.mutateAsync({
        id: supplier.id,
        values: {
          label: emptyToNull(values.label),
          address: toAddressPayload(values.address) ?? {},
          is_default_billing: values.is_default_billing,
          is_default_shipping: values.is_default_shipping,
        },
      });
      toast.success("Address added");
      setAddressOpen(false);
    } catch (error) {
      if (applyFieldErrors(error, addressForm.setError)) {
        return;
      }
      setAddressError(getErrorMessage(error));
    }
  }

  async function confirmDeleteAddress() {
    if (!supplier || !deletingAddress) {
      return;
    }
    try {
      await deleteAddress.mutateAsync({ id: supplier.id, extraId: deletingAddress.id });
      toast.success("Address deleted");
      setDeletingAddress(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  if (supplierQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (supplierQuery.isError || !supplier) {
    return (
      <div className="flex flex-col gap-3">
        <DataTableError
          message={
            supplierQuery.error ? getErrorMessage(supplierQuery.error) : "Supplier not found"
          }
          onRetry={() => supplierQuery.refetch()}
        />
        <Button type="button" variant="outline" asChild>
          <Link href="/suppliers">Back to suppliers</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={supplier.name}
        subtitle={supplier.code}
        actions={
          <div className="flex gap-2">
            {supplier.company_type === "BOTH" && can(customerPermissions.read) ? (
              <Button type="button" variant="outline" size="sm" asChild>
                <Link href={`/customers/${supplier.id}`}>View as customer</Link>
              </Button>
            ) : null}
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href="/suppliers">Back</Link>
            </Button>
          </div>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{canUpdate ? "Edit supplier" : "Supplier"}</CardTitle>
        </CardHeader>
        <CardContent>
          <SupplierForm supplier={supplier} disabled={!canUpdate} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">Extra addresses</CardTitle>
          {canUpdate ? (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                addressForm.reset({
                  label: "",
                  address: EMPTY_ADDRESS_FORM,
                  is_default_billing: false,
                  is_default_shipping: false,
                });
                setAddressError(null);
                setAddressOpen(true);
              }}
            >
              <Plus className="size-3.5" />
              Add address
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          <DataTable>
            <TableHeader>
              <TableRow>
                {ADDRESS_HEADERS.map((header) => (
                  <TableHead key={header}>{header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {extraAddresses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={ADDRESS_HEADERS.length}>
                    <DataTableEmpty
                      title="No extra addresses"
                      message="Add another billing or shipping address."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                extraAddresses.map((extra) => (
                  <TableRow key={extra.id}>
                    <TableCell className="font-medium">{extra.label || "—"}</TableCell>
                    <TableCell>{formatAddress(extra.address)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {extra.is_default_billing ? <Badge variant="info">Billing</Badge> : null}
                        {extra.is_default_shipping ? <Badge variant="info">Shipping</Badge> : null}
                        {!extra.is_default_billing && !extra.is_default_shipping ? "—" : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      {canUpdate ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive size-7"
                          aria-label="Delete address"
                          onClick={() => setDeletingAddress(extra)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </DataTable>
        </CardContent>
      </Card>
      <ContactsPanel customerId={supplier.id} />
      <EntityAttachmentsPanel entityType="CUSTOMER" entityId={supplier.id} />
      <Dialog
        open={addressOpen}
        onOpenChange={(open) => {
          setAddressOpen(open);
          if (!open) {
            setAddressError(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add address</DialogTitle>
          </DialogHeader>
          <Form {...addressForm}>
            <form onSubmit={addressForm.handleSubmit(onAddAddress)} className="flex flex-col gap-3">
              {addressError ? <p className="text-destructive text-sm">{addressError}</p> : null}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField
                  control={addressForm.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Label</FormLabel>
                      <FormControl>
                        <Input placeholder="Warehouse, site…" maxLength={100} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <AddressFields control={addressForm.control} name="address" />
                <FormField
                  control={addressForm.control}
                  name="is_default_billing"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => field.onChange(checked === true)}
                        />
                      </FormControl>
                      <FormLabel>Default billing</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={addressForm.control}
                  name="is_default_shipping"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => field.onChange(checked === true)}
                        />
                      </FormControl>
                      <FormLabel>Default shipping</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddressOpen(false)}
                  disabled={addAddress.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={addAddress.isPending}>
                  {addAddress.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                  Add address
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <ConfirmActionDialog
        open={Boolean(deletingAddress)}
        title="Delete address"
        description="Remove this extra address?"
        confirmLabel="Delete"
        pending={deleteAddress.isPending}
        onOpenChange={(open) => !open && setDeletingAddress(null)}
        onConfirm={() => void confirmDeleteAddress()}
      />
    </div>
  );
}
