"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useCreateGrnChargeAdjustment } from "@/modules/inventory-management/goods-receipt-charge-adjustments/mutations";
import type { GrnChargeAdjustmentCreateRequest } from "@/modules/inventory-management/goods-receipt-charge-adjustments/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";

export function GrnChargeAdjustmentForm() {
  const router = useRouter();
  const createMutation = useCreateGrnChargeAdjustment();
  const [goodsReceiptId, setGoodsReceiptId] = useState("");
  const [documentDate, setDocumentDate] = useState("");
  const [chargeId, setChargeId] = useState("");
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [notes, setNotes] = useState("");

  const onSubmit = () => {
    const payload: GrnChargeAdjustmentCreateRequest = {
      goods_receipt_id: goodsReceiptId.trim(),
      document_date: documentDate.trim() || null,
      notes: notes.trim() || null,
      lines: [
        {
          goods_receipt_charge_id: chargeId.trim(),
          adjustment_amount: adjustmentAmount.trim(),
          notes: null,
        },
      ],
    };
    createMutation.mutate(payload, {
      onSuccess: (created) => {
        toast.success("GRN charge adjustment created");
        router.push(`/goods-receipt-charge-adjustments/${created.id}`);
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>New GRN charge adjustment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="goods-receipt-id">Posted goods receipt ID</Label>
          <Input
            id="goods-receipt-id"
            value={goodsReceiptId}
            onChange={(event) => setGoodsReceiptId(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="document-date">Document date</Label>
          <Input
            id="document-date"
            type="date"
            value={documentDate}
            onChange={(event) => setDocumentDate(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="charge-id">Goods receipt charge ID</Label>
          <Input
            id="charge-id"
            value={chargeId}
            onChange={(event) => setChargeId(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="adjustment-amount">Adjustment amount</Label>
          <Input
            id="adjustment-amount"
            value={adjustmentAmount}
            onChange={(event) => setAdjustmentAmount(event.target.value)}
            placeholder="0.00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </div>
        <Button disabled={createMutation.isPending} onClick={onSubmit}>
          Create draft
        </Button>
      </CardContent>
    </Card>
  );
}
