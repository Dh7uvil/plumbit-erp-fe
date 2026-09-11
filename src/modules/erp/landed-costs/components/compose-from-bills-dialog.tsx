"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { useCreateLandedCostFromBills } from "@/modules/erp/landed-costs/mutations";
import {
  LANDED_COST_ALLOCATION_METHOD_LABELS,
  LANDED_COST_ALLOCATION_METHODS,
  type LandedCostAllocationMethod,
} from "@/modules/erp/landed-costs/schemas";
import { usePurchaseInvoice, usePurchaseInvoices } from "@/modules/erp/purchase-invoices/queries";
import {
  purchaseInvoiceDisplayNumber,
  type PurchaseInvoice,
} from "@/modules/erp/purchase-invoices/schemas";
import { useGoodsReceipts } from "@/modules/inventory-management/goods-receipts/queries";
import { goodsReceiptDisplayNumber } from "@/modules/inventory-management/goods-receipts/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { ConversionSourceSelect } from "@/shared/components/document/conversion-source-select";
import { CONVERT_FROM_DIALOG_CLASSNAME } from "@/shared/components/document/convert-from-menu";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { formatDate, formatDecimal } from "@/shared/lib/format";

function todayIsoDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
}

function expenseLines(invoice: PurchaseInvoice | undefined) {
  return (invoice?.lines ?? []).filter((line) => line.line_type === "EXPENSE");
}

export function ComposeFromBillsDialog({
  open,
  onOpenChange,
  purchaseInvoiceId,
  goodsReceiptId,
  shipmentId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseInvoiceId?: string;
  goodsReceiptId?: string;
  shipmentId?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <ComposeFromBillsBody
          purchaseInvoiceId={purchaseInvoiceId}
          goodsReceiptId={goodsReceiptId}
          shipmentId={shipmentId}
          onOpenChange={onOpenChange}
        />
      ) : null}
    </Dialog>
  );
}

function ComposeFromBillsBody({
  purchaseInvoiceId,
  goodsReceiptId,
  shipmentId,
  onOpenChange,
}: {
  purchaseInvoiceId?: string;
  goodsReceiptId?: string;
  shipmentId?: string;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const createFromBills = useCreateLandedCostFromBills();
  const [search, setSearch] = useState("");
  const [selectedBillId, setSelectedBillId] = useState(purchaseInvoiceId ?? "");
  const [selectedLineIds, setSelectedLineIds] = useState<string[]>([]);
  const [selectedReceiptId, setSelectedReceiptId] = useState(
    goodsReceiptId ?? OPTIONAL_SELECT_NONE,
  );
  const [allocationMethod, setAllocationMethod] = useState<LandedCostAllocationMethod>("VALUE");
  const [documentDate, setDocumentDate] = useState(todayIsoDate());
  const billsQuery = usePurchaseInvoices(
    { status: "POSTED", page_size: 50, search: search || undefined },
    !purchaseInvoiceId,
  );
  const billQuery = usePurchaseInvoice(selectedBillId || null);
  const receiptsQuery = useGoodsReceipts(
    { status: "POSTED", page_size: 50 },
    !goodsReceiptId,
  );
  const bills = billsQuery.data?.data ?? [];
  const receipts = receiptsQuery.data?.data ?? [];
  const invoice = billQuery.data;
  const lines = useMemo(() => expenseLines(invoice), [invoice]);

  useEffect(() => {
    if (!invoice) {
      return;
    }
    setSelectedLineIds(expenseLines(invoice).map((line) => line.id));
  }, [invoice]);

  async function onSubmit() {
    if (selectedLineIds.length === 0) {
      toast.error("Select at least one expense line.");
      return;
    }
    try {
      const created = await createFromBills.mutateAsync({
        purchase_invoice_line_ids: selectedLineIds,
        goods_receipt_ids:
          selectedReceiptId && selectedReceiptId !== OPTIONAL_SELECT_NONE
            ? [selectedReceiptId]
            : undefined,
        shipment_id: shipmentId ?? null,
        allocation_method: allocationMethod,
        document_date: documentDate,
      });
      toast.success("Landed cost created");
      onOpenChange(false);
      router.push(`/landed-costs/${created.id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <DialogContent className={CONVERT_FROM_DIALOG_CLASSNAME}>
      <DialogHeader>
        <DialogTitle>Create landed cost from bills</DialogTitle>
        <DialogDescription>
          Allocate posted freight, duty, and other expense lines onto goods receipt layers. Amounts
          come from the server.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4">
        {purchaseInvoiceId ? null : (
          <ConversionSourceSelect
            label="Expense bill"
            value={selectedBillId}
            onValueChange={setSelectedBillId}
            onSearch={setSearch}
            loading={billsQuery.isLoading}
            placeholder="Select a posted bill"
            options={bills.map((bill) => ({
              value: bill.id,
              label: `${purchaseInvoiceDisplayNumber(bill) ?? "Bill"} · ${formatDate(bill.document_date)}`,
            }))}
          />
        )}
        {selectedBillId && billQuery.isLoading ? (
          <p className="text-muted-foreground text-sm">Loading bill lines…</p>
        ) : lines.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Select a posted expense bill with remaining charge lines.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Expense lines</p>
            {lines.map((line) => {
              const remaining = line.landed_cost_remaining;
              return (
                <label key={line.id} className="flex items-start gap-2 text-sm">
                  <Checkbox
                    checked={selectedLineIds.includes(line.id)}
                    onCheckedChange={(checked) => {
                      setSelectedLineIds((current) =>
                        checked === true
                          ? [...current, line.id]
                          : current.filter((id) => id !== line.id),
                      );
                    }}
                  />
                  <span>
                    {line.description || line.expense_category || "Expense"} ·{" "}
                    {formatDecimal(line.amount)}
                    {remaining != null ? ` · remaining ${formatDecimal(remaining)}` : ""}
                  </span>
                </label>
              );
            })}
          </div>
        )}
        {goodsReceiptId ? null : (
          <ConversionSourceSelect
            label="Goods receipt (optional)"
            value={selectedReceiptId}
            onValueChange={setSelectedReceiptId}
            onSearch={() => undefined}
            loading={receiptsQuery.isLoading}
            placeholder="Allocate later"
            options={[
              { value: OPTIONAL_SELECT_NONE, label: "Allocate later" },
              ...receipts.map((receipt) => ({
                value: receipt.id,
                label: `${goodsReceiptDisplayNumber(receipt) ?? "GRN"} · ${formatDate(receipt.document_date)}`,
              })),
            ]}
          />
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lc-compose-date">Document date</Label>
            <Input
              id="lc-compose-date"
              type="date"
              value={documentDate}
              onChange={(event) => setDocumentDate(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lc-compose-method">Allocation method</Label>
            <Select
              value={allocationMethod}
              onValueChange={(value) => setAllocationMethod(value as LandedCostAllocationMethod)}
            >
              <SelectTrigger id="lc-compose-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANDED_COST_ALLOCATION_METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {LANDED_COST_ALLOCATION_METHOD_LABELS[method]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="button" onClick={onSubmit} disabled={createFromBills.isPending}>
          {createFromBills.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Create draft
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
