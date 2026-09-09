"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { INCOTERM_LABELS, INCOTERMS, type Incoterm } from "@/modules/erp/proforma-invoices/schemas";
import { useConvertQuotationToProformaInvoice } from "@/modules/erp/quotations/mutations";
import type { Quotation } from "@/modules/erp/quotations/schemas";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function CreateProformaInvoiceDialog({
  quotation,
  open,
  onOpenChange,
}: {
  quotation: Quotation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const convert = useConvertQuotationToProformaInvoice();
  const [proformaDate, setProformaDate] = useState(todayIsoDate());
  const [validUntil, setValidUntil] = useState(quotation.valid_until ?? "");
  const [incoterm, setIncoterm] = useState<string>(OPTIONAL_SELECT_NONE);

  async function onSubmit() {
    try {
      const created = await convert.mutateAsync({
        id: quotation.id,
        version: quotation.version,
        values: {
          proforma_date: proformaDate || null,
          valid_until: validUntil || null,
          incoterm:
            incoterm && incoterm !== OPTIONAL_SELECT_NONE ? (incoterm as Incoterm) : null,
        },
      });
      toast.success("Proforma invoice created");
      onOpenChange(false);
      router.push(`/proforma-invoices/${created.id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create proforma invoice</DialogTitle>
          <DialogDescription>
            Raise a proforma invoice from this quotation. The quotation stays in its current status
            until the proforma is confirmed.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pfi-date">Proforma date</Label>
            <Input
              id="pfi-date"
              type="date"
              value={proformaDate}
              onChange={(event) => setProformaDate(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pfi-valid-until">Valid until</Label>
            <Input
              id="pfi-valid-until"
              type="date"
              value={validUntil}
              onChange={(event) => setValidUntil(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pfi-incoterm">Incoterm</Label>
            <Select value={incoterm} onValueChange={setIncoterm}>
              <SelectTrigger id="pfi-incoterm">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={OPTIONAL_SELECT_NONE}>None</SelectItem>
                {INCOTERMS.map((term) => (
                  <SelectItem key={term} value={term}>
                    {INCOTERM_LABELS[term]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={convert.isPending} onClick={() => void onSubmit()}>
            {convert.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
