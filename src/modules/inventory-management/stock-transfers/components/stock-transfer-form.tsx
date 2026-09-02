"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { useStock } from "@/modules/inventory-management/stock/queries";
import {
  emptyTransferLine,
  StockTransferLinesEditor,
} from "@/modules/inventory-management/stock-transfers/components/stock-transfer-lines-editor";
import {
  useCreateStockTransfer,
  useUpdateStockTransfer,
} from "@/modules/inventory-management/stock-transfers/mutations";
import {
  isBlankTransferLine,
  StockTransferFormSchema,
  type StockTransfer,
  type StockTransferCreateRequest,
  type StockTransferFormValues,
  type StockTransferLineFormValues,
  type StockTransferLineInput,
  type StockTransferUpdateRequest,
} from "@/modules/inventory-management/stock-transfers/schemas";
import { WarehouseFormDialog } from "@/modules/inventory-management/warehouses/components/warehouse-form-dialog";
import { warehousePermissions } from "@/modules/inventory-management/warehouses/permissions";
import { useAllWarehouses } from "@/modules/inventory-management/warehouses/queries";
import { BranchFormDialog } from "@/modules/users-management/branches/components/branch-form-dialog";
import { branchPermissions } from "@/modules/users-management/branches/permissions";
import { useAllBranches } from "@/modules/users-management/branches/queries";
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
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function optionalUuid(value: string): string | null {
  return !value || value === OPTIONAL_SELECT_NONE ? null : value;
}

function toLineInput(line: StockTransferLineFormValues): StockTransferLineInput {
  return {
    product_id: line.product_id,
    unit_id: optionalUuid(line.unit_id),
    qty: line.qty.trim(),
    notes: emptyToNull(line.notes),
  };
}

function toFormLines(
  transfer: StockTransfer | null,
  defaults?: { productId?: string },
): StockTransferLineFormValues[] {
  const lines = transfer?.lines ?? [];
  if (lines.length === 0) {
    const empty = emptyTransferLine();
    if (defaults?.productId) {
      empty.product_id = defaults.productId;
    }
    return [empty];
  }
  return lines.map((line) => ({
    product_id: line.product_id,
    unit_id: line.unit_id ?? OPTIONAL_SELECT_NONE,
    qty: line.qty,
    notes: line.notes ?? "",
  }));
}

function toFormValues(
  transfer: StockTransfer | null,
  defaults?: { productId?: string; warehouseId?: string },
): StockTransferFormValues {
  return {
    from_warehouse_id: transfer?.from_warehouse_id ?? defaults?.warehouseId ?? OPTIONAL_SELECT_NONE,
    to_warehouse_id: transfer?.to_warehouse_id ?? OPTIONAL_SELECT_NONE,
    document_date: transfer?.document_date ?? todayIsoDate(),
    branch_id: transfer?.branch_id ?? OPTIONAL_SELECT_NONE,
    reason: transfer?.reason ?? "",
    reference: transfer?.reference ?? "",
    notes: transfer?.notes ?? "",
    lines: toFormLines(transfer, defaults),
  };
}

function qtyMapFromBalances(
  rows: Array<{ product_id: string; qty_on_hand: string }> | undefined,
): Map<string, string | null> {
  return new Map((rows ?? []).map((row) => [row.product_id, row.qty_on_hand]));
}

