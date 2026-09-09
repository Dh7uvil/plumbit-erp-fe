"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import {
  StockWriteAlert,
  isStockWriteAlertError,
} from "@/modules/erp/period-lock/components/stock-write-alert";
import { usePurchaseOrders } from "@/modules/erp/purchase-orders/queries";
import { SupplierFormDialog } from "@/modules/erp/suppliers/components/supplier-form-dialog";
import { supplierPermissions } from "@/modules/erp/suppliers/permissions";
import { useAllSuppliers } from "@/modules/erp/suppliers/queries";
import {
  useCreateGoodsReceipt,
  useUpdateGoodsReceipt,
} from "@/modules/inventory-management/goods-receipts/mutations";
import {
  emptyGoodsReceiptLine,
  GoodsReceiptFormSchema,
  isBlankGoodsReceiptLine,
  type GoodsReceipt,
  type GoodsReceiptCreateRequest,
  type GoodsReceiptFormValues,
  type GoodsReceiptLineFormValues,
  type GoodsReceiptLineInput,
  type GoodsReceiptUpdateRequest,
} from "@/modules/inventory-management/goods-receipts/schemas";
import { WarehouseFormDialog } from "@/modules/inventory-management/warehouses/components/warehouse-form-dialog";
import { warehousePermissions } from "@/modules/inventory-management/warehouses/permissions";
import { useAllWarehouses } from "@/modules/inventory-management/warehouses/queries";
import { BranchFormDialog } from "@/modules/users-management/branches/components/branch-form-dialog";
import { branchPermissions } from "@/modules/users-management/branches/permissions";
import { useAllBranches } from "@/modules/users-management/branches/queries";
import { emptyToNull } from "@/modules/users-management/tenants/schemas";
import { getErrorMessage, isApiError } from "@/shared/api/errors";
import { DocumentLinesEditor } from "@/shared/components/document/document-lines-editor";
import { MasterSelect } from "@/shared/components/form/master-select";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
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
import { formatDecimal } from "@/shared/lib/format";
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

function toLineInput(line: GoodsReceiptLineFormValues): GoodsReceiptLineInput {
  return {
    purchase_order_line_id: optionalUuid(line.purchase_order_line_id),
    product_id: optionalUuid(line.product_id),
    supplier_product_id: optionalUuid(line.supplier_product_id),
    supplier_sku: emptyToNull(line.supplier_sku),
    description: emptyToNull(line.description),
    quantity: line.quantity,
    unit_id: optionalUuid(line.unit_id),
    rate: emptyToNull(line.rate) ?? "0",
    net_weight: emptyToNull(line.net_weight),
    gross_weight: emptyToNull(line.gross_weight),
  };
}

function toFormLines(receipt: GoodsReceipt | null): GoodsReceiptLineFormValues[] {
  const lines = receipt?.lines ?? [];
  if (lines.length === 0) {
    return [emptyGoodsReceiptLine()];
  }
  return lines.map((line) => ({
    ...emptyGoodsReceiptLine(),
    product_id: line.product_id ?? OPTIONAL_SELECT_NONE,
    supplier_product_id: line.supplier_product_id ?? OPTIONAL_SELECT_NONE,
    supplier_sku: line.supplier_sku ?? "",
    description: line.description,
    quantity: line.quantity,
    unit_id: line.unit_id ?? OPTIONAL_SELECT_NONE,
    rate: line.rate,
    net_weight: line.net_weight ?? "",
    gross_weight: line.gross_weight ?? "",
    purchase_order_line_id: line.purchase_order_line_id ?? "",
  }));
}

