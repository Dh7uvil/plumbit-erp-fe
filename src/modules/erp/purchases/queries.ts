"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { purchaseOrdersApi } from "@/modules/erp/purchase-orders/api";
import { goodsReceiptsApi } from "@/modules/inventory-management/goods-receipts/api";
import type { BillingQueueListParams } from "@/modules/erp/purchases/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export {
  usePurchaseOrders,
  usePurchaseOrder,
  usePurchaseOrderComposeDefaults,
  purchaseOrderKeys,
} from "@/modules/erp/purchase-orders/queries";
export {
  usePurchaseInvoices,
  usePurchaseInvoice,
  purchaseInvoiceKeys,
} from "@/modules/erp/purchase-invoices/queries";

export const purchasesKeys = {
  all: ["purchases"] as const,
  poBillingQueue: (params: BillingQueueListParams) =>
    [...purchasesKeys.all, "po-billing-queue", params] as const,
  grnBillingQueue: (params: BillingQueueListParams) =>
    [...purchasesKeys.all, "grn-billing-queue", params] as const,
};

export function usePurchaseOrderBillingQueue(params: BillingQueueListParams = {}, enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(purchasesKeys.poBillingQueue(params)),
    queryFn: () => purchaseOrdersApi.billingQueue(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useGoodsReceiptBillingQueue(params: BillingQueueListParams = {}, enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(purchasesKeys.grnBillingQueue(params)),
    queryFn: () => goodsReceiptsApi.billingQueue(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}
