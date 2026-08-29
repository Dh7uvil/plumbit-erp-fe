"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  useCreateWarehouse,
  useUpdateWarehouse,
} from "@/modules/inventory-management/warehouses/mutations";
import {
  WarehouseFormSchema,
  type Warehouse,
  type WarehouseCreateRequest,
  type WarehouseFormValues,
} from "@/modules/inventory-management/warehouses/schemas";
import {
  addressToFormValues,
  EMPTY_ADDRESS_FORM,
  emptyToNull,
  toAddressPayload,
} from "@/modules/users-management/tenants/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { AddressFields } from "@/shared/components/form/address-fields";
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
import { applyFieldErrors } from "@/shared/lib/form-errors";

function toFormValues(warehouse: Warehouse | null): WarehouseFormValues {
  return {
    code: warehouse?.code ?? "",
    name: warehouse?.name ?? "",
    phone: warehouse?.phone ?? "",
    address: warehouse ? addressToFormValues(warehouse.address) : EMPTY_ADDRESS_FORM,
    is_default: warehouse?.is_default ?? false,
    is_active: warehouse?.is_active ?? true,
  };
}

function toCreateRequest(values: WarehouseFormValues): WarehouseCreateRequest {
  return {
    code: values.code.trim(),
    name: values.name.trim(),
    phone: emptyToNull(values.phone),
    address: toAddressPayload(values.address),
    is_default: values.is_default,
  };
}

export function WarehouseFormDialog({
  open,
  warehouse,
  onOpenChange,
}: {
  open: boolean;
  warehouse: Warehouse | null;
  onOpenChange: (open: boolean) => void;
}) {
  const createWarehouse = useCreateWarehouse();
  const updateWarehouse = useUpdateWarehouse();
  const [formError, setFormError] = useState<string | null>(null);
  const isEdit = Boolean(warehouse);

  const form = useForm<WarehouseFormValues>({
    resolver: zodResolver(WarehouseFormSchema),
    values: toFormValues(warehouse),
  });

  function handleOpenChange(next: boolean) {
    if (!next) {
      setFormError(null);
    }
    onOpenChange(next);
  }

  async function onSubmit(values: WarehouseFormValues) {
    setFormError(null);
    try {
      if (warehouse) {
        await updateWarehouse.mutateAsync({
          id: warehouse.id,
          values: {
            name: values.name.trim(),
            phone: emptyToNull(values.phone),
            address: toAddressPayload(values.address),
            is_default: values.is_default,
            is_active: values.is_active,
          },
        });
        toast.success("Warehouse updated");
      } else {
        await createWarehouse.mutateAsync(toCreateRequest(values));
        toast.success("Warehouse created");
      }
      handleOpenChange(false);
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createWarehouse.isPending || updateWarehouse.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Warehouse" : "New Warehouse"}</DialogTitle>
        </DialogHeader>
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
                      <Input placeholder="MAIN" maxLength={50} disabled={isEdit} {...field} />
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
                      <Input placeholder="Main warehouse" maxLength={200} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional" maxLength={50} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <AddressFields control={form.control} name="address" />
              <div className="flex flex-col gap-2 sm:col-span-2">
                <FormField
                  control={form.control}
                  name="is_default"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => field.onChange(checked === true)}
                        />
                      </FormControl>
                      <FormLabel>Default warehouse</FormLabel>
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
                {isEdit ? "Save Changes" : "Create Warehouse"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
