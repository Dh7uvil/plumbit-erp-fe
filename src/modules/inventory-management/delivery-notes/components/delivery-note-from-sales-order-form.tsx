"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import {
  StockWriteAlert,
  isStockWriteAlertError,
} from "@/modules/erp/period-lock/components/stock-write-alert";
import { useSalesOrder } from "@/modules/erp/sales-orders/queries";
import { salesOrderDisplayNumber } from "@/modules/erp/sales-orders/schemas";
import { useCreateDeliveryNoteFromSalesOrder } from "@/modules/inventory-management/delivery-notes/mutations";
import {
  DeliveryNoteFromSalesOrderFormSchema,
  type DeliveryNoteFromSalesOrderFormValues,
} from "@/modules/inventory-management/delivery-notes/schemas";
import { WarehouseFormDialog } from "@/modules/inventory-management/warehouses/components/warehouse-form-dialog";
import { warehousePermissions } from "@/modules/inventory-management/warehouses/permissions";
import { useAllWarehouses } from "@/modules/inventory-management/warehouses/queries";
import { emptyToNull } from "@/modules/users-management/tenants/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { MasterSelect } from "@/shared/components/form/master-select";
import { Button } from "@/shared/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
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

export function DeliveryNoteFromSalesOrderForm({ salesOrderId }: { salesOrderId: string }) {
  const can = useCan();
  const router = useRouter();
  const salesOrderQuery = useSalesOrder(salesOrderId);
  const warehousesQuery = useAllWarehouses();
  const createFromOrder = useCreateDeliveryNoteFromSalesOrder();
  const [creatingWarehouse, setCreatingWarehouse] = useState(false);
  const [writeError, setWriteError] = useState<unknown>(null);
  const form = useForm<DeliveryNoteFromSalesOrderFormValues>({
    resolver: zodResolver(DeliveryNoteFromSalesOrderFormSchema),
    defaultValues: {
      sales_order_id: salesOrderId,
      warehouse_id: OPTIONAL_SELECT_NONE,
      document_date: todayIsoDate(),
      notes: "",
    },
  });
  useDirtyFormGuard(form.formState.isDirty);
  const warehouses = warehousesQuery.data ?? [];
  const salesOrder = salesOrderQuery.data;
  const number = salesOrder ? salesOrderDisplayNumber(salesOrder) : null;

  async function onSubmit(values: DeliveryNoteFromSalesOrderFormValues) {
    setWriteError(null);
    try {
      const created = await createFromOrder.mutateAsync({
        sales_order_id: values.sales_order_id,
        warehouse_id: optionalUuid(values.warehouse_id),
        document_date: values.document_date,
        notes: emptyToNull(values.notes),
      });
      toast.success("Delivery note created");
      router.push(`/delivery-notes/${created.id}`);
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      if (isStockWriteAlertError(error)) {
        setWriteError(error);
        return;
      }
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Form {...form}>
      <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(onSubmit)}>
        <StockWriteAlert error={writeError} />
        <p className="text-muted-foreground text-sm">
          Outstanding lines from {number ?? "this sales order"} will be copied as the default
          quantity to deliver.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="warehouse_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Warehouse</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={warehousesQuery.isLoading}
                  placeholder="Use sales order warehouse"
                  searchPlaceholder="Search warehouse…"
                  createLabel="Create warehouse"
                  onCreate={can(warehousePermissions.create) ? () => setCreatingWarehouse(true) : undefined}
                  options={[
                    { value: OPTIONAL_SELECT_NONE, label: "Use sales order warehouse" },
                    ...warehouses.map((warehouse) => ({
                      value: warehouse.id,
                      label: `${warehouse.code} — ${warehouse.name}`,
                    })),
                  ]}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="document_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Document date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={createFromOrder.isPending}>
            {createFromOrder.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Create delivery note
          </Button>
        </div>
      </form>
      <WarehouseFormDialog
        open={creatingWarehouse}
        nested
        onCreated={(entity) => form.setValue("warehouse_id", entity.id)}
        onOpenChange={setCreatingWarehouse}
      />
    </Form>
  );
}
