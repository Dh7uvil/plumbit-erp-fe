"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import {
  useCreateLandedCost,
  useUpdateLandedCost,
} from "@/modules/erp/landed-costs/mutations";
import { useLandedCostEligible } from "@/modules/erp/landed-costs/queries";
import {
  EXPENSE_CATEGORY_LABELS,
  LANDED_COST_ALLOCATION_METHOD_LABELS,
  LANDED_COST_ALLOCATION_METHODS,
  LandedCostFormSchema,
  emptyAllocationForm,
  emptyChargeForm,
  optionalSelect,
  type LandedCost,
  type LandedCostCreateRequest,
  type LandedCostFormValues,
  type LandedCostUpdateRequest,
} from "@/modules/erp/landed-costs/schemas";
import { usePurchaseInvoice, usePurchaseInvoices } from "@/modules/erp/purchase-invoices/queries";
import { purchaseInvoiceDisplayNumber } from "@/modules/erp/purchase-invoices/schemas";
import { useGoodsReceipts } from "@/modules/inventory-management/goods-receipts/queries";
import { goodsReceiptDisplayNumber } from "@/modules/inventory-management/goods-receipts/schemas";
import { useShipments } from "@/modules/inventory-management/shipments/queries";
import {
  StockWriteAlert,
  isStockWriteAlertError,
} from "@/modules/erp/period-lock/components/stock-write-alert";
import { useAllBranches } from "@/modules/users-management/branches/queries";
import { emptyToNull } from "@/modules/users-management/tenants/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { MasterSelect } from "@/shared/components/form/master-select";
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
import { Textarea } from "@/shared/components/ui/textarea";
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";
import { formatDecimal } from "@/shared/lib/format";

function todayIsoDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
}

function optionalUuid(value: string): string | null {
  return !value || value === OPTIONAL_SELECT_NONE ? null : value;
}

function toFormValues(
  document: LandedCost | null,
  defaults?: { goodsReceiptLineIds?: string[] },
): LandedCostFormValues {
  return {
    document_date: document?.document_date ?? todayIsoDate(),
    allocation_method: document?.allocation_method ?? "VALUE",
    shipment_id: optionalSelect(document?.shipment_id),
    branch_id: optionalSelect(document?.branch_id),
    notes: document?.notes ?? "",
    charges:
      document?.charges.map((charge) => ({
        purchase_invoice_line_id: charge.purchase_invoice_line_id,
        amount: charge.amount,
        bill_number: charge.bill_number,
        expense_category: charge.expense_category,
      })) ?? [emptyChargeForm()],
    allocations:
      document?.allocations.map((allocation) => ({
        goods_receipt_line_id: allocation.goods_receipt_line_id,
        goods_receipt_number: allocation.goods_receipt_id,
      })) ??
      (defaults?.goodsReceiptLineIds?.length
        ? defaults.goodsReceiptLineIds.map((id) => ({ goods_receipt_line_id: id }))
        : [emptyAllocationForm()]),
  };
}

function toCreateRequest(values: LandedCostFormValues): LandedCostCreateRequest {
  return {
    document_date: values.document_date,
    allocation_method: values.allocation_method,
    shipment_id: optionalUuid(values.shipment_id),
    branch_id: optionalUuid(values.branch_id),
    notes: emptyToNull(values.notes),
    charges: values.charges
      .filter((line) => line.purchase_invoice_line_id)
      .map((line) => ({
        purchase_invoice_line_id: line.purchase_invoice_line_id,
        amount: line.amount.trim() ? line.amount.trim() : null,
      })),
    allocations: values.allocations
      .filter((line) => line.goods_receipt_line_id)
      .map((line) => ({ goods_receipt_line_id: line.goods_receipt_line_id })),
  };
}

function toUpdateRequest(values: LandedCostFormValues): LandedCostUpdateRequest {
  const created = toCreateRequest(values);
  return {
    document_date: created.document_date,
    allocation_method: created.allocation_method,
    shipment_id: created.shipment_id,
    branch_id: created.branch_id,
    notes: created.notes,
    charges: created.charges,
    allocations: created.allocations,
  };
}

