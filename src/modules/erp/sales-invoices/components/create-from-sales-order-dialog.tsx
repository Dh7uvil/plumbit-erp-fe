"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useCreateSalesInvoiceFromSalesOrder } from "@/modules/erp/sales-invoices/mutations";
import { getErrorMessage } from "@/shared/api/errors";
import { Button } from "@/shared/components/ui/button";
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
import { Textarea } from "@/shared/components/ui/textarea";

function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function CreateInvoiceFromSalesOrderDialog({
  salesOrderId,
  open,
  onOpenChange,
}: {
  salesOrderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const createInvoice = useCreateSalesInvoiceFromSalesOrder();
  const [invoiceDate, setInvoiceDate] = useState(todayIsoDate());
  const [notes, setNotes] = useState("");

  async function onSubmit() {
    try {
      const invoice = await createInvoice.mutateAsync({
        sales_order_id: salesOrderId,
        invoice_date: invoiceDate || null,
        notes: notes.trim() || null,
      });
      toast.success("Sales invoice created");
      onOpenChange(false);
      router.push(`/sales-invoices/${invoice.id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create sales invoice</DialogTitle>
          <DialogDescription>
            Creates a draft invoice from this sales order. Stock will not move.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="si-from-so-date">Invoice date</Label>
            <Input
              id="si-from-so-date"
              type="date"
              value={invoiceDate}
              onChange={(event) => setInvoiceDate(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="si-from-so-notes">Notes</Label>
            <Textarea
              id="si-from-so-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={createInvoice.isPending} onClick={() => void onSubmit()}>
            {createInvoice.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Create invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
