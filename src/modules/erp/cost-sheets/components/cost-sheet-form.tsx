"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { useActiveChargeTypes } from "@/modules/erp/accounting/charge-types/queries";
import {
  CostSheetLinesEditor,
  emptyCostSheetLine,
} from "@/modules/erp/cost-sheets/components/cost-sheet-lines-editor";
import { useCreateCostSheet, useUpdateCostSheet } from "@/modules/erp/cost-sheets/mutations";
import {
  COST_SHEET_TYPES,
  type CostSheet,
  type CostSheetType,
} from "@/modules/erp/cost-sheets/schemas";
import { CustomerFormDialog } from "@/modules/crm/customers/components/customer-form-dialog";
import { customerPermissions } from "@/modules/crm/customers/permissions";
import { useAllCustomers } from "@/modules/crm/customers/queries";
import { CurrencyFormDialog } from "@/modules/erp/currencies/components/currency-form-dialog";
import { currencyPermissions } from "@/modules/erp/currencies/permissions";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import {
  LANDED_COST_ALLOCATION_METHOD_LABELS,
  LANDED_COST_ALLOCATION_METHODS,
} from "@/modules/erp/landed-costs/schemas";
import { useProformaInvoices } from "@/modules/erp/proforma-invoices/queries";
import { proformaInvoiceDisplayNumber } from "@/modules/erp/proforma-invoices/schemas";
import { usePurchaseOrders } from "@/modules/erp/purchase-orders/queries";
import { purchaseOrderDisplayNumber } from "@/modules/erp/purchase-orders/schemas";
import { SupplierFormDialog } from "@/modules/erp/suppliers/components/supplier-form-dialog";
import { supplierPermissions } from "@/modules/erp/suppliers/permissions";
import { useAllSuppliers } from "@/modules/erp/suppliers/queries";
import { useShipments } from "@/modules/inventory-management/shipments/queries";
import { shipmentDisplayNumber } from "@/modules/inventory-management/shipments/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { MasterSelect } from "@/shared/components/form/master-select";
import { DecimalInput } from "@/shared/components/form/decimal-input";
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
import { useBaseCurrency } from "@/shared/hooks/use-base-currency";
import { useDefaultDocumentCurrency } from "@/shared/hooks/use-default-document-currency";
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";
import { useCan } from "@/shared/providers/session-provider";

const selectedMaster = (message: string) =>
  z
    .string()
    .min(1)
    .refine((value) => value !== OPTIONAL_SELECT_NONE, message);

