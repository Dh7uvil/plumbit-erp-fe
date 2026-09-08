"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { ContactFormDialog } from "@/modules/crm/contacts/components/contact-form-dialog";
import { contactPermissions } from "@/modules/crm/contacts/permissions";
import { useAllContacts } from "@/modules/crm/contacts/queries";
import { SupplierFormDialog } from "@/modules/erp/suppliers/components/supplier-form-dialog";
import { supplierPermissions } from "@/modules/erp/suppliers/permissions";
import { useAllSuppliers } from "@/modules/erp/suppliers/queries";
import { PaymentTermFormDialog } from "@/modules/erp/accounting/payment-terms/components/payment-term-form-dialog";
import { paymentTermPermissions } from "@/modules/erp/accounting/payment-terms/permissions";
import { useAllPaymentTerms } from "@/modules/erp/accounting/payment-terms/queries";
import { TermsTemplateFormDialog } from "@/modules/erp/accounting/terms-templates/components/terms-template-form-dialog";
import { termsTemplatePermissions } from "@/modules/erp/accounting/terms-templates/permissions";
import { useAllTermsTemplates } from "@/modules/erp/accounting/terms-templates/queries";
import { CurrencyFormDialog } from "@/modules/erp/currencies/components/currency-form-dialog";
import { currencyPermissions } from "@/modules/erp/currencies/permissions";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import {
  emptyPurchaseOrderLine,
  PurchaseOrderLinesEditor,
} from "@/modules/erp/purchase-orders/components/purchase-order-lines-editor";
import { PurchaseOrderTotalsPanel } from "@/modules/erp/purchase-orders/components/purchase-order-totals-panel";
import {
  useCreatePurchaseOrder,
  useUpdatePurchaseOrder,
} from "@/modules/erp/purchase-orders/mutations";
import { usePurchaseOrderComposeDefaults } from "@/modules/erp/purchase-orders/queries";
import {
  DISCOUNT_TYPE_LABELS,
  DISCOUNT_TYPES,
  isBlankPurchaseOrderLine,
  PLACE_OF_SUPPLY_LABELS,
  PLACES_OF_SUPPLY,
  PurchaseOrderFormSchema,
  TAX_TREATMENT_LABELS,
  type DiscountType,
  type PlaceOfSupply,
  type PurchaseOrder,
  type PurchaseOrderCreateRequest,
  type PurchaseOrderFormValues,
  type PurchaseOrderLineFormValues,
  type PurchaseOrderLineInput,
  type PurchaseOrderUpdateRequest,
} from "@/modules/erp/purchase-orders/schemas";
import { BranchFormDialog } from "@/modules/users-management/branches/components/branch-form-dialog";
import { branchPermissions } from "@/modules/users-management/branches/permissions";
import { useAllBranches } from "@/modules/users-management/branches/queries";
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

type ComposeField =
  | "currency_id"
  | "payment_terms_id"
  | "contact_id"
  | "warehouse_id"
  | "place_of_supply"
  | "terms_and_conditions";

function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function optionalUuid(value: string): string | null {
  return !value || value === OPTIONAL_SELECT_NONE ? null : value;
}

function optionalDiscountType(value: string): DiscountType | null {
  return DISCOUNT_TYPES.includes(value as DiscountType) ? (value as DiscountType) : null;
}

function optionalPlaceOfSupply(value: string): PlaceOfSupply | null {
  return PLACES_OF_SUPPLY.includes(value as PlaceOfSupply) ? (value as PlaceOfSupply) : null;
}

function toLineInput(line: PurchaseOrderLineFormValues): PurchaseOrderLineInput {
  return {
    product_id: optionalUuid(line.product_id),
    description: emptyToNull(line.description),
    quantity: line.quantity.trim(),
    unit_id: optionalUuid(line.unit_id),
    rate: emptyToNull(line.rate),
    discount_type: optionalDiscountType(line.discount_type),
    discount_value: emptyToNull(line.discount_value),
    tax_id: optionalUuid(line.tax_id),
  };
}

function toFormLines(purchaseOrder: PurchaseOrder | null): PurchaseOrderLineFormValues[] {
  const lines = purchaseOrder?.lines ?? [];
  if (lines.length === 0) {
    return [emptyPurchaseOrderLine()];
  }
  return lines.map((line) => ({
    product_id: line.product_id ?? OPTIONAL_SELECT_NONE,
    description: line.description ?? "",
    quantity: line.quantity,
    unit_id: line.unit_id ?? OPTIONAL_SELECT_NONE,
    rate: line.rate ?? "",
    discount_type: line.discount_type ?? OPTIONAL_SELECT_NONE,
    discount_value: line.discount_value ?? "",
    tax_id: line.tax_id ?? OPTIONAL_SELECT_NONE,
  }));
}

