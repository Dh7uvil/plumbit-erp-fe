"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import {
  emptyAdjustmentLine,
  StockAdjustmentLinesEditor,
} from "@/modules/inventory-management/stock-adjustments/components/stock-adjustment-lines-editor";
import {
  useCreateStockAdjustment,
  useUpdateStockAdjustment,
} from "@/modules/inventory-management/stock-adjustments/mutations";
import {
  isBlankAdjustmentLine,
  STOCK_ADJUSTMENT_REASON_LABELS,
  STOCK_ADJUSTMENT_REASONS,
  StockAdjustmentFormSchema,
  type StockAdjustment,
  type StockAdjustmentCreateRequest,
  type StockAdjustmentFormValues,
  type StockAdjustmentLineFormValues,
  type StockAdjustmentLineInput,
  type StockAdjustmentReason,
  type StockAdjustmentUpdateRequest,
} from "@/modules/inventory-management/stock-adjustments/schemas";
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

function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function optionalUuid(value: string): string | null {
  return !value || value === OPTIONAL_SELECT_NONE ? null : value;
}

function toLineInput(
  line: StockAdjustmentLineFormValues,
  reason: StockAdjustmentReason,
): StockAdjustmentLineInput {
  return {
    product_id: line.product_id,
    unit_id: optionalUuid(line.unit_id),
    qty_delta: reason === "COUNT" ? null : emptyToNull(line.qty_delta),
    qty_counted: reason === "COUNT" ? emptyToNull(line.qty_counted) : null,
    notes: emptyToNull(line.notes),
  };
}

function toFormLines(
  adjustment: StockAdjustment | null,
  defaults?: { productId?: string },
): StockAdjustmentLineFormValues[] {
  const lines = adjustment?.lines ?? [];
  if (lines.length === 0) {
    const empty = emptyAdjustmentLine();
    if (defaults?.productId) {
      empty.product_id = defaults.productId;
    }
    return [empty];
  }
  return lines.map((line) => ({
    product_id: line.product_id,
    unit_id: line.unit_id ?? OPTIONAL_SELECT_NONE,
    qty_delta: line.qty_delta ?? "",
    qty_counted: line.qty_counted ?? "",
    notes: line.notes ?? "",
  }));
}

function toFormValues(
  adjustment: StockAdjustment | null,
  defaults?: { productId?: string; warehouseId?: string },
): StockAdjustmentFormValues {
  return {
    warehouse_id: adjustment?.warehouse_id ?? defaults?.warehouseId ?? OPTIONAL_SELECT_NONE,
    document_date: adjustment?.document_date ?? todayIsoDate(),
    reason: adjustment?.reason ?? "OPENING_STOCK",
    branch_id: adjustment?.branch_id ?? OPTIONAL_SELECT_NONE,
    reference: adjustment?.reference ?? "",
    notes: adjustment?.notes ?? "",
    lines: toFormLines(adjustment, defaults),
  };
}

export function StockAdjustmentForm({
  adjustment,
  disabled = false,
  defaultProductId,
  defaultWarehouseId,
  onSuccess,
}: {
  adjustment: StockAdjustment | null;
  disabled?: boolean;
  defaultProductId?: string;
  defaultWarehouseId?: string;
  onSuccess?: () => void;
}) {
  const can = useCan();
  const router = useRouter();
  const isEdit = Boolean(adjustment);
  const createAdjustment = useCreateStockAdjustment();
  const updateAdjustment = useUpdateStockAdjustment();
  const warehousesQuery = useAllWarehouses();
  const branchesQuery = useAllBranches();
  const [creating, setCreating] = useState<"warehouse" | "branch" | null>(null);
  const defaults = useMemo(
    () => ({ productId: defaultProductId, warehouseId: defaultWarehouseId }),
    [defaultProductId, defaultWarehouseId],
  );
  const form = useForm<StockAdjustmentFormValues>({
    resolver: zodResolver(StockAdjustmentFormSchema),
    defaultValues: toFormValues(adjustment, defaults),
  });
  const reason = useWatch({ control: form.control, name: "reason" });
  const isCount = reason === "COUNT";
  const pending = createAdjustment.isPending || updateAdjustment.isPending;
  useDirtyFormGuard(!disabled && form.formState.isDirty);

  useEffect(() => {
    form.reset(toFormValues(adjustment, defaults));
  }, [adjustment, defaults, form]);

  const bookedByProductId = useMemo(() => {
    if (!adjustment?.is_posted) {
      return undefined;
    }
    return new Map(adjustment.lines.map((line) => [line.product_id, line.qty_booked]));
  }, [adjustment]);

  async function onSubmit(values: StockAdjustmentFormValues) {
    const lines = values.lines
      .filter((line) => !isBlankAdjustmentLine(line))
      .map((line) => toLineInput(line, values.reason));
    const payload = {
      warehouse_id: values.warehouse_id,
      document_date: values.document_date,
      reason: values.reason,
      branch_id: optionalUuid(values.branch_id),
      reference: emptyToNull(values.reference),
      notes: emptyToNull(values.notes),
      lines,
    };
    try {
      if (adjustment) {
        const update: StockAdjustmentUpdateRequest = payload;
        await updateAdjustment.mutateAsync({
          id: adjustment.id,
          values: update,
          version: adjustment.version,
        });
        toast.success("Stock adjustment saved");
        onSuccess?.();
      } else {
        const create: StockAdjustmentCreateRequest = payload;
        const created = await createAdjustment.mutateAsync(create);
        toast.success("Stock adjustment created");
        router.push(`/stock-adjustments/${created.id}`);
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

  return (
    <Form {...form}>
      <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <FormField
            control={form.control}
            name="warehouse_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Warehouse</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled || warehousesQuery.isLoading}
                  placeholder="Select warehouse"
                  searchPlaceholder="Search warehouse…"
                  createLabel="Create warehouse"
                  onCreate={
                    can(warehousePermissions.create) ? () => setCreating("warehouse") : undefined
                  }
                  options={warehouses.map((warehouse) => ({
                    value: warehouse.id,
                    label: `${warehouse.code} — ${warehouse.name}`,
                  }))}
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
                <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Reason" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STOCK_ADJUSTMENT_REASONS.map((value) => (
                      <SelectItem key={value} value={value}>
                        {STOCK_ADJUSTMENT_REASON_LABELS[value]}
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
        <StockAdjustmentLinesEditor
          form={form}
          disabled={disabled}
          isCount={isCount}
          bookedByProductId={bookedByProductId}
        />
        {!disabled ? (
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {isEdit ? "Save Changes" : "Create adjustment"}
            </Button>
          </div>
        ) : null}
      </form>
      <WarehouseFormDialog
        open={creating === "warehouse"}
        nested
        onCreated={(entity) => form.setValue("warehouse_id", entity.id)}
        onOpenChange={(open) => setCreating(open ? "warehouse" : null)}
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
