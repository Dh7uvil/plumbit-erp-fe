"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  useDeleteGrnChargeAdjustment,
  usePostGrnChargeAdjustment,
} from "@/modules/inventory-management/goods-receipt-charge-adjustments/mutations";
import { useGrnChargeAdjustment } from "@/modules/inventory-management/goods-receipt-charge-adjustments/queries";
import {
  STOCK_DOCUMENT_STATUS_LABELS,
  STOCK_DOCUMENT_STATUS_VARIANTS,
  grnChargeAdjustmentDisplayNumber,
} from "@/modules/inventory-management/goods-receipt-charge-adjustments/schemas";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { getErrorMessage } from "@/shared/api/errors";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { formatDate, formatMoney } from "@/shared/lib/format";

type Props = {
  id: string;
};

export function GrnChargeAdjustmentDetailScreen({ id }: Props) {
  const router = useRouter();
  const { data: adjustment, isLoading, refetch } = useGrnChargeAdjustment(id);
  const postMutation = usePostGrnChargeAdjustment(id);
  const deleteMutation = useDeleteGrnChargeAdjustment();

  if (isLoading || !adjustment) {
    return <Skeleton className="h-48 w-full" />;
  }

  const canPost = adjustment.available_actions.includes("post");
  const canEdit = adjustment.status === "DRAFT";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            {grnChargeAdjustmentDisplayNumber(adjustment) ?? "GRN charge adjustment"}
          </h1>
          <p className="text-sm text-muted-foreground">{formatDate(adjustment.document_date)}</p>
        </div>
        <DocumentStatusBadge
          label={STOCK_DOCUMENT_STATUS_LABELS[adjustment.status]}
          variant={STOCK_DOCUMENT_STATUS_VARIANTS[adjustment.status]}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Goods receipt:{" "}
            <Link href={`/goods-receipts/${adjustment.goods_receipt_id}`} className="text-primary">
              View GRN
            </Link>
          </p>
          {adjustment.notes ? <p>Notes: {adjustment.notes}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {adjustment.lines.map((line) => (
            <div key={line.id} className="rounded-md border p-3 text-sm">
              <p>Charge line: {line.goods_receipt_charge_id}</p>
              <p>Adjustment: {formatMoney(line.adjustment_amount)}</p>
              <p>Base adjustment: {formatMoney(line.base_adjustment_amount)}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {canEdit ? (
          <Button asChild variant="outline">
            <Link href={`/goods-receipt-charge-adjustments/${id}/edit`}>Edit</Link>
          </Button>
        ) : null}
        {canPost ? (
          <Button
            disabled={postMutation.isPending}
            onClick={() => {
              postMutation.mutate(
                { version: adjustment.version },
                {
                  onSuccess: () => {
                    toast.success("Adjustment posted");
                    void refetch();
                  },
                  onError: (error) => toast.error(getErrorMessage(error)),
                },
              );
            }}
          >
            Post
          </Button>
        ) : null}
        {canEdit ? (
          <Button
            variant="destructive"
            disabled={deleteMutation.isPending}
            onClick={() => {
              deleteMutation.mutate(
                { id, options: { version: adjustment.version } },
                {
                  onSuccess: () => {
                    toast.success("Adjustment deleted");
                    router.push("/goods-receipt-charge-adjustments");
                  },
                  onError: (error) => toast.error(getErrorMessage(error)),
                },
              );
            }}
          >
            Delete
          </Button>
        ) : null}
      </div>
    </div>
  );
}