function toFormValues(purchaseOrder: PurchaseOrder | null): PurchaseOrderFormValues {
  return {
    supplier_id: purchaseOrder?.supplier_id ?? OPTIONAL_SELECT_NONE,
    contact_id: purchaseOrder?.contact_id ?? OPTIONAL_SELECT_NONE,
    branch_id: purchaseOrder?.branch_id ?? OPTIONAL_SELECT_NONE,
    warehouse_id: purchaseOrder?.warehouse_id ?? OPTIONAL_SELECT_NONE,
    order_date: purchaseOrder?.order_date ?? todayIsoDate(),
    expected_delivery_date: purchaseOrder?.expected_delivery_date ?? "",
    reference_number: purchaseOrder?.reference_number ?? "",
    currency_id: purchaseOrder?.currency_id ?? OPTIONAL_SELECT_NONE,
    payment_terms_id: purchaseOrder?.payment_terms_id ?? OPTIONAL_SELECT_NONE,
    notes: purchaseOrder?.notes ?? "",
    terms_and_conditions: purchaseOrder?.terms_and_conditions ?? "",
    terms_template_id: OPTIONAL_SELECT_NONE,
    discount_type: purchaseOrder?.discount_type ?? OPTIONAL_SELECT_NONE,
    discount_value: purchaseOrder?.discount_value ?? "",
    shipping_amount: purchaseOrder?.shipping_amount ?? "0",
    adjustment_amount: purchaseOrder?.adjustment_amount ?? "0",
    place_of_supply: purchaseOrder?.place_of_supply ?? OPTIONAL_SELECT_NONE,
    supplier_trn: purchaseOrder?.supplier_trn ?? "",
    tax_treatment: purchaseOrder?.tax_treatment ?? "",
    supplier_address_snapshot: purchaseOrder?.supplier_address_snapshot ?? "",
    deliver_to_snapshot: purchaseOrder?.deliver_to_snapshot ?? "",
    lines: toFormLines(purchaseOrder),
  };
}

function toCreateRequest(values: PurchaseOrderFormValues): PurchaseOrderCreateRequest {
  return {
    supplier_id: values.supplier_id,
    contact_id: optionalUuid(values.contact_id),
    branch_id: optionalUuid(values.branch_id),
    warehouse_id: optionalUuid(values.warehouse_id),
    order_date: emptyToNull(values.order_date),
    expected_delivery_date: emptyToNull(values.expected_delivery_date),
    reference_number: emptyToNull(values.reference_number),
    currency_id: optionalUuid(values.currency_id),
    payment_terms_id: optionalUuid(values.payment_terms_id),
    notes: emptyToNull(values.notes),
    terms_and_conditions: emptyToNull(values.terms_and_conditions),
    terms_template_id: optionalUuid(values.terms_template_id),
    discount_type: optionalDiscountType(values.discount_type),
    discount_value: emptyToNull(values.discount_value),
    shipping_amount: values.shipping_amount.trim() || "0",
    adjustment_amount: values.adjustment_amount.trim() || "0",
    place_of_supply: optionalPlaceOfSupply(values.place_of_supply),
    lines: values.lines.filter((line) => !isBlankPurchaseOrderLine(line)).map(toLineInput),
  };
}

function toUpdateRequest(values: PurchaseOrderFormValues): PurchaseOrderUpdateRequest {
  const created = toCreateRequest(values);
  return {
    contact_id: created.contact_id,
    branch_id: created.branch_id,
    warehouse_id: created.warehouse_id,
    order_date: created.order_date,
    expected_delivery_date: created.expected_delivery_date,
    reference_number: created.reference_number,
    currency_id: created.currency_id,
    payment_terms_id: created.payment_terms_id,
    notes: created.notes,
    terms_and_conditions: created.terms_and_conditions,
    discount_type: created.discount_type,
    discount_value: created.discount_value,
    shipping_amount: created.shipping_amount,
    adjustment_amount: created.adjustment_amount,
    place_of_supply: created.place_of_supply,
    lines: created.lines,
  };
}

