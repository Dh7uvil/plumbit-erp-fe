"use client";

import { useQuery } from "@tanstack/react-query";

import { partyComposeApi } from "@/shared/api/party-compose-api";

export function useCustomerDocumentComposeDefaults(
  key: string,
  fetcher: (customerId: string) => ReturnType<typeof partyComposeApi.salesInvoice>,
  customerId: string | null,
) {
  return useQuery({
    queryKey: ["party-compose", key, customerId],
    queryFn: () => fetcher(customerId!),
    enabled: Boolean(customerId),
  });
}

export function useSalesInvoiceComposeDefaults(customerId: string | null) {
  return useCustomerDocumentComposeDefaults("sales-invoice", partyComposeApi.salesInvoice, customerId);
}

export function useCreditNoteComposeDefaults(customerId: string | null) {
  return useCustomerDocumentComposeDefaults("credit-note", partyComposeApi.creditNote, customerId);
}

export function useDeliveryNoteComposeDefaults(customerId: string | null) {
  return useCustomerDocumentComposeDefaults("delivery-note", partyComposeApi.deliveryNote, customerId);
}

export function useSupplierDocumentComposeDefaults(
  key: string,
  fetcher: (supplierId: string) => ReturnType<typeof partyComposeApi.purchaseInvoice>,
  supplierId: string | null,
) {
  return useQuery({
    queryKey: ["party-compose", key, supplierId],
    queryFn: () => fetcher(supplierId!),
    enabled: Boolean(supplierId),
  });
}

export function usePurchaseInvoiceComposeDefaults(supplierId: string | null) {
  return useSupplierDocumentComposeDefaults(
    "purchase-invoice",
    partyComposeApi.purchaseInvoice,
    supplierId,
  );
}

export function useDebitNoteComposeDefaults(supplierId: string | null) {
  return useSupplierDocumentComposeDefaults("debit-note", partyComposeApi.debitNote, supplierId);
}

export function useGoodsReceiptComposeDefaults(supplierId: string | null) {
  return useSupplierDocumentComposeDefaults(
    "goods-receipt",
    partyComposeApi.goodsReceipt,
    supplierId,
  );
}

export function useCustomerPaymentComposeDefaults(customerId: string | null) {
  return useQuery({
    queryKey: ["party-compose", "customer-payment", customerId],
    queryFn: () => partyComposeApi.customerPayment(customerId!),
    enabled: Boolean(customerId),
  });
}

export function useSupplierPaymentComposeDefaults(supplierId: string | null) {
  return useQuery({
    queryKey: ["party-compose", "supplier-payment", supplierId],
    queryFn: () => partyComposeApi.supplierPayment(supplierId!),
    enabled: Boolean(supplierId),
  });
}

export function useSalesReturnComposeDefaults(customerId: string | null) {
  return useCustomerDocumentComposeDefaults("sales-return", partyComposeApi.salesReturn, customerId);
}

export function usePurchaseReturnComposeDefaults(supplierId: string | null) {
  return useSupplierDocumentComposeDefaults(
    "purchase-return",
    partyComposeApi.purchaseReturn,
    supplierId,
  );
}

export function useShipmentComposeDefaults(supplierId: string | null) {
  return useSupplierDocumentComposeDefaults("shipment", partyComposeApi.shipment, supplierId);
}
