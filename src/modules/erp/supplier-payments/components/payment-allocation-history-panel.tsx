"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { supplierPaymentsApi } from "@/modules/erp/supplier-payments/api";
import { supplierPaymentKeys } from "@/modules/erp/supplier-payments/queries";
import type { SupplierPayment } from "@/modules/erp/supplier-payments/schemas";
import {
  PaymentAllocationHistoryTable,
  type PaymentAllocationHistoryRow,
} from "@/shared/components/document/payment-allocation-history";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";
import { toast } from "sonner";

export function SupplierPaymentAllocationHistoryPanel({
  payment,
  currencyCode,
  canUnapply,
}: {
  payment: SupplierPayment;
  currencyCode: string;
  canUnapply: boolean;
}) {
  const queryClient = useQueryClient();
  const detailKey = useTenantQueryKey(supplierPaymentKeys.detail(payment.id));
  const historyKey = useTenantQueryKey([...supplierPaymentKeys.detail(payment.id), "allocations"]);
  const historyQuery = useQuery({
    queryKey: historyKey,
    queryFn: () => supplierPaymentsApi.listAllocations(payment.id),
    enabled: payment.is_posted,
  });
  const [pending, setPending] = useState<PaymentAllocationHistoryRow | null>(null);

  const unallocate = useMutation({
    mutationFn: async (row: PaymentAllocationHistoryRow) => {
      const fresh = await queryClient.fetchQuery({
        queryKey: detailKey,
        queryFn: () => supplierPaymentsApi.get(payment.id),
      });
      return supplierPaymentsApi.unallocate(payment.id, row.id, { version: fresh.version });
    },
    onSuccess: async () => {
      toast.success("Allocation reversed");
      setPending(null);
      await queryClient.invalidateQueries({ queryKey: detailKey });
      await queryClient.invalidateQueries({ queryKey: historyKey });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!payment.is_posted) {
    return null;
  }

  const rows: PaymentAllocationHistoryRow[] = (historyQuery.data ?? payment.allocations).map(
    (row) => ({
      id: row.id ?? `${row.item_type}-${row.item_id}`,
      item_type: row.item_type,
      item_id: row.item_id,
      item_document_number: row.item_document_number,
      amount: row.amount,
      journal_entry_id: row.journal_entry_id,
      reversed_at: row.reversed_at,
      created_at: row.created_at,
    }),
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Allocation history</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentAllocationHistoryTable
            rows={rows}
            currencyCode={currencyCode}
            canUnapply={canUnapply}
            unapplyPendingId={unallocate.isPending ? pending?.id : null}
            onUnapply={(row) => setPending(row)}
          />
        </CardContent>
      </Card>
      <AlertDialog open={pending != null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unapply this allocation?</AlertDialogTitle>
            <AlertDialogDescription>
              This reverses journal entry{" "}
              {pending?.journal_entry_id ? (
                <span className="font-mono text-xs">{pending.journal_entry_id}</span>
              ) : (
                "for this match"
              )}{" "}
              and returns the amount to unapplied on the payment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pending) {
                  unallocate.mutate(pending);
                }
              }}
            >
              Unapply
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