export function LandedCostForm({
  document,
  disabled = false,
  defaultGoodsReceiptId,
  onSuccess,
}: {
  document: LandedCost | null;
  disabled?: boolean;
  defaultGoodsReceiptId?: string;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const createDocument = useCreateLandedCost();
  const updateDocument = useUpdateLandedCost();
  const [formError, setFormError] = useState<string | null>(null);
  const [writeError, setWriteError] = useState<unknown>(null);
  const [billId, setBillId] = useState("");
  const [receiptId, setReceiptId] = useState(defaultGoodsReceiptId ?? "");
  const isEdit = Boolean(document);
  const eligibleQuery = useLandedCostEligible(receiptId || null);
  const billsQuery = usePurchaseInvoices({ status: "POSTED", page_size: 50, bill_type: "EXPENSE" });
  const importBillsQuery = usePurchaseInvoices({
    status: "POSTED",
    page_size: 50,
    bill_type: "IMPORT",
  });
  const billQuery = usePurchaseInvoice(billId || null);
  const receiptsQuery = useGoodsReceipts({ status: "POSTED", page_size: 50 });
  const shipmentsQuery = useShipments({ page_size: 100 });
  const branchesQuery = useAllBranches();

  const form = useForm<LandedCostFormValues>({
    resolver: zodResolver(LandedCostFormSchema),
    defaultValues: toFormValues(document),
    values: document ? toFormValues(document) : undefined,
  });
  useDirtyFormGuard(form.formState.isDirty && !disabled);
  const chargesArray = useFieldArray({ control: form.control, name: "charges" });
  const allocationsArray = useFieldArray({ control: form.control, name: "allocations" });
  const charges = useWatch({ control: form.control, name: "charges" }) ?? [];
  const allocations = useWatch({ control: form.control, name: "allocations" }) ?? [];

  const bills = useMemo(
    () => [...(billsQuery.data?.data ?? []), ...(importBillsQuery.data?.data ?? [])],
    [billsQuery.data, importBillsQuery.data],
  );
  const expenseLines = (billQuery.data?.lines ?? []).filter((line) => line.line_type === "EXPENSE");
  const eligibleLines = eligibleQuery.data?.lines ?? [];
  const receipts = receiptsQuery.data?.data ?? [];
  const shipments = shipmentsQuery.data?.data ?? [];
  const branches = branchesQuery.data ?? [];

  async function onSubmit(values: LandedCostFormValues) {
    setFormError(null);
    setWriteError(null);
    try {
      if (document) {
        await updateDocument.mutateAsync({
          id: document.id,
          version: document.version,
          values: toUpdateRequest(values),
        });
        toast.success("Landed cost updated");
        onSuccess?.();
        return;
      }
      const created = await createDocument.mutateAsync(toCreateRequest(values));
      toast.success("Landed cost created");
      router.push(`/landed-costs/${created.id}`);
    } catch (error) {
      if (isStockWriteAlertError(error)) {
        setWriteError(error);
        return;
      }
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createDocument.isPending || updateDocument.isPending;

  return (
    <Form {...form}>
      <form
        onSubmit={disabled ? (event) => event.preventDefault() : form.handleSubmit(onSubmit)}
        className="flex flex-col gap-5"
      >
        {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
        <StockWriteAlert periodLocked={document?.period_locked} error={writeError} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
            name="allocation_method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Allocation method</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled}
                  placeholder="Method"
                  searchPlaceholder="Search method…"
                  options={LANDED_COST_ALLOCATION_METHODS.map((method) => ({
                    value: method,
                    label: LANDED_COST_ALLOCATION_METHOD_LABELS[method],
                  }))}
                />
                <FormMessage />
              </FormItem>
            )}
          />
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
                      label: shipment.document_number || shipment.id,
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
                  options={[
                    { value: OPTIONAL_SELECT_NONE, label: "None" },
                    ...branches.map((branch) => ({
                      value: branch.id,
                      label: `${branch.code} — ${branch.name}`,
                    })),
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
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Charges</h3>
          </div>
          {document?.charges.length ? (
            <ul className="flex flex-col gap-1 text-sm">
              {document.charges.map((charge) => (
                <li key={charge.id}>
                  {charge.bill_number} · {EXPENSE_CATEGORY_LABELS[charge.expense_category]} ·{" "}
                  {formatDecimal(charge.amount)}
                </li>
              ))}
            </ul>
          ) : null}
          {disabled ? null : (
            <>
              <MasterSelect
                value={billId || OPTIONAL_SELECT_NONE}
                onValueChange={(value) =>
                  setBillId(value === OPTIONAL_SELECT_NONE ? "" : value)
                }
                placeholder="Add lines from a posted bill"
                searchPlaceholder="Search bill…"
                options={[
                  { value: OPTIONAL_SELECT_NONE, label: "Select a bill" },
                  ...bills.map((bill) => ({
                    value: bill.id,
                    label: purchaseInvoiceDisplayNumber(bill) ?? bill.document_number,
                  })),
                ]}
              />
              {expenseLines.map((line) => {
                const selected = charges.some(
                  (charge) => charge.purchase_invoice_line_id === line.id,
                );
                return (
                  <label key={line.id} className="flex items-start gap-2 text-sm">
                    <Checkbox
                      checked={selected}
                      onCheckedChange={(checked) => {
                        const current = form.getValues("charges");
                        if (checked === true && !selected) {
                          chargesArray.append({
                            purchase_invoice_line_id: line.id,
                            amount: line.landed_cost_remaining ?? line.amount,
                            bill_number: purchaseInvoiceDisplayNumber(billQuery.data!) ?? "",
                            expense_category: line.expense_category ?? "",
                          });
                          return;
                        }
                        if (checked !== true) {
                          const index = current.findIndex(
                            (charge) => charge.purchase_invoice_line_id === line.id,
                          );
                          if (index >= 0) {
                            chargesArray.remove(index);
                          }
                        }
                      }}
                    />
                    <span>
                      {line.description || line.expense_category || "Expense"} ·{" "}
                      {formatDecimal(line.amount)}
                      {line.landed_cost_remaining != null
                        ? ` · remaining ${formatDecimal(line.landed_cost_remaining)}`
                        : ""}
                    </span>
                  </label>
                );
              })}
              {chargesArray.fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <Input
                    value={
                      charges[index]?.bill_number ||
                      charges[index]?.purchase_invoice_line_id ||
                      ""
                    }
                    readOnly
                  />
                  <FormField
                    control={form.control}
                    name={`charges.${index}.amount`}
                    render={({ field: amountField }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input inputMode="decimal" placeholder="Amount" {...amountField} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => chargesArray.remove(index)}
                    aria-label="Remove charge"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </>
          )}
          <FormMessage>{form.formState.errors.charges?.message}</FormMessage>
        </section>
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-medium">Allocations</h3>
          {document?.allocations.length ? (
            <ul className="flex flex-col gap-1 text-sm">
              {document.allocations.map((allocation) => (
                <li key={allocation.id}>
                  GRN line {allocation.line_number} · base {formatDecimal(allocation.allocation_base)}{" "}
                  · allocated {formatDecimal(allocation.allocated_amount)}
                  {allocation.qty_remaining_at_post
                    ? ` · remaining qty ${formatDecimal(allocation.qty_remaining_at_post)}`
                    : ""}
                  {allocation.qty_consumed_at_post
                    ? ` · consumed qty ${formatDecimal(allocation.qty_consumed_at_post)}`
                    : ""}
                </li>
              ))}
            </ul>
          ) : null}
          {disabled ? null : (
            <>
              <MasterSelect
                value={receiptId || OPTIONAL_SELECT_NONE}
                onValueChange={(value) =>
                  setReceiptId(value === OPTIONAL_SELECT_NONE ? "" : value)
                }
                placeholder="Add lines from a posted GRN"
                searchPlaceholder="Search goods receipt…"
                options={[
                  { value: OPTIONAL_SELECT_NONE, label: "Select a goods receipt" },
                  ...receipts.map((receipt) => ({
                    value: receipt.id,
                    label: goodsReceiptDisplayNumber(receipt) ?? receipt.document_number,
                  })),
                ]}
              />
              {eligibleLines.map((line) => {
                const selected = allocations.some(
                  (allocation) => allocation.goods_receipt_line_id === line.goods_receipt_line_id,
                );
                return (
                  <label key={line.goods_receipt_line_id} className="flex items-start gap-2 text-sm">
                    <Checkbox
                      checked={selected}
                      onCheckedChange={(checked) => {
                        const current = form.getValues("allocations");
                        if (checked === true && !selected) {
                          allocationsArray.append({
                            goods_receipt_line_id: line.goods_receipt_line_id,
                            goods_receipt_number: line.goods_receipt_number,
                            description: line.description,
                          });
                          return;
                        }
                        if (checked !== true) {
                          const index = current.findIndex(
                            (allocation) =>
                              allocation.goods_receipt_line_id === line.goods_receipt_line_id,
                          );
                          if (index >= 0) {
                            allocationsArray.remove(index);
                          }
                        }
                      }}
                    />
                    <span>
                      {line.goods_receipt_number} · {line.description} · qty{" "}
                      {formatDecimal(line.quantity)} · value {formatDecimal(line.line_value)}
                    </span>
                  </label>
                );
              })}
              {allocationsArray.fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <Input
                    value={
                      allocations[index]?.description ||
                      allocations[index]?.goods_receipt_number ||
                      allocations[index]?.goods_receipt_line_id ||
                      ""
                    }
                    readOnly
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => allocationsArray.remove(index)}
                    aria-label="Remove allocation"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => allocationsArray.append(emptyAllocationForm())}
              >
                <Plus className="size-4" />
                Add allocation row
              </Button>
            </>
          )}
          <FormMessage>{form.formState.errors.allocations?.message}</FormMessage>
        </section>
        {document ? (
          <p className="text-muted-foreground text-sm">
            Total charges {formatDecimal(document.total_charges)}. Allocation amounts are calculated
            by the server.
          </p>
        ) : null}
        {disabled ? null : (
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {isEdit ? "Save Changes" : "Create landed cost"}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
