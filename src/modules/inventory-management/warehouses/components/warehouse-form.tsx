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

export function WarehouseForm({
  warehouse,
  disabled = false,
  onSuccess,
  showCancel = false,
  onCancel,
}: {
  warehouse: Warehouse | null;
  disabled?: boolean;
  onSuccess?: (entity: { id: string }) => void;
  showCancel?: boolean;
  onCancel?: () => void;
}) {
  const createWarehouse = useCreateWarehouse();
  const updateWarehouse = useUpdateWarehouse();
  const [formError, setFormError] = useState<string | null>(null);
  const isEdit = Boolean(warehouse);

  const form = useForm<WarehouseFormValues>({
    resolver: zodResolver(WarehouseFormSchema),
    values: toFormValues(warehouse),
  });

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
        onSuccess?.(warehouse);
      } else {
        const created = await createWarehouse.mutateAsync(toCreateRequest(values));
        toast.success("Warehouse created");
        onSuccess?.(created);
      }
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createWarehouse.isPending || updateWarehouse.isPending;

  return (
    <Form {...form}>
      <form
        onSubmit={disabled ? (event) => event.preventDefault() : form.handleSubmit(onSubmit)}
        className="flex flex-col gap-3"
      >
        {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
        <div
          className={
            isEdit
              ? "grid grid-cols-1 gap-3 sm:grid-cols-2"
              : "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
          }
        >
          {!isEdit ? (
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input placeholder="MAIN" maxLength={50} disabled={disabled} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Main warehouse"
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
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="Optional" maxLength={50} disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <AddressFields control={form.control} name="address" disabled={disabled} />
          <div className="col-span-full flex flex-col gap-2">
            <FormField
              control={form.control}
              name="is_default"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      disabled={disabled}
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
                {isEdit ? "Save Changes" : "Create Warehouse"}
              </Button>
            ) : null}
          </div>
        ) : null}
      </form>
    </Form>
  );
}