export function PurchaseOrderForm({
  purchaseOrder,
  disabled = false,
  onSuccess,
}: {
  purchaseOrder: PurchaseOrder | null;
  disabled?: boolean;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const can = useCan();
  const createPurchaseOrder = useCreatePurchaseOrder();
  const updatePurchaseOrder = useUpdatePurchaseOrder();
  const suppliersQuery = useAllSuppliers();
  const contactsQuery = useAllContacts();
  const currenciesQuery = useAllCurrencies();
  const paymentTermsQuery = useAllPaymentTerms();
  const branchesQuery = useAllBranches();
  const warehousesQuery = useAllWarehouses();
  const termsTemplatesQuery = useAllTermsTemplates(!purchaseOrder);
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState<
    | "supplier"
    | "contact"
    | "branch"
    | "currency"
    | "paymentTerms"
    | "termsTemplate"
    | "warehouse"
    | null
  >(null);
  const dirtyCompose = useRef(new Set<ComposeField>());
  const isEdit = Boolean(purchaseOrder);

  const form = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(PurchaseOrderFormSchema),
    defaultValues: toFormValues(purchaseOrder),
    values: purchaseOrder ? toFormValues(purchaseOrder) : undefined,
  });
  useDirtyFormGuard(form.formState.isDirty && !disabled);

  const supplierId = useWatch({ control: form.control, name: "supplier_id" });
  const selectedSupplierId = optionalUuid(supplierId);
  const composeQuery = usePurchaseOrderComposeDefaults(isEdit ? null : selectedSupplierId);
  const termsTemplateId = useWatch({ control: form.control, name: "terms_template_id" });
  const taxTreatment = useWatch({ control: form.control, name: "tax_treatment" });
  const supplierTrn = useWatch({ control: form.control, name: "supplier_trn" });

  const suppliers = suppliersQuery.data ?? [];
  const contacts = (contactsQuery.data ?? []).filter(
    (contact) => contact.customer_id === selectedSupplierId,
  );
  const currencies = currenciesQuery.data ?? [];
  const paymentTerms = paymentTermsQuery.data ?? [];
  const branches = branchesQuery.data ?? [];
  const warehouses = warehousesQuery.data ?? [];
  const templates = useMemo(() => termsTemplatesQuery.data ?? [], [termsTemplatesQuery.data]);

  useEffect(() => {
    const defaults = composeQuery.data;
    if (!defaults || isEdit) {
      return;
    }
    const dirty = dirtyCompose.current;
    if (!dirty.has("currency_id")) {
      form.setValue("currency_id", defaults.currency_id);
    }
    if (!dirty.has("payment_terms_id")) {
      form.setValue("payment_terms_id", defaults.payment_terms_id ?? OPTIONAL_SELECT_NONE);
    }
    if (!dirty.has("contact_id")) {
      form.setValue("contact_id", defaults.contact_id ?? OPTIONAL_SELECT_NONE);
    }
    if (!dirty.has("warehouse_id")) {
      form.setValue("warehouse_id", defaults.warehouse_id ?? OPTIONAL_SELECT_NONE);
    }
    if (!dirty.has("place_of_supply")) {
      form.setValue("place_of_supply", defaults.place_of_supply);
    }
    if (!dirty.has("terms_and_conditions")) {
      form.setValue("terms_and_conditions", defaults.terms_and_conditions ?? "");
    }
    form.setValue("supplier_trn", defaults.supplier_trn ?? "");
    form.setValue("tax_treatment", defaults.tax_treatment);
    form.setValue("supplier_address_snapshot", defaults.supplier_address_snapshot ?? "");
    form.setValue("deliver_to_snapshot", defaults.deliver_to_snapshot ?? "");
  }, [composeQuery.data, form, isEdit]);

  useEffect(() => {
    if (isEdit) {
      return;
    }
    if (!termsTemplateId || termsTemplateId === OPTIONAL_SELECT_NONE) {
      return;
    }
    if (dirtyCompose.current.has("terms_and_conditions")) {
      return;
    }
    const template = templates.find((item) => item.id === termsTemplateId);
    if (template) {
      form.setValue("terms_and_conditions", template.body);
    }
  }, [form, isEdit, templates, termsTemplateId]);

  function markComposeDirty(field: ComposeField) {
    dirtyCompose.current.add(field);
  }

  async function onSubmit(values: PurchaseOrderFormValues) {
    setFormError(null);
    try {
      if (purchaseOrder) {
        await updatePurchaseOrder.mutateAsync({
          id: purchaseOrder.id,
          values: toUpdateRequest(values),
          version: purchaseOrder.version,
        });
        toast.success("Purchase order saved");
        onSuccess?.();
      } else {
        const created = await createPurchaseOrder.mutateAsync(toCreateRequest(values));
        toast.success("Purchase order created");
        router.push(`/purchase-orders/${created.id}`);
      }
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createPurchaseOrder.isPending || updatePurchaseOrder.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
        {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
        {composeQuery.isFetching && !isEdit ? (
          <p className="text-muted-foreground text-sm">Loading supplier defaults…</p>
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
                  placeholder="Select a supplier"
                  searchPlaceholder="Search supplier…"
                  createLabel="Create supplier"
                  onCreate={
                    can(supplierPermissions.create) ? () => setCreating("supplier") : undefined
                  }
                  options={[
                    { value: OPTIONAL_SELECT_NONE, label: "Select a supplier" },
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
          <FormField
            control={form.control}
            name="contact_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={(value) => {
                    markComposeDirty("contact_id");
                    field.onChange(value);
                  }}
                  disabled={disabled || contactsQuery.isLoading || !selectedSupplierId}
                  placeholder="None"
                  searchPlaceholder="Search contact…"
                  createLabel="Create contact"
                  onCreate={
                    can(contactPermissions.create) && selectedSupplierId
                      ? () => setCreating("contact")
                      : undefined
                  }
                  options={[
                    { value: OPTIONAL_SELECT_NONE, label: "None" },
                    ...contacts.map((contact) => ({
                      value: contact.id,
                      label: contact.name,
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
            name="order_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Order date</FormLabel>
                <FormControl>
                  <Input type="date" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="expected_delivery_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expected delivery</FormLabel>
                <FormControl>
                  <Input type="date" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="reference_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reference number</FormLabel>
                <FormControl>
                  <Input maxLength={60} disabled={disabled} {...field} />
                </FormControl>
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
                  onValueChange={(value) => {
                    markComposeDirty("warehouse_id");
                    field.onChange(value);
                  }}
                  disabled={disabled || warehousesQuery.isLoading}
                  placeholder="None"
                  searchPlaceholder="Search warehouse…"
                  createLabel="Create warehouse"
                  onCreate={
                    can(warehousePermissions.create) ? () => setCreating("warehouse") : undefined
                  }
                  options={[
                    { value: OPTIONAL_SELECT_NONE, label: "None" },
                    ...warehouses.map((warehouse) => ({
                      value: warehouse.id,
                      label: warehouse.name,
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
                  onValueChange={(value) => {
                    markComposeDirty("currency_id");
                    field.onChange(value);
                  }}
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
          <FormField
            control={form.control}
            name="payment_terms_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment terms</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={(value) => {
                    markComposeDirty("payment_terms_id");
                    field.onChange(value);
                  }}
                  disabled={disabled || paymentTermsQuery.isLoading}
                  placeholder="None"
                  searchPlaceholder="Search payment terms…"
                  createLabel="Create payment terms"
                  onCreate={
                    can(paymentTermPermissions.create)
                      ? () => setCreating("paymentTerms")
                      : undefined
                  }
                  options={[
                    { value: OPTIONAL_SELECT_NONE, label: "None" },
                    ...paymentTerms.map((term) => ({
                      value: term.id,
                      label: term.name,
                    })),
                  ]}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="place_of_supply"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Place of supply</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    markComposeDirty("place_of_supply");
                    field.onChange(value);
                  }}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={OPTIONAL_SELECT_NONE}>None</SelectItem>
                    {PLACES_OF_SUPPLY.map((place) => (
                      <SelectItem key={place} value={place}>
                        {PLACE_OF_SUPPLY_LABELS[place]}
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
            name="discount_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Header discount type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={OPTIONAL_SELECT_NONE}>None</SelectItem>
                    {DISCOUNT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {DISCOUNT_TYPE_LABELS[type]}
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
            name="discount_value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Header discount value</FormLabel>
                <FormControl>
                  <Input inputMode="decimal" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="shipping_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shipping amount</FormLabel>
                <FormControl>
                  <Input inputMode="decimal" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="adjustment_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adjustment amount</FormLabel>
                <FormControl>
                  <Input inputMode="decimal" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormItem>
            <FormLabel>Supplier TRN</FormLabel>
            <Input value={supplierTrn || "—"} disabled />
          </FormItem>
          <div
            className={
              isEdit ? "col-span-full" : "col-span-full grid grid-cols-1 gap-3 sm:grid-cols-2"
            }
          >
            <FormItem>
              <FormLabel>Tax treatment</FormLabel>
              <Input
                value={
                  taxTreatment && taxTreatment in TAX_TREATMENT_LABELS
                    ? TAX_TREATMENT_LABELS[taxTreatment as keyof typeof TAX_TREATMENT_LABELS]
                    : taxTreatment || "—"
                }
                disabled
              />
            </FormItem>
            {!isEdit ? (
              <FormField
                control={form.control}
                name="terms_template_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Terms template</FormLabel>
                    <MasterSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={disabled || termsTemplatesQuery.isLoading}
                      placeholder="None"
                      searchPlaceholder="Search template…"
                      createLabel="Create terms template"
                      onCreate={
                        can(termsTemplatePermissions.create)
                          ? () => setCreating("termsTemplate")
                          : undefined
                      }
                      options={[
                        { value: OPTIONAL_SELECT_NONE, label: "None" },
                        ...templates.map((template) => ({
                          value: template.id,
                          label: template.name,
                        })),
                      ]}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Lines</p>
          <PurchaseOrderLinesEditor form={form} disabled={disabled} />
        </div>
        {purchaseOrder ? <PurchaseOrderTotalsPanel purchaseOrder={purchaseOrder} /> : null}
        <div className="grid grid-cols-1 gap-3">
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
          <FormField
            control={form.control}
            name="terms_and_conditions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Terms and conditions</FormLabel>
                <FormControl>
                  <Textarea
                    disabled={disabled}
                    {...field}
                    onChange={(event) => {
                      markComposeDirty("terms_and_conditions");
                      field.onChange(event);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="supplier_address_snapshot"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier address</FormLabel>
                <FormControl>
                  <Textarea disabled {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="deliver_to_snapshot"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Deliver to</FormLabel>
                <FormControl>
                  <Textarea disabled {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        {!disabled ? (
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {isEdit ? "Save Changes" : "Create purchase order"}
            </Button>
          </div>
        ) : null}
      </form>
      <SupplierFormDialog
        open={creating === "supplier"}
        supplier={null}
        nested
        onCreated={(entity) => {
          form.setValue("supplier_id", entity.id);
          if (entity.contact_id) {
            markComposeDirty("contact_id");
            form.setValue("contact_id", entity.contact_id);
          }
        }}
        onOpenChange={(open) => setCreating(open ? "supplier" : null)}
      />
      <ContactFormDialog
        open={creating === "contact"}
        contact={null}
        defaultCustomerId={selectedSupplierId ?? undefined}
        lockCustomer
        nested
        onCreated={(entity) => {
          markComposeDirty("contact_id");
          form.setValue("contact_id", entity.id);
        }}
        onOpenChange={(open) => setCreating(open ? "contact" : null)}
      />
      <BranchFormDialog
        open={creating === "branch"}
        branch={null}
        nested
        onCreated={(entity) => form.setValue("branch_id", entity.id)}
        onOpenChange={(open) => setCreating(open ? "branch" : null)}
      />
      <WarehouseFormDialog
        open={creating === "warehouse"}
        nested
        onCreated={(entity) => {
          markComposeDirty("warehouse_id");
          form.setValue("warehouse_id", entity.id);
        }}
        onOpenChange={(open) => setCreating(open ? "warehouse" : null)}
      />
      <CurrencyFormDialog
        open={creating === "currency"}
        currency={null}
        nested
        onCreated={(entity) => {
          markComposeDirty("currency_id");
          form.setValue("currency_id", entity.id);
        }}
        onOpenChange={(open) => setCreating(open ? "currency" : null)}
      />
      <PaymentTermFormDialog
        open={creating === "paymentTerms"}
        term={null}
        nested
        onCreated={(entity) => {
          markComposeDirty("payment_terms_id");
          form.setValue("payment_terms_id", entity.id);
        }}
        onOpenChange={(open) => setCreating(open ? "paymentTerms" : null)}
      />
      <TermsTemplateFormDialog
        open={creating === "termsTemplate"}
        template={null}
        nested
        onCreated={(entity) => form.setValue("terms_template_id", entity.id)}
        onOpenChange={(open) => setCreating(open ? "termsTemplate" : null)}
      />
    </Form>
  );
}