const formSchema = z
  .object({
    sheet_type: z.enum(COST_SHEET_TYPES),
    document_date: z.string().min(1, "Date is required"),
    currency_id: selectedMaster("Select a currency"),
    supplier_id: z.string().min(1),
    customer_id: z.string().min(1),
    shipment_id: z.string().min(1),
    purchase_order_id: z.string().min(1),
    proforma_invoice_id: z.string().min(1),
    allocation_method: z.enum(LANDED_COST_ALLOCATION_METHODS),
    incoterm: z.string().optional(),
    port_of_loading: z.string().optional(),
    port_of_discharge: z.string().optional(),
    notes: z.string().optional(),
    lines: z
      .array(
        z.object({
          product_id: selectedMaster("Select a product"),
          unit_id: selectedMaster("Select a unit"),
          quantity: z.string().min(1, "Quantity is required"),
          base_rate: z.string().min(1, "Base rate is required"),
          target_selling_price: z.string().optional(),
          goods_receipt_line_id: z.string().optional(),
        }),
      )
      .min(1, "Add at least one line"),
  })
  .superRefine((values, ctx) => {
    if (values.sheet_type === "IMPORT" && values.supplier_id === OPTIONAL_SELECT_NONE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["supplier_id"],
        message: "Select a supplier",
      });
    }
    if (values.sheet_type === "EXPORT" && values.customer_id === OPTIONAL_SELECT_NONE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customer_id"],
        message: "Select a customer",
      });
    }
    if (
      values.sheet_type === "OTHER" &&
      values.supplier_id === OPTIONAL_SELECT_NONE &&
      values.customer_id === OPTIONAL_SELECT_NONE
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["supplier_id"],
        message: "Select a supplier or customer",
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;
export type CostSheetFormValues = FormValues;

type Props = {
  sheet: CostSheet | null;
};

type CreatingMaster = "currency" | "supplier" | "customer" | null;

function parseSheetType(value: string | null): CostSheetType {
  return COST_SHEET_TYPES.includes(value as CostSheetType) ? (value as CostSheetType) : "IMPORT";
}

function optionalUuid(value: string): string | undefined {
  return !value || value === OPTIONAL_SELECT_NONE ? undefined : value;
}

function emptyToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function CostSheetForm({ sheet }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const can = useCan();
  const { baseCurrencyId } = useBaseCurrency();
  const currenciesQuery = useAllCurrencies();
  const suppliersQuery = useAllSuppliers();
  const customersQuery = useAllCustomers();
  const shipmentsQuery = useShipments({ page_size: 100 });
  const chargeTypesQuery = useActiveChargeTypes();
  const createMutation = useCreateCostSheet();
  const updateMutation = useUpdateCostSheet(sheet?.id ?? "");
  const [creating, setCreating] = useState<CreatingMaster>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const initialSheetType =
    sheet?.sheet_type ?? parseSheetType(searchParams.get("sheet_type")) ?? "IMPORT";
  const isEdit = Boolean(sheet);
  const disabled = sheet?.status !== "DRAFT" && sheet !== null;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sheet_type: initialSheetType,
      document_date: sheet?.document_date ?? new Date().toISOString().slice(0, 10),
      currency_id: sheet?.currency_id ?? baseCurrencyId ?? OPTIONAL_SELECT_NONE,
      supplier_id: sheet?.supplier_id ?? OPTIONAL_SELECT_NONE,
      customer_id: sheet?.customer_id ?? OPTIONAL_SELECT_NONE,
      shipment_id: sheet?.shipment_id ?? OPTIONAL_SELECT_NONE,
      purchase_order_id: sheet?.purchase_order_id ?? OPTIONAL_SELECT_NONE,
      proforma_invoice_id: sheet?.proforma_invoice_id ?? OPTIONAL_SELECT_NONE,
      allocation_method: sheet?.allocation_method ?? "VALUE",
      incoterm: sheet?.incoterm ?? "",
      port_of_loading: sheet?.port_of_loading ?? "",
      port_of_discharge: sheet?.port_of_discharge ?? "",
      notes: sheet?.notes ?? "",
      lines: sheet?.lines.length
        ? sheet.lines.map((line) => ({
            product_id: line.product_id,
            unit_id: line.unit_id,
            quantity: line.quantity,
            base_rate: line.base_rate,
            target_selling_price: line.target_selling_price ?? "",
            goods_receipt_line_id: line.goods_receipt_line_id ?? OPTIONAL_SELECT_NONE,
          }))
        : [emptyCostSheetLine()],
    },
  });
  useDefaultDocumentCurrency(form, isEdit, baseCurrencyId);
  useDirtyFormGuard(form.formState.isDirty && !disabled);

  const sheetType = form.watch("sheet_type");
  const supplierId = optionalUuid(form.watch("supplier_id"));
  const customerId = optionalUuid(form.watch("customer_id"));
  const purchaseOrdersQuery = usePurchaseOrders(
    { page_size: 100, supplier_id: supplierId },
    Boolean(supplierId) || Boolean(sheet?.purchase_order_id),
  );
  const proformasQuery = useProformaInvoices(
    { page_size: 100, customer_id: customerId },
    Boolean(customerId) || Boolean(sheet?.proforma_invoice_id),
  );
  const currencies = currenciesQuery.data ?? [];
  const suppliers = suppliersQuery.data ?? [];
  const customers = customersQuery.data ?? [];
  const shipments = shipmentsQuery.data?.data ?? [];
  const purchaseOrders = purchaseOrdersQuery.data?.data ?? [];
  const proformas = proformasQuery.data?.data ?? [];
  const showSupplier = sheetType === "IMPORT" || sheetType === "OTHER";
  const showCustomer = sheetType === "EXPORT" || sheetType === "OTHER";
  const showPurchaseOrder = sheetType === "IMPORT" || sheetType === "OTHER";
  const showProforma = sheetType === "EXPORT" || sheetType === "OTHER";
  const showGrnLink = sheetType === "IMPORT" || sheetType === "OTHER";

  const chargeTypes = useMemo(() => {
    const rows = chargeTypesQuery.data ?? [];
    if (sheetType === "OTHER") {
      return rows;
    }
    return rows.filter(
      (row) =>
        row.applies_to === "BOTH" ||
        row.applies_to === sheetType ||
        (sheetType === "IMPORT" && row.applies_to === "IMPORT") ||
        (sheetType === "EXPORT" && row.applies_to === "EXPORT"),
    );
  }, [chargeTypesQuery.data, sheetType]);

  const baseChargeAmounts = useMemo(() => {
    const next: Record<string, string> = {};
    for (const charge of chargeTypes) {
      const existing = sheet?.charges.find((row) => row.charge_type_id === charge.id);
      next[charge.id] = existing?.estimated_amount ?? "0";
    }
    return next;
  }, [chargeTypes, sheet?.charges]);

  const [chargeEdits, setChargeEdits] = useState<Record<string, string>>({});

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    const currencyId = optionalUuid(values.currency_id);
    if (!currencyId) {
      form.setError("currency_id", { message: "Select a currency" });
      return;
    }
    const payload = {
      sheet_type: values.sheet_type,
      document_date: values.document_date,
      currency_id: currencyId,
      supplier_id: optionalUuid(values.supplier_id),
      customer_id: optionalUuid(values.customer_id),
      shipment_id: optionalUuid(values.shipment_id),
      purchase_order_id: optionalUuid(values.purchase_order_id),
      proforma_invoice_id: optionalUuid(values.proforma_invoice_id),
      allocation_method: values.allocation_method,
      incoterm: emptyToUndefined(values.incoterm),
      port_of_loading: emptyToUndefined(values.port_of_loading),
      port_of_discharge: emptyToUndefined(values.port_of_discharge),
      notes: emptyToUndefined(values.notes),
      lines: values.lines.map((line) => ({
        product_id: line.product_id,
        unit_id: line.unit_id,
        quantity: line.quantity,
        base_rate: line.base_rate,
        target_selling_price: emptyToUndefined(line.target_selling_price),
        goods_receipt_line_id: optionalUuid(line.goods_receipt_line_id ?? OPTIONAL_SELECT_NONE),
      })),
      charges: chargeTypes
        .map((charge) => ({
          charge_type_id: charge.id,
          estimated_amount: chargeEdits[charge.id] ?? baseChargeAmounts[charge.id] ?? "0",
        }))
        .filter((row) => row.estimated_amount && row.estimated_amount !== "0"),
    };
    try {
      if (sheet) {
        const updated = await updateMutation.mutateAsync({
          values: payload,
          options: { version: sheet.version },
        });
        toast.success("Cost sheet saved");
        router.push(`/cost-sheets/${updated.id}`);
      } else {
        const created = await createMutation.mutateAsync(payload);
        toast.success("Cost sheet created");
        router.push(`/cost-sheets/${created.id}`);
      }
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="sheet_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sheet type</FormLabel>
                <Select
                  disabled={disabled || sheet !== null}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="IMPORT">Import</SelectItem>
                    <SelectItem value="EXPORT">Export</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="document_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" disabled={disabled} {...field} />
                </FormControl>
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
                  placeholder="Select a currency"
                  searchPlaceholder="Search currency…"
                  createLabel="Create currency"
                  onCreate={
                    can(currencyPermissions.create) ? () => setCreating("currency") : undefined
                  }
                  options={[
                    { value: OPTIONAL_SELECT_NONE, label: "None" },
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
          {showSupplier ? (
            <FormField
              control={form.control}
              name="supplier_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <MasterSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={disabled || suppliersQuery.isLoading}
                    placeholder="Select a supplier"
                    searchPlaceholder="Search supplier…"
                    createLabel="Create supplier"
                    onCreate={
                      can(supplierPermissions.create) ? () => setCreating("supplier") : undefined
                    }
                    options={[
                      { value: OPTIONAL_SELECT_NONE, label: "None" },
                      ...suppliers.map((supplier) => ({
                        value: supplier.id,
                        label: supplier.name,
                      })),
                    ]}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}
          {showCustomer ? (
            <FormField
              control={form.control}
              name="customer_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <MasterSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={disabled || customersQuery.isLoading}
                    placeholder="Select a customer"
                    searchPlaceholder="Search customer…"
                    createLabel="Create customer"
                    onCreate={
                      can(customerPermissions.create) ? () => setCreating("customer") : undefined
                    }
                    options={[
                      { value: OPTIONAL_SELECT_NONE, label: "None" },
                      ...customers.map((customer) => ({
                        value: customer.id,
                        label: customer.name,
                      })),
                    ]}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}
          <FormField
            control={form.control}
            name="shipment_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shipment</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled || shipmentsQuery.isLoading}
                  placeholder="None"
                  searchPlaceholder="Search shipment…"
                  options={[
                    { value: OPTIONAL_SELECT_NONE, label: "None" },
                    ...shipments.map((shipment) => ({
                      value: shipment.id,
                      label: shipmentDisplayNumber(shipment) ?? shipment.document_number,
                    })),
                  ]}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          {showPurchaseOrder ? (
            <FormField
              control={form.control}
              name="purchase_order_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase order</FormLabel>
                  <MasterSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={disabled || purchaseOrdersQuery.isLoading}
                    placeholder={supplierId ? "Optional" : "Select a supplier first"}
                    searchPlaceholder="Search purchase order…"
                    options={[
                      { value: OPTIONAL_SELECT_NONE, label: "None" },
                      ...purchaseOrders.map((order) => ({
                        value: order.id,
                        label: purchaseOrderDisplayNumber(order) ?? order.document_number,
                      })),
                    ]}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}
          {showProforma ? (
            <FormField
              control={form.control}
              name="proforma_invoice_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proforma invoice</FormLabel>
                  <MasterSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={disabled || proformasQuery.isLoading}
                    placeholder={customerId ? "Optional" : "Select a customer first"}
                    searchPlaceholder="Search proforma…"
                    options={[
                      { value: OPTIONAL_SELECT_NONE, label: "None" },
                      ...proformas.map((invoice) => ({
                        value: invoice.id,
                        label: proformaInvoiceDisplayNumber(invoice) ?? invoice.document_number,
                      })),
                    ]}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}
          <FormField
            control={form.control}
            name="allocation_method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Allocation method</FormLabel>
                <Select disabled={disabled} value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {LANDED_COST_ALLOCATION_METHODS.map((method) => (
                      <SelectItem key={method} value={method}>
                        {LANDED_COST_ALLOCATION_METHOD_LABELS[method]}
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
            name="incoterm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Incoterm</FormLabel>
                <FormControl>
                  <Input disabled={disabled} maxLength={10} placeholder="e.g. CIF" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="port_of_loading"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Port of loading</FormLabel>
                <FormControl>
                  <Input disabled={disabled} maxLength={120} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="port_of_discharge"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Port of discharge</FormLabel>
                <FormControl>
                  <Input disabled={disabled} maxLength={120} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Lines</p>
          <CostSheetLinesEditor
            form={form}
            disabled={disabled}
            showTargetSellingPrice={sheetType === "EXPORT" || sheetType === "OTHER"}
            showGrnLink={showGrnLink}
            supplierId={supplierId ?? null}
          />
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Charges (estimated)</h3>
          <div className="grid gap-2 md:grid-cols-2">
            {chargeTypes.map((charge) => (
              <FormItem key={charge.id}>
                <FormLabel>{charge.name}</FormLabel>
                <FormControl>
                  <DecimalInput
                    kind="money"
                    disabled={disabled}
                    value={chargeEdits[charge.id] ?? baseChargeAmounts[charge.id] ?? "0"}
                    onChange={(event) =>
                      setChargeEdits((current) => ({
                        ...current,
                        [charge.id]: event.target.value,
                      }))
                    }
                  />
                </FormControl>
              </FormItem>
            ))}
          </div>
        </div>
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea disabled={disabled} rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {!disabled ? (
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {sheet ? "Save changes" : "Create cost sheet"}
          </Button>
        ) : null}
      </form>
      <CurrencyFormDialog
        open={creating === "currency"}
        currency={null}
        nested
        onCreated={(entity) => {
          form.setValue("currency_id", entity.id);
        }}
        onOpenChange={(open) => setCreating(open ? "currency" : null)}
      />
      <SupplierFormDialog
        open={creating === "supplier"}
        supplier={null}
        nested
        onCreated={(entity) => {
          form.setValue("supplier_id", entity.id);
        }}
        onOpenChange={(open) => setCreating(open ? "supplier" : null)}
      />
      <CustomerFormDialog
        open={creating === "customer"}
        customer={null}
        nested
        onCreated={(entity) => {
          form.setValue("customer_id", entity.id);
        }}
        onOpenChange={(open) => setCreating(open ? "customer" : null)}
      />
    </Form>
  );
}
