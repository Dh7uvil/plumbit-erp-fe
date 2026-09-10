"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import {
  StockWriteAlert,
  isStockWriteAlertError,
} from "@/modules/erp/period-lock/components/stock-write-alert";
import { useSalesOrderDeliverableLines, useSalesOrders } from "@/modules/erp/sales-orders/queries";
import { salesOrderDisplayNumber } from "@/modules/erp/sales-orders/schemas";
import {
  useCreateDeliveryNote,
  useUpdateDeliveryNote,
} from "@/modules/inventory-management/delivery-notes/mutations";
import {
  DeliveryNoteFormSchema,
  emptyDeliveryNoteLine,
  isBlankDeliveryNoteLine,
  type DeliveryNote,
  type DeliveryNoteCreateRequest,
  type DeliveryNoteFormValues,
  type DeliveryNoteLineInput,
  type DeliveryNoteUpdateRequest,
} from "@/modules/inventory-management/delivery-notes/schemas";
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
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { formatDecimal } from "@/shared/lib/format";
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";
import { useCan } from "@/shared/providers/session-provider";

function todayIsoDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function optionalUuid(value: string): string | null {
  return !value || value === OPTIONAL_SELECT_NONE ? null : value;
}

function toLineInput(line: DeliveryNoteFormValues["lines"][number]): DeliveryNoteLineInput {
  return {
    sales_order_line_id: line.sales_order_line_id,
    product_id: optionalUuid(line.product_id),
    description: emptyToNull(line.description),
    quantity: line.quantity,
    unit_id: optionalUuid(line.unit_id),
    rate: emptyToNull(line.rate) ?? "0",
  };
}

function toFormValues(note: DeliveryNote | null): DeliveryNoteFormValues {
  const lines = note?.lines ?? [];
  return {
    sales_order_id: note?.sales_order_id ?? OPTIONAL_SELECT_NONE,
    warehouse_id: note?.warehouse_id ?? OPTIONAL_SELECT_NONE,
    document_date: note?.document_date ?? todayIsoDate(),
    branch_id: note?.branch_id ?? OPTIONAL_SELECT_NONE,
    currency_id: note?.currency_id ?? OPTIONAL_SELECT_NONE,
    vehicle_number: note?.vehicle_number ?? "",
    driver_name: note?.driver_name ?? "",
    driver_contact: note?.driver_contact ?? "",
    notes: note?.notes ?? "",
    lines:
      lines.length === 0
        ? [emptyDeliveryNoteLine()]
        : lines.map((line) => ({
            sales_order_line_id: line.sales_order_line_id,
            product_id: line.product_id ?? OPTIONAL_SELECT_NONE,
            description: line.description,
            quantity: line.quantity,
            outstanding: line.quantity,
            unit_id: line.unit_id ?? OPTIONAL_SELECT_NONE,
            rate: line.rate,
          })),
  };
}