function toFormValues(receipt: GoodsReceipt | null): GoodsReceiptFormValues {
  return {
    supplier_id: receipt?.supplier_id ?? OPTIONAL_SELECT_NONE,
    warehouse_id: receipt?.warehouse_id ?? OPTIONAL_SELECT_NONE,
    document_date: receipt?.document_date ?? todayIsoDate(),
    purchase_order_id: receipt?.purchase_order_id ?? OPTIONAL_SELECT_NONE,
    branch_id: receipt?.branch_id ?? OPTIONAL_SELECT_NONE,
    currency_id: receipt?.currency_id ?? OPTIONAL_SELECT_NONE,
    supplier_invoice_number: receipt?.supplier_invoice_number ?? "",
    delivery_challan_number: receipt?.delivery_challan_number ?? "",
    bill_of_entry_number: receipt?.bill_of_entry_number ?? "",
    bill_of_entry_date: receipt?.bill_of_entry_date ?? "",
    container_number: receipt?.container_number ?? "",
    bl_number: receipt?.bl_number ?? "",
    notes: receipt?.notes ?? "",
    lines: toFormLines(receipt),
  };
}

export function GoodsReceiptForm({
  receipt,
  disabled = false,
  onSuccess,
}: {
  receipt: GoodsReceipt | null;
  disabled?: boolean;
  onSuccess?: () => void;
}) {
  const can = useCan();
  const router = useRouter();
  const isEdit = Boolean(receipt);
  const createReceipt = useCreateGoodsReceipt();
  const updateReceipt = useUpdateGoodsReceipt();
  const suppliersQuery = useAllSuppliers();
  const warehousesQuery = useAllWarehouses();
  const branchesQuery = useAllBranches();
  const currenciesQuery = useAllCurrencies();
  const issuedOrdersQuery = usePurchaseOrders({ status: "ISSUED", page_size: 100 });
  const [creating, setCreating] = useState<"supplier" | "warehouse" | "branch" | null>(null);
  const [writeError, setWriteError] = useState<unknown>(null);
  const form = useForm<GoodsReceiptFormValues>({
    resolver: zodResolver(GoodsReceiptFormSchema),
    defaultValues: toFormValues(receipt),
  });
  const pending = createReceipt.isPending || updateReceipt.isPending;
  useDirtyFormGuard(!disabled && form.formState.isDirty);
  const supplierId = useWatch({ control: form.control, name: "supplier_id" });
  const skuUnmapped = isApiError(writeError) && writeError.code === "SUPPLIER_SKU_NOT_MAPPED";

  useEffect(() => {
    form.reset(toFormValues(receipt));
  }, [form, receipt]);

  const issuedOrders = useMemo(
    () => (issuedOrdersQuery.data?.data ?? []).filter((order) => order.receipt_status !== "RECEIVED"),
    [issuedOrdersQuery.data?.data],
  );

  async function onSubmit(values: GoodsReceiptFormValues) {
    const lines = values.lines.filter((line) => !isBlankGoodsReceiptLine(line)).map(toLineInput);
    const payload = {
      warehouse_id: values.warehouse_id,
      document_date: values.document_date,
      branch_id: optionalUuid(values.branch_id),
      currency_id: optionalUuid(values.currency_id),
      supplier_invoice_number: emptyToNull(values.supplier_invoice_number),
      delivery_challan_number: emptyToNull(values.delivery_challan_number),
      bill_of_entry_number: emptyToNull(values.bill_of_entry_number),
      bill_of_entry_date: emptyToNull(values.bill_of_entry_date),
      container_number: emptyToNull(values.container_number),
      bl_number: emptyToNull(values.bl_number),
      notes: emptyToNull(values.notes),
      lines,
    };
    setWriteError(null);
    try {
      if (receipt) {
        const update: GoodsReceiptUpdateRequest = payload;
        await updateReceipt.mutateAsync({
          id: receipt.id,
          values: update,
          version: receipt.version,
        });
        toast.success("Goods receipt saved");
        onSuccess?.();
      } else {
        const create: GoodsReceiptCreateRequest = {
          ...payload,
          supplier_id: values.supplier_id,
          purchase_order_id: optionalUuid(values.purchase_order_id),
        };
        const created = await createReceipt.mutateAsync(create);
        toast.success("Goods receipt created");
        router.push(`/goods-receipts/${created.id}`);
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

  const suppliers = suppliersQuery.data ?? [];
  const warehouses = warehousesQuery.data ?? [];
  const branches = branchesQuery.data ?? [];
  const currencies = currenciesQuery.data ?? [];

  return (
    <Form {...form}>
      <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(onSubmit)}>
        <StockWriteAlert
          periodLocked={Boolean(receipt?.period_locked)}
          error={skuUnmapped ? undefined : writeError}
        />
        {skuUnmapped ? (
          <Alert variant="destructive">
            <AlertDescription>
              {getErrorMessage(writeError)} Map the SKU in the{" "}
              <Link href="/supplier-products" className="underline underline-offset-4">
                supplier catalog
              </Link>
              . A price will not be invented.
            </AlertDescription>
          </Alert>
        ) : null}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <FormField
            control={form.control}
            name="supplier_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled || isEdit || suppliersQuery.isLoading}
                  placeholder="Select supplier"
                  searchPlaceholder="Search supplier…"
                  createLabel="Create supplier"
                  onCreate={can(supplierPermissions.create) ? () => setCreating("supplier") : undefined}
                  options={suppliers.map((supplier) => ({
                    value: supplier.id,
                    label: supplier.name,
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
                  disabled={disabled || warehousesQuery.isLoading}
                  placeholder="Select warehouse"
                  searchPlaceholder="Search warehouse…"
                  createLabel="Create warehouse"
                  onCreate={can(warehousePermissions.create) ? () => setCreating("warehouse") : undefined}
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
            name="purchase_order_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase order</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled || isEdit || issuedOrdersQuery.isLoading}
                  placeholder="Direct receive"
                  searchPlaceholder="Search purchase order…"
                  options={[
                    { value: OPTIONAL_SELECT_NONE, label: "Direct receive" },
                    ...issuedOrders.map((order) => ({
                      value: order.id,
                      label: order.document_number || order.id,
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
                  disabled={disabled || currenciesQuery.isLoading}
                  placeholder="Default"
                  searchPlaceholder="Search currency…"
                  options={[
                    { value: OPTIONAL_SELECT_NONE, label: "Default" },
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
          <FormField
            control={form.control}
            name="supplier_invoice_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier invoice</FormLabel>
                <FormControl>
                  <Input disabled={disabled} maxLength={80} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="delivery_challan_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Delivery challan</FormLabel>
                <FormControl>
                  <Input disabled={disabled} maxLength={80} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="container_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Container</FormLabel>
                <FormControl>
                  <Input disabled={disabled} maxLength={80} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bl_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bill of lading</FormLabel>
                <FormControl>
                  <Input disabled={disabled} maxLength={80} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bill_of_entry_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bill of entry</FormLabel>
                <FormControl>
                  <Input disabled={disabled} maxLength={80} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bill_of_entry_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bill of entry date</FormLabel>
                <FormControl>
                  <Input type="date" disabled={disabled} {...field} />
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
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Lines</p>
          <DocumentLinesEditor
            form={form}
            disabled={disabled}
            productSide="purchase"
            lineMode="receive"
            supplierCatalog={{ supplierId: optionalUuid(supplierId) }}
          />
        </div>
        {receipt?.is_posted && receipt.lines.length > 0 ? (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full caption-bottom text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-3 py-2 text-left font-medium">Line</th>
                  <th className="px-3 py-2 text-right font-medium">Received</th>
                  <th className="px-3 py-2 text-right font-medium">Accepted</th>
                  <th className="px-3 py-2 text-right font-medium">Rejected</th>
                  <th className="px-3 py-2 text-right font-medium">On hold</th>
                </tr>
              </thead>
              <tbody>
                {receipt.lines.map((line) => (
                  <tr key={line.id} className="border-b last:border-0">
                    <td className="px-3 py-2">{line.description}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatDecimal(line.quantity)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatDecimal(line.qty_accepted)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatDecimal(line.qty_rejected)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatDecimal(line.qty_on_hold)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        {!disabled ? (
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {isEdit ? "Save Changes" : "Create goods receipt"}
            </Button>
          </div>
        ) : null}
      </form>
      <SupplierFormDialog
        open={creating === "supplier"}
        supplier={null}
        nested
        onCreated={(entity) => form.setValue("supplier_id", entity.id)}
        onOpenChange={(open) => setCreating(open ? "supplier" : null)}
      />
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
