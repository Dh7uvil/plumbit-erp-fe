export const HISTORY_PAGE_TITLE = "Approvals & History";

export type HistoryResourceSpec = {
  slug: string;
  entityType: string;
  listHref: string;
  label: string;
};

const HISTORY_RESOURCES = [
  { slug: "quotations", entityType: "quotation", listHref: "/quotations", label: "Quotations" },
  {
    slug: "proforma-invoices",
    entityType: "proforma_invoice",
    listHref: "/proforma-invoices",
    label: "Proforma invoices",
  },
  {
    slug: "sales-orders",
    entityType: "sales_order",
    listHref: "/sales-orders",
    label: "Sales orders",
  },
  {
    slug: "sales-invoices",
    entityType: "sales_invoice",
    listHref: "/sales-invoices",
    label: "Sales invoices",
  },
  {
    slug: "purchase-orders",
    entityType: "purchase_order",
    listHref: "/purchase-orders",
    label: "Purchase orders",
  },
  {
    slug: "purchase-invoices",
    entityType: "purchase_invoice",
    listHref: "/purchase-invoices",
    label: "Purchase invoices",
  },
  {
    slug: "credit-notes",
    entityType: "credit_note",
    listHref: "/credit-notes",
    label: "Credit notes",
  },
  { slug: "debit-notes", entityType: "debit_note", listHref: "/debit-notes", label: "Debit notes" },
  {
    slug: "goods-receipts",
    entityType: "goods_receipt",
    listHref: "/goods-receipts",
    label: "Goods receipts",
  },
  {
    slug: "quality-inspections",
    entityType: "quality_inspection",
    listHref: "/quality-inspections",
    label: "Quality inspections",
  },
  {
    slug: "delivery-notes",
    entityType: "delivery_note",
    listHref: "/delivery-notes",
    label: "Delivery notes",
  },
  {
    slug: "sales-returns",
    entityType: "sales_return",
    listHref: "/sales-returns",
    label: "Sales returns",
  },
  {
    slug: "purchase-returns",
    entityType: "purchase_return",
    listHref: "/purchase-returns",
    label: "Purchase returns",
  },
  { slug: "packages", entityType: "package", listHref: "/packages", label: "Packages" },
  { slug: "shipments", entityType: "shipment", listHref: "/shipments", label: "Shipments" },
  {
    slug: "stock-transfers",
    entityType: "stock_transfer",
    listHref: "/stock-transfers",
    label: "Stock transfers",
  },
  {
    slug: "stock-adjustments",
    entityType: "stock_adjustment",
    listHref: "/stock-adjustments",
    label: "Stock adjustments",
  },
  {
    slug: "customer-payments",
    entityType: "customer_payment",
    listHref: "/customer-payments",
    label: "Customer payments",
  },
  {
    slug: "supplier-payments",
    entityType: "supplier_payment",
    listHref: "/supplier-payments",
    label: "Supplier payments",
  },
  {
    slug: "landed-costs",
    entityType: "landed_cost",
    listHref: "/landed-costs",
    label: "Landed costs",
  },
  { slug: "journals", entityType: "journal_entry", listHref: "/journals", label: "Journals" },
  { slug: "customers", entityType: "customer", listHref: "/customers", label: "Customers" },
  { slug: "suppliers", entityType: "supplier", listHref: "/suppliers", label: "Suppliers" },
  {
    slug: "supplier-products",
    entityType: "supplier_product",
    listHref: "/supplier-products",
    label: "Supplier products",
  },
  { slug: "products", entityType: "product", listHref: "/products", label: "Products" },
  { slug: "contacts", entityType: "contact", listHref: "/contacts", label: "Contacts" },
  { slug: "accounts", entityType: "account", listHref: "/accounts", label: "Accounts" },
] as const satisfies readonly HistoryResourceSpec[];

export type HistoryResource = (typeof HISTORY_RESOURCES)[number]["slug"];

const BY_SLUG = new Map<string, HistoryResourceSpec>(
  HISTORY_RESOURCES.map((resource) => [resource.slug, resource]),
);
const BY_ENTITY_TYPE = new Map<string, HistoryResourceSpec>(
  HISTORY_RESOURCES.map((resource) => [resource.entityType, resource]),
);

export function getHistoryResource(slug: string): HistoryResourceSpec | undefined {
  return BY_SLUG.get(slug);
}

export function isHistoryResource(slug: string): slug is HistoryResource {
  return BY_SLUG.has(slug);
}

export function historyHref(resource: HistoryResource, id: string, code?: string | null): string {
  const path = `/history/${resource}/${id}`;
  if (!code) {
    return path;
  }
  return `${path}?code=${encodeURIComponent(code)}`;
}

export function historyHrefFromViewHref(
  viewHref: string,
  code?: string | null,
): string | undefined {
  const match = /^\/([^/]+)\/([^/?#]+)$/.exec(viewHref);
  if (!match) {
    return undefined;
  }
  const [, resource, id] = match;
  if (!isHistoryResource(resource)) {
    return undefined;
  }
  return historyHref(resource, id, code);
}

export function historyHrefForEntity(
  entityType: string,
  entityId: string,
  code?: string | null,
): string | undefined {
  const spec = BY_ENTITY_TYPE.get(entityType);
  if (!spec) {
    return undefined;
  }
  return historyHref(spec.slug as HistoryResource, entityId, code);
}

export function parseHistoryPath(
  pathname: string,
): { spec: HistoryResourceSpec; id: string } | undefined {
  const match = /^\/history\/([^/]+)\/([^/]+)$/.exec(pathname);
  if (!match) {
    return undefined;
  }
  const spec = getHistoryResource(match[1]);
  if (!spec) {
    return undefined;
  }
  return { spec, id: match[2] };
}
