"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import {
  StockWriteAlert,
  isStockWriteAlertError,
} from "@/modules/erp/period-lock/components/stock-write-alert";
import { usePurchaseOrder } from "@/modules/erp/purchase-orders/queries";
import { purchaseOrderDisplayNumber } from "@/modules/erp/purchase-orders/schemas";
import { useCreateGoodsReceiptFromPurchaseOrder } from "@/modules/inventory-management/goods-receipts/mutations";
import {
  GoodsReceiptFromPoFormSchema,
  type GoodsReceiptFromPoFormValues,
} from "@/modules/inventory-management/goods-receipts/schemas";
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
import { useState } from "react";

function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function optionalUuid(value: string): string | null {
  return !value || value === OPTIONAL_SELECT_NONE ? null : value;
}

export function GoodsReceiptFromPoForm({ purchaseOrderId }: { purchaseOrderId: string }) {
  const can = useCan();
  const router = useRouter();
  const purchaseOrderQuery = usePurchaseOrder(purchaseOrderId);
  const warehousesQuery = useAllWarehouses();
  const createFromPo = useCreateGoodsReceiptFromPurchaseOrder();
  const [creatingWarehouse, setCreatingWarehouse] = useState(false);
  const [writeError, setWriteError] = useState<unknown>(null);
  const form = useForm<GoodsReceiptFromPoFormValues>({
    resolver: zodResolver(GoodsReceiptFromPoFormSchema),
    defaultValues: {
      purchase_order_id: purchaseOrderId,
      warehouse_id: OPTIONAL_SELECT_NONE,
      document_date: todayIsoDate(),
      notes: "",
    },
  });
  useDirtyFormGuard(form.formState.isDirty);
  const warehouses = warehousesQuery.data ?? [];
  const purchaseOrder = purchaseOrderQuery.data;
  const number = purchaseOrder ? purchaseOrderDisplayNumber(purchaseOrder) : null;

  async function onSubmit(values: GoodsReceiptFromPoFormValues) {
    setWriteError(null);
    try {
      const created = await createFromPo.mutateAsync({
        purchase_order_id: values.purchase_order_id,
        warehouse_id: optionalUuid(values.warehouse_id),
        document_date: values.document_date,
        notes: emptyToNull(values.notes),
      });
      toast.success("Goods receipt created");
      router.push(`/goods-receipts/${created.id}`);
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
          Outstanding lines from {number ?? "this purchase order"} will be copied. Rates and
          supplier SKUs are taken from the purchase order.
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
                  placeholder="Use purchase order warehouse"
                  searchPlaceholder="Search warehouse…"
                  createLabel="Create warehouse"
                  onCreate={can(warehousePermissions.create) ? () => setCreatingWarehouse(true) : undefined}
                  options={[
                    { value: OPTIONAL_SELECT_NONE, label: "Use purchase order warehouse" },
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
          <Button type="submit" disabled={createFromPo.isPending}>
            {createFromPo.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Create goods receipt
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