export function DeliveryNoteForm({
  note,
  disabled = false,
  onSuccess,
}: {
  note: DeliveryNote | null;
  disabled?: boolean;
  onSuccess?: () => void;
}) {
  const can = useCan();
  const router = useRouter();
  const createNote = useCreateDeliveryNote();
  const updateNote = useUpdateDeliveryNote();
  const warehousesQuery = useAllWarehouses();
  const branchesQuery = useAllBranches();
  const currenciesQuery = useAllCurrencies();
  const salesOrdersQuery = useSalesOrders({ status: "CONFIRMED", page_size: 100 });
  const [creating, setCreating] = useState<"warehouse" | "branch" | null>(null);
  const [writeError, setWriteError] = useState<unknown>(null);
  const form = useForm<DeliveryNoteFormValues>({
    resolver: zodResolver(DeliveryNoteFormSchema),
    defaultValues: toFormValues(note),
  });
  const pending = createNote.isPending || updateNote.isPending;
  useDirtyFormGuard(!disabled && form.formState.isDirty);
  const salesOrderId = useWatch({ control: form.control, name: "sales_order_id" });
  const deliverableQuery = useSalesOrderDeliverableLines(
    optionalUuid(salesOrderId),
    !note && Boolean(optionalUuid(salesOrderId)),
  );
  const { fields } = useFieldArray({ control: form.control, name: "lines" });
  const watchedLines = useWatch({ control: form.control, name: "lines" });

  useEffect(() => {
    form.reset(toFormValues(note));
  }, [form, note]);

  useEffect(() => {
    if (note || !deliverableQuery.data) {
      return;
    }
    const outstanding = deliverableQuery.data.filter((line) => Number(line.outstanding) > 0);
    form.setValue(
      "lines",
      outstanding.length === 0
        ? [emptyDeliveryNoteLine()]
        : outstanding.map((line) => ({
            sales_order_line_id: line.sales_order_line_id,
            product_id: line.product_id ?? OPTIONAL_SELECT_NONE,
            description: line.description,
            quantity: line.outstanding,
            outstanding: line.outstanding,
            unit_id: line.unit_id ?? OPTIONAL_SELECT_NONE,
            rate: line.rate,
          })),
    );
  }, [deliverableQuery.data, form, note]);

  async function onSubmit(values: DeliveryNoteFormValues) {
    const lines = values.lines.filter((line) => !isBlankDeliveryNoteLine(line)).map(toLineInput);
    const payload = {
      warehouse_id: optionalUuid(values.warehouse_id),
      document_date: values.document_date,
      branch_id: optionalUuid(values.branch_id),
      currency_id: optionalUuid(values.currency_id),
      vehicle_number: emptyToNull(values.vehicle_number),
      driver_name: emptyToNull(values.driver_name),
      driver_contact: emptyToNull(values.driver_contact),
      notes: emptyToNull(values.notes),
      lines,
    };
    setWriteError(null);
    try {
      if (note) {
        const update: DeliveryNoteUpdateRequest = payload;
        await updateNote.mutateAsync({ id: note.id, values: update, version: note.version });
        toast.success("Delivery note saved");
        onSuccess?.();
      } else {
        const create: DeliveryNoteCreateRequest = {
          ...payload,
          sales_order_id: values.sales_order_id,
        };
        const created = await createNote.mutateAsync(create);
        toast.success("Delivery note created");
        router.push(`/delivery-notes/${created.id}`);
      }
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

  const warehouses = warehousesQuery.data ?? [];
  const branches = branchesQuery.data ?? [];
  const currencies = currenciesQuery.data ?? [];
  const salesOrders = salesOrdersQuery.data?.data ?? [];

  return (
    <Form {...form}>
      <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(onSubmit)}>
        <StockWriteAlert error={writeError} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="sales_order_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sales order</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled || Boolean(note)}
                  placeholder="Select sales order"
                  searchPlaceholder="Search sales order…"
                  options={salesOrders.map((order) => ({
                    value: order.id,
                    label: salesOrderDisplayNumber(order) ?? order.id,
                  }))}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="warehouse_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Warehouse</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled}
                  placeholder="Use sales order warehouse"
                  searchPlaceholder="Search warehouse…"
                  createLabel="Create warehouse"
                  onCreate={can(warehousePermissions.create) ? () => setCreating("warehouse") : undefined}
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
                  <Input type="date" disabled={disabled} {...field} />
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
                  disabled={disabled}
                  placeholder="Branch"
                  searchPlaceholder="Search branch…"
                  createLabel="Create branch"
                  onCreate={can(branchPermissions.create) ? () => setCreating("branch") : undefined}
                  options={[
                    { value: OPTIONAL_SELECT_NONE, label: "No branch" },
                    ...branches.map((branch) => ({
                      value: branch.id,
                      label: branch.name,
                    })),
                  ]}
                />
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
                  disabled={disabled}
                  placeholder="Use sales order currency"
                  searchPlaceholder="Search currency…"
                  options={[
                    { value: OPTIONAL_SELECT_NONE, label: "Use sales order currency" },
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
            name="vehicle_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vehicle number</FormLabel>
                <FormControl>
                  <Input disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="driver_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Driver name</FormLabel>
                <FormControl>
                  <Input disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="driver_contact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Driver contact</FormLabel>
                <FormControl>
                  <Input disabled={disabled} {...field} />
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
                <Textarea disabled={disabled} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead className="w-32">Qty</TableHead>
                <TableHead className="w-32">Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, index) => (
                <TableRow key={field.id}>
                  <TableCell>{watchedLines?.[index]?.description || "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatDecimal(watchedLines?.[index]?.outstanding || "0")}
                  </TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`lines.${index}.quantity`}
                      render={({ field: qtyField }) => (
                        <FormItem>
                          <FormControl>
                            <Input disabled={disabled} inputMode="decimal" {...qtyField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`lines.${index}.rate`}
                      render={({ field: rateField }) => (
                        <FormItem>
                          <FormControl>
                            <Input disabled={disabled} inputMode="decimal" {...rateField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </table>
        </div>
        {disabled ? null : (
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {note ? "Save delivery note" : "Create delivery note"}
            </Button>
          </div>
        )}
      </form>
      <WarehouseFormDialog
        open={creating === "warehouse"}
        nested
        onCreated={(entity) => form.setValue("warehouse_id", entity.id)}
        onOpenChange={(open) => {
          if (!open) setCreating(null);
        }}
      />
      <BranchFormDialog
        open={creating === "branch"}
        nested
        branch={null}
        onCreated={(entity) => form.setValue("branch_id", entity.id)}
        onOpenChange={(open) => {
          if (!open) setCreating(null);
        }}
      />
    </Form>
  );
}