export function StockTransferForm({
  transfer,
  disabled = false,
  defaultProductId,
  defaultWarehouseId,
  onSuccess,
}: {
  transfer: StockTransfer | null;
  disabled?: boolean;
  defaultProductId?: string;
  defaultWarehouseId?: string;
  onSuccess?: () => void;
}) {
  const can = useCan();
  const router = useRouter();
  const isEdit = Boolean(transfer);
  const createTransfer = useCreateStockTransfer();
  const updateTransfer = useUpdateStockTransfer();
  const warehousesQuery = useAllWarehouses();
  const branchesQuery = useAllBranches();
  const [creating, setCreating] = useState<"fromWarehouse" | "toWarehouse" | "branch" | null>(null);
  const defaults = useMemo(
    () => ({ productId: defaultProductId, warehouseId: defaultWarehouseId }),
    [defaultProductId, defaultWarehouseId],
  );
  const form = useForm<StockTransferFormValues>({
    resolver: zodResolver(StockTransferFormSchema),
    defaultValues: toFormValues(transfer, defaults),
  });
  const fromWarehouseId = useWatch({ control: form.control, name: "from_warehouse_id" });
  const toWarehouseId = useWatch({ control: form.control, name: "to_warehouse_id" });
  const fromStockQuery = useStock(
    {
      warehouse_id: fromWarehouseId !== OPTIONAL_SELECT_NONE ? fromWarehouseId : undefined,
      page_size: 100,
    },
    fromWarehouseId !== OPTIONAL_SELECT_NONE,
  );
  const toStockQuery = useStock(
    {
      warehouse_id: toWarehouseId !== OPTIONAL_SELECT_NONE ? toWarehouseId : undefined,
      page_size: 100,
    },
    toWarehouseId !== OPTIONAL_SELECT_NONE,
  );
  const pending = createTransfer.isPending || updateTransfer.isPending;
  useDirtyFormGuard(!disabled && form.formState.isDirty);

  useEffect(() => {
    form.reset(toFormValues(transfer, defaults));
  }, [defaults, form, transfer]);

  const posted = Boolean(transfer?.is_posted);
  const sourceQtyByProductId = useMemo(() => {
    if (posted && transfer) {
      return new Map(transfer.lines.map((line) => [line.product_id, line.qty_source_before]));
    }
    return qtyMapFromBalances(fromStockQuery.data?.data);
  }, [fromStockQuery.data?.data, posted, transfer]);
  const destQtyByProductId = useMemo(() => {
    if (posted && transfer) {
      return new Map(transfer.lines.map((line) => [line.product_id, line.qty_dest_before]));
    }
    return qtyMapFromBalances(toStockQuery.data?.data);
  }, [posted, toStockQuery.data?.data, transfer]);

  async function onSubmit(values: StockTransferFormValues) {
    const lines = values.lines.filter((line) => !isBlankTransferLine(line)).map(toLineInput);
    const payload = {
      from_warehouse_id: values.from_warehouse_id,
      to_warehouse_id: values.to_warehouse_id,
      document_date: values.document_date,
      branch_id: optionalUuid(values.branch_id),
      reason: emptyToNull(values.reason),
      reference: emptyToNull(values.reference),
      notes: emptyToNull(values.notes),
      lines,
    };
    try {
      if (transfer) {
        const update: StockTransferUpdateRequest = payload;
        await updateTransfer.mutateAsync({
          id: transfer.id,
          values: update,
          version: transfer.version,
        });
        toast.success("Stock transfer saved");
        onSuccess?.();
      } else {
        const create: StockTransferCreateRequest = payload;
        const created = await createTransfer.mutateAsync(create);
        toast.success("Stock transfer created");
        router.push(`/stock-transfers/${created.id}`);
      }
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      toast.error(getErrorMessage(error));
    }
  }

  const warehouses = warehousesQuery.data ?? [];
  const branches = branchesQuery.data ?? [];
  const warehouseOptions = warehouses.map((warehouse) => ({
    value: warehouse.id,
    label: `${warehouse.code} — ${warehouse.name}`,
  }));

  return (
    <Form {...form}>
      <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <FormField
            control={form.control}
            name="from_warehouse_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>From warehouse</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled || warehousesQuery.isLoading}
                  placeholder="Select warehouse"
                  searchPlaceholder="Search warehouse…"
                  createLabel="Create warehouse"
                  onCreate={
                    can(warehousePermissions.create)
                      ? () => setCreating("fromWarehouse")
                      : undefined
                  }
                  options={warehouseOptions}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="to_warehouse_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>To warehouse</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled || warehousesQuery.isLoading}
                  placeholder="Select warehouse"
                  searchPlaceholder="Search warehouse…"
                  createLabel="Create warehouse"
                  onCreate={
                    can(warehousePermissions.create) ? () => setCreating("toWarehouse") : undefined
                  }
                  options={warehouseOptions}
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
                  <Input type="date" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reason</FormLabel>
                <FormControl>
                  <Input disabled={disabled} maxLength={200} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="reference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reference</FormLabel>
                <FormControl>
                  <Input disabled={disabled} maxLength={100} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="branch_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Branch</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled || branchesQuery.isLoading}
                  placeholder="None"
                  searchPlaceholder="Search branch…"
                  createLabel="Create branch"
                  onCreate={can(branchPermissions.create) ? () => setCreating("branch") : undefined}
                  options={[
                    { value: OPTIONAL_SELECT_NONE, label: "None" },
                    ...branches.map((branch) => ({ value: branch.id, label: branch.name })),
                  ]}
                />
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
                <Textarea disabled={disabled} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <StockTransferLinesEditor
          form={form}
          disabled={disabled}
          sourceQtyByProductId={sourceQtyByProductId}
          destQtyByProductId={destQtyByProductId}
        />
        {!disabled ? (
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {isEdit ? "Save Changes" : "Create transfer"}
            </Button>
          </div>
        ) : null}
      </form>
      <WarehouseFormDialog
        open={creating === "fromWarehouse" || creating === "toWarehouse"}
        nested
        onCreated={(entity) => {
          if (creating === "fromWarehouse") {
            form.setValue("from_warehouse_id", entity.id);
          } else if (creating === "toWarehouse") {
            form.setValue("to_warehouse_id", entity.id);
          }
        }}
        onOpenChange={(open) => setCreating(open ? creating : null)}
      />
      <BranchFormDialog
        open={creating === "branch"}
        branch={null}
        nested
        onCreated={(entity) => form.setValue("branch_id", entity.id)}
        onOpenChange={(open) => setCreating(open ? "branch" : null)}
      />
    </Form>
  );
}
