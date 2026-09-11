export function normalizeDocumentType(value: string): string {
  return value.trim().replace(/[\s-]+/g, "_").toUpperCase();
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  QUOTATION: "Quotation",
  PROFORMA_INVOICE: "Proforma invoice",
  SALES_ORDER: "Sales order",
  DELIVERY_NOTE: "Delivery note",
  SALES_INVOICE: "Sales invoice",
  CREDIT_NOTE: "Credit note",
  PURCHASE_ORDER: "Purchase order",
  GOODS_RECEIPT: "Goods receipt",
  PURCHASE_INVOICE: "Purchase invoice",
  DEBIT_NOTE: "Debit note",
  QUALITY_INSPECTION: "Quality inspection",
  PACKAGE: "Package",
  SHIPMENT: "Shipment",
  SALES_RETURN: "Sales return",
  CUSTOMER_PAYMENT: "Customer receipt",
  SUPPLIER_PAYMENT: "Supplier payment",
  LANDED_COST: "Landed cost",
  OPENING_AR: "Opening AR",
  OPENING_AP: "Opening AP",
};

export function documentTypeDisplayLabel(value: string): string {
  const key = normalizeDocumentType(value);
  if (DOCUMENT_TYPE_LABELS[key]) {
    return DOCUMENT_TYPE_LABELS[key];
  }
  return key
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const DOCUMENT_HREF: Record<string, (id: string) => string> = {
  QUOTATION: (id) => `/quotations/${id}`,
  PROFORMA_INVOICE: (id) => `/proforma-invoices/${id}`,
  SALES_ORDER: (id) => `/sales-orders/${id}`,
  PURCHASE_ORDER: (id) => `/purchase-orders/${id}`,
  GOODS_RECEIPT: (id) => `/goods-receipts/${id}`,
  QUALITY_INSPECTION: (id) => `/quality-inspections/${id}`,
  PACKAGE: (id) => `/packages/${id}`,
  DELIVERY_NOTE: (id) => `/delivery-notes/${id}`,
  SHIPMENT: (id) => `/shipments/${id}`,
  SALES_INVOICE: (id) => `/sales-invoices/${id}`,
  SALES_RETURN: (id) => `/sales-returns/${id}`,
  PURCHASE_INVOICE: (id) => `/purchase-invoices/${id}`,
  CREDIT_NOTE: (id) => `/credit-notes/${id}`,
  DEBIT_NOTE: (id) => `/debit-notes/${id}`,
  CUSTOMER_PAYMENT: (id) => `/customer-payments/${id}`,
  SUPPLIER_PAYMENT: (id) => `/supplier-payments/${id}`,
  LANDED_COST: (id) => `/landed-costs/${id}`,
};

export function documentDetailHref(documentType: string, documentId: string): string | null {
  const builder = DOCUMENT_HREF[normalizeDocumentType(documentType)];
  return builder ? builder(documentId) : null;
}

export function hasRelatedDocumentType(
  documents: ReadonlyArray<{ document_type: string }>,
  documentType: string,
): boolean {
  const expected = normalizeDocumentType(documentType);
  return documents.some((document) => normalizeDocumentType(document.document_type) === expected);
}
