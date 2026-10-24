import { creditNotesApi } from "@/modules/erp/credit-notes/api";
import { customerPaymentsApi } from "@/modules/erp/customer-payments/api";
import { debitNotesApi } from "@/modules/erp/debit-notes/api";
import { proformaInvoicesApi } from "@/modules/erp/proforma-invoices/api";
import { purchaseInvoicesApi } from "@/modules/erp/purchase-invoices/api";
import { purchaseOrdersApi } from "@/modules/erp/purchase-orders/api";
import { quotationsApi } from "@/modules/erp/quotations/api";
import { salesInvoicesApi } from "@/modules/erp/sales-invoices/api";
import { salesOrdersApi } from "@/modules/erp/sales-orders/api";
import { supplierPaymentsApi } from "@/modules/erp/supplier-payments/api";
import { deliveryNotesApi } from "@/modules/inventory-management/delivery-notes/api";
import { goodsReceiptsApi } from "@/modules/inventory-management/goods-receipts/api";
import { packagesApi } from "@/modules/inventory-management/packages/api";
import { purchaseReturnsApi } from "@/modules/inventory-management/purchase-returns/api";
import { qualityInspectionsApi } from "@/modules/inventory-management/quality-inspections/api";
import { salesReturnsApi } from "@/modules/inventory-management/sales-returns/api";
import { shipmentsApi } from "@/modules/inventory-management/shipments/api";
import {
  DOCUMENT_TYPES,
  type DocumentType,
} from "@/shared/components/document/document-links";

export const SOURCE_DOCUMENT_PICKER_TYPES = DOCUMENT_TYPES.filter(
  (type): type is DocumentType =>
    type !== "JOURNAL" && type !== "OPENING_AR" && type !== "OPENING_AP",
);

export type SourceDocumentOption = {
  id: string;
  label: string;
};

type ListedRow = { id: string; document_number?: string | null; display_number?: string | null };

function rowLabel(row: ListedRow): string {
  const value = (row.display_number ?? row.document_number ?? "").trim();
  return value || row.id.slice(0, 8);
}

async function listRows(
  fetcher: (params: { search?: string; page_size: number }) => Promise<{ data: ListedRow[] }>,
  search?: string,
): Promise<SourceDocumentOption[]> {
  const result = await fetcher({ search: search?.trim() || undefined, page_size: 50 });
  return result.data.map((row) => ({ id: row.id, label: rowLabel(row) }));
}

export async function listSourceDocuments(
  documentType: string,
  search?: string,
): Promise<SourceDocumentOption[]> {
  const type = documentType.trim().toUpperCase();
  switch (type) {
    case "QUOTATION":
      return listRows(quotationsApi.list, search);
    case "PROFORMA_INVOICE":
      return listRows(proformaInvoicesApi.list, search);
    case "SALES_ORDER":
      return listRows(salesOrdersApi.list, search);
    case "DELIVERY_NOTE":
      return listRows(deliveryNotesApi.list, search);
    case "SALES_INVOICE":
      return listRows(salesInvoicesApi.list, search);
    case "CREDIT_NOTE":
      return listRows(creditNotesApi.list, search);
    case "PURCHASE_ORDER":
      return listRows(purchaseOrdersApi.list, search);
    case "GOODS_RECEIPT":
      return listRows(goodsReceiptsApi.list, search);
    case "PURCHASE_INVOICE":
      return listRows(purchaseInvoicesApi.list, search);
    case "DEBIT_NOTE":
      return listRows(debitNotesApi.list, search);
    case "QUALITY_INSPECTION":
      return listRows(qualityInspectionsApi.list, search);
    case "PACKAGE":
      return listRows(packagesApi.list, search);
    case "SHIPMENT":
      return listRows(shipmentsApi.list, search);
    case "SALES_RETURN":
      return listRows(salesReturnsApi.list, search);
    case "PURCHASE_RETURN":
      return listRows(purchaseReturnsApi.list, search);
    case "CUSTOMER_PAYMENT":
      return listRows(customerPaymentsApi.list, search);
    case "SUPPLIER_PAYMENT":
      return listRows(supplierPaymentsApi.list, search);
    default:
      return [];
  }
}
