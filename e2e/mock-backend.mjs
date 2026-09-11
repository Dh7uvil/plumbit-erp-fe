import http from "node:http";

const PORT = Number(process.env.MOCK_API_PORT ?? 4010);
const TENANT_ID = "11111111-1111-4111-8111-111111111111";
const USER_ID = "22222222-2222-4222-8222-222222222222";
const SUPERADMIN_ROLE_ID = "33333333-3333-4333-8333-333333333333";
const EMPLOYEE_ROLE_ID = "66666666-6666-4666-8666-666666666666";
const CURRENCY_ID = "44444444-4444-4444-8444-444444444444";
const CUSTOMER_ID = "55555555-5555-4555-8555-555555555555";
const SUPPLIER_ID = "14141414-1414-4141-8141-141414141414";
const UNIT_ID = "88888888-8888-4888-8888-888888888888";
const PRODUCT_ID = "99999999-9999-4999-8999-999999999999";
const QC_PRODUCT_ID = "aaaa9999-9999-4999-8999-999999999aaa";
const WAREHOUSE_MAIN_ID = "12121212-1212-4121-8121-121212121212";
const WAREHOUSE_SITE_ID = "13131313-1313-4131-8131-131313131313";
const ACCOUNT_ASSETS_GROUP_ID = "a1000001-0000-4000-8000-000000000006";
const ACCOUNT_CASH_ID = "a1000001-0000-4000-8000-000000000001";
const ACCOUNT_BANK_ID = "a1000001-0000-4000-8000-000000000002";
const ACCOUNT_AR_ID = "a1000001-0000-4000-8000-000000000003";
const ACCOUNT_AP_ID = "a1000001-0000-4000-8000-000000000004";
const ACCOUNT_EQUITY_ID = "a1000001-0000-4000-8000-000000000005";
const SEEDED_JOURNAL_ID = "a2000001-0000-4000-8000-000000000001";
const ACCOUNT_SYSTEM_ROLES = [
  "ACCOUNTS_RECEIVABLE",
  "ACCOUNTS_PAYABLE",
  "SALES_REVENUE",
  "SALES_RETURNS",
  "PURCHASES",
  "INVENTORY",
  "COGS",
  "INVENTORY_ADJUSTMENT",
  "STOCK_SCRAP",
  "VAT_OUTPUT",
  "VAT_INPUT",
  "VAT_RCM_OUTPUT",
  "VAT_RCM_INPUT",
  "CUSTOMS_DUTY",
  "FREIGHT_IN",
  "PURCHASE_PRICE_VARIANCE",
  "ADVANCE_FROM_CUSTOMER",
  "ADVANCE_TO_SUPPLIER",
  "FX_GAIN_LOSS",
  "ROUND_OFF",
  "RETAINED_EARNINGS",
  "OPENING_BALANCE_EQUITY",
  "CASH_ON_HAND",
  "BANK",
  "SUSPENSE",
];
const EMAIL = "ada@plumbit.com";
const PASSWORD = "correct-horse";
const LIMITED_EMAIL = "reader@plumbit.com";
const LIMITED_USER_ID = "77777777-7777-4777-8777-777777777777";
const LIMITED_PASSWORD = "correct-horse";
const ORGANIZATION_NAME = process.env.NEXT_PUBLIC_ORGANIZATION_NAME ?? "Plumbit";
const RESET_TOKEN = "valid-reset-token";
const NOW = "2026-01-01T00:00:00.000Z";
const LOGO_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const EMPTY_LIST_PATHS = new Set([
  "/api/v1/activity",
  "/api/v1/branches",
  "/api/v1/categories",
  "/api/v1/contacts",
  "/api/v1/departments",
  "/api/v1/document-sequences",
  "/api/v1/exchange-rates",
  "/api/v1/payment-terms",
  "/api/v1/price-lists",
  "/api/v1/taxes",
  "/api/v1/terms-templates",
  "/api/v1/users",
]);

let currentPassword = PASSWORD;
let currentSessionKind = "superadmin";
let accessToken = "access-token-1";
let refreshToken = "refresh-token-1";
let quotations = new Map();
let quoteSeq = 0;
let salesOrders = new Map();
let soSeq = 0;
let salesInvoices = new Map();
let siSeq = 0;
let proformaInvoices = new Map();
let pfiSeq = 0;
let purchaseOrders = new Map();
let poSeq = 0;
let supplierProducts = new Map();
let adjustments = new Map();
let transfers = new Map();
let goodsReceipts = new Map();
let qualityInspections = new Map();
let deliveryNotes = new Map();
let packages = new Map();
let shipments = new Map();
let salesReturns = new Map();
let accounts = new Map();
let journals = new Map();
let jvSeq = 0;
let openingBalanceState = {
  committed: false,
  books_start_date: null,
  hard_lock_date: null,
  journal_entry_id: null,
  document_number: null,
  committed_at: null,
  can_reset: false,
};
let balances = new Map();
let movements = [];
let adjSeq = 0;
let xferSeq = 0;
let grnSeq = 0;
let qiSeq = 0;
let dnSeq = 0;
let pkgSeq = 0;
let shpSeq = 0;
let srSeq = 0;
let postReplays = new Map();
let attachments = new Map();
let attachmentSeq = 0;
let tenantLogoUrl = null;
let tenantState = {
  name: ORGANIZATION_NAME,
  timezone: "Asia/Dubai",
  default_currency: "AED",
  default_currency_id: CURRENCY_ID,
  quotation_requires_approval: true,
  sales_order_requires_approval: false,
  purchase_order_requires_approval: false,
  allow_negative_stock: false,
  costing_method: "FIFO",
  allow_over_receipt: false,
  over_receipt_tolerance_pct: null,
  qc_required_default: false,
  lock_date: null,
  hard_lock_date: null,
  lock_reason: null,
  hard_lock_reason: null,
  fiscal_year_start_month: 1,
  fiscal_year_start_day: 1,
  books_start_date: null,
};

function json(res, status, body) {
  res.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
}

function ok(res, data, status = 200) {
  json(res, status, { success: true, data });
}

function listOk(res, data) {
  json(res, 200, {
    success: true,
    data,
    meta: {
      page: 1,
      page_size: 100,
      total: data.length,
      total_pages: data.length > 0 ? 1 : 0,
    },
  });
}

function filterBySearch(items, search, fields) {
  const needle = String(search ?? "").trim().toLowerCase();
  if (!needle) {
    return items;
  }
  return items.filter((item) =>
    fields.some((field) => String(item[field] ?? "").toLowerCase().includes(needle)),
  );
}

function fail(res, status, code, message, details) {
  json(res, status, {
    success: false,
    error: details ? { code, message, details } : { code, message },
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function bearer(req) {
  const header = req.headers.authorization ?? "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

function unauthorized(req, res) {
  if (bearer(req) !== accessToken) {
    fail(res, 401, "AUTH_TOKEN_EXPIRED", "Expired");
    return true;
  }
  return false;
}

function drain(req) {
  return new Promise((resolve, reject) => {
    req.on("data", () => {});
    req.on("end", resolve);
    req.on("error", reject);
  });
}

function resetErpState() {
  quotations = new Map();
  quoteSeq = 0;
  salesOrders = new Map();
  soSeq = 0;
  salesInvoices = new Map();
  siSeq = 0;
  proformaInvoices = new Map();
  pfiSeq = 0;
  purchaseOrders = new Map();
  poSeq = 0;
  supplierProducts = new Map();
  adjustments = new Map();
  transfers = new Map();
  goodsReceipts = new Map();
  qualityInspections = new Map();
  balances = new Map();
  movements = [];
  adjSeq = 0;
  xferSeq = 0;
  grnSeq = 0;
  qiSeq = 0;
  postReplays = new Map();
  attachments = new Map();
  attachmentSeq = 0;
  tenantState.sales_order_requires_approval = false;
  tenantState.purchase_order_requires_approval = false;
  tenantState.allow_negative_stock = false;
  tenantState.costing_method = "FIFO";
  tenantState.allow_over_receipt = false;
  tenantState.over_receipt_tolerance_pct = null;
  tenantState.qc_required_default = false;
  tenantState.lock_date = null;
  tenantState.hard_lock_date = null;
  tenantState.lock_reason = null;
  tenantState.hard_lock_reason = null;
  tenantState.fiscal_year_start_month = 1;
  tenantState.fiscal_year_start_day = 1;
  tenantState.books_start_date = null;
  seedLedger();
}

function currency() {
  return {
    id: CURRENCY_ID,
    tenant_id: TENANT_ID,
    code: "AED",
    name: "UAE Dirham",
    symbol: "AED",
    decimal_places: 2,
    is_base: true,
    is_active: true,
    created_at: NOW,
    updated_at: NOW,
  };
}

function customer() {
  return {
    id: CUSTOMER_ID,
    tenant_id: TENANT_ID,
    name: "Acme Trading",
    code: "ACME",
    company_type: "CUSTOMER",
    trn: null,
    tax_treatment: "UNREGISTERED",
    currency_id: CURRENCY_ID,
    default_price_list_id: null,
    payment_terms_id: null,
    credit_limit: null,
    salesperson_id: null,
    billing_address: null,
    shipping_address: null,
    extra_addresses: [],
    notes: null,
    is_active: true,
    created_at: NOW,
    updated_at: NOW,
  };
}

function moneyProduct(quantity, rate) {
  const qty = Number(quantity);
  const unitRate = Number(rate);
  if (!Number.isFinite(qty) || !Number.isFinite(unitRate)) {
    return "0.00";
  }
  return (qty * unitRate).toFixed(2);
}

function buildLines(inputLines) {
  return (inputLines ?? []).map((line, index) => {
    const quantity = line.quantity ?? "1";
    const rate = line.rate ?? "0";
    return {
      id: crypto.randomUUID(),
      line_number: index + 1,
      product_id: line.product_id ?? null,
      description: line.description ?? "",
      quantity: String(quantity),
      unit_id: line.unit_id ?? null,
      rate: String(rate),
      discount_type: line.discount_type ?? null,
      discount_value: line.discount_value ?? null,
      discount_amount: "0",
      tax_id: line.tax_id ?? null,
      tax_rate: "0",
      tax_amount: "0",
      amount: moneyProduct(quantity, rate),
    };
  });
}

function quotationAvailableActions(status) {
  switch (status) {
    case "DRAFT":
      return ["submit", "cancel", "clone", "delete"];
    case "PENDING_APPROVAL":
      return ["approve", "reject", "clone"];
    case "APPROVED":
      return ["send", "reopen", "clone"];
    case "REJECTED":
      return ["reopen", "clone"];
    case "SENT":
      return ["accept", "decline", "clone"];
    case "ACCEPTED":
      return ["convert", "create_sales_invoice", "clone"];
    default:
      return ["clone"];
  }
}

function applyQuotationStatus(quotation, status) {
  quotation.status = status;
  quotation.version = (quotation.version ?? 1) + 1;
  quotation.available_actions = quotationAvailableActions(status);
  quotation.updated_at = new Date().toISOString();
  return quotation;
}

function buildQuotation(body, existing = null) {
  quoteSeq += existing ? 0 : 1;
  const id = existing?.id ?? crypto.randomUUID();
  const lines = buildLines(body.lines ?? existing?.lines ?? []);
  const subtotal = lines.reduce((sum, line) => sum + Number(line.amount), 0).toFixed(2);
  const now = new Date().toISOString();
  const quoteNumber = existing?.quote_number ?? `QUO-${String(quoteSeq).padStart(4, "0")}`;
  const quoteDate = body.quote_date ?? existing?.quote_date ?? "2026-08-27";
  const status = existing?.status ?? "DRAFT";
  return {
    id,
    tenant_id: TENANT_ID,
    quote_number: quoteNumber,
    document_number: quoteNumber,
    status,
    version: existing ? existing.version + 1 : 1,
    is_posted: false,
    quote_date: quoteDate,
    document_date: quoteDate,
    valid_until: body.valid_until ?? existing?.valid_until ?? null,
    branch_id: body.branch_id ?? existing?.branch_id ?? null,
    customer_id: body.customer_id ?? existing?.customer_id ?? CUSTOMER_ID,
    contact_id: body.contact_id ?? existing?.contact_id ?? null,
    customer_trn: existing?.customer_trn ?? null,
    tax_treatment: existing?.tax_treatment ?? "UNREGISTERED",
    place_of_supply: body.place_of_supply ?? existing?.place_of_supply ?? "DUBAI",
    currency_id: body.currency_id ?? existing?.currency_id ?? CURRENCY_ID,
    base_currency_id: existing?.base_currency_id ?? CURRENCY_ID,
    exchange_rate: existing?.exchange_rate ?? "1",
    price_list_id: body.price_list_id ?? existing?.price_list_id ?? null,
    payment_terms_id: body.payment_terms_id ?? existing?.payment_terms_id ?? null,
    salesperson_id: body.salesperson_id ?? existing?.salesperson_id ?? null,
    notes: body.notes ?? existing?.notes ?? null,
    terms_and_conditions: body.terms_and_conditions ?? existing?.terms_and_conditions ?? null,
    bill_to_snapshot: existing?.bill_to_snapshot ?? null,
    ship_to_snapshot: existing?.ship_to_snapshot ?? null,
    discount_type: body.discount_type ?? existing?.discount_type ?? null,
    discount_value: body.discount_value ?? existing?.discount_value ?? null,
    discount_amount: "0",
    shipping_amount: body.shipping_amount ?? existing?.shipping_amount ?? "0",
    adjustment_amount: body.adjustment_amount ?? existing?.adjustment_amount ?? "0",
    subtotal,
    tax_amount: "0",
    grand_total: subtotal,
    foreign_amount: subtotal,
    base_amount: subtotal,
    converted_at: null,
    converted_document_type: null,
    converted_document_id: null,
    related_documents: existing?.related_documents ?? [],
    available_actions: quotationAvailableActions(status),
    lines,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };
}

function unitRow() {
  return {
    id: UNIT_ID,
    tenant_id: TENANT_ID,
    code: "PCS",
    name: "Pieces",
    is_active: true,
    created_at: NOW,
    updated_at: NOW,
  };
}

function productRow() {
  return {
    id: PRODUCT_ID,
    tenant_id: TENANT_ID,
    item_type: "PRODUCT",
    sku: "PIPE-1",
    name: "Copper pipe",
    sales_description: "Copper pipe",
    unit_id: UNIT_ID,
    category_id: null,
    selling_rate: "10.00",
    purchase_rate: "8.00",
    purchase_description: "Copper pipe (purchase)",
    tax_id: null,
    hs_code: null,
    track_inventory: true,
    requires_qc: false,
    is_active: true,
    created_at: NOW,
    updated_at: NOW,
  };
}

function supplier() {
  return {
    id: SUPPLIER_ID,
    tenant_id: TENANT_ID,
    name: "Gulf Pipes",
    code: "GULF",
    company_type: "SUPPLIER",
    trn: null,
    tax_treatment: "UNREGISTERED",
    currency_id: CURRENCY_ID,
    default_price_list_id: null,
    payment_terms_id: null,
    credit_limit: null,
    salesperson_id: null,
    billing_address: null,
    shipping_address: null,
    extra_addresses: [],
    notes: null,
    is_active: true,
    created_at: NOW,
    updated_at: NOW,
  };
}

function mappedProductFields(productId) {
  if (productId === PRODUCT_ID) {
    const product = productRow();
    return {
      product_id: product.id,
      product_sku: product.sku,
      product_name: product.name,
      is_mapped: true,
    };
  }
  if (productId) {
    return {
      product_id: productId,
      product_sku: null,
      product_name: null,
      is_mapped: true,
    };
  }
  return {
    product_id: null,
    product_sku: null,
    product_name: null,
    is_mapped: false,
  };
}

function toSupplierProduct(body, existing = null) {
  const id = existing?.id ?? crypto.randomUUID();
  const now = new Date().toISOString();
  const productId =
    body.product_id === undefined ? (existing?.product_id ?? null) : (body.product_id ?? null);
  const mapped = mappedProductFields(productId);
  const supplierId = body.supplier_id ?? existing?.supplier_id ?? SUPPLIER_ID;
  const party = supplier();
  return {
    id,
    tenant_id: TENANT_ID,
    supplier_id: supplierId,
    supplier_name: supplierId === SUPPLIER_ID ? party.name : null,
    ...mapped,
    supplier_sku: body.supplier_sku ?? existing?.supplier_sku ?? "",
    supplier_item_name: body.supplier_item_name ?? existing?.supplier_item_name ?? "",
    supplier_description:
      body.supplier_description === undefined
        ? (existing?.supplier_description ?? null)
        : body.supplier_description,
    price: body.price === undefined ? (existing?.price ?? null) : body.price,
    currency_id: body.currency_id ?? existing?.currency_id ?? CURRENCY_ID,
    currency_code: "AED",
    price_updated_at: existing?.price_updated_at ?? (body.price ? now : null),
    is_preferred: body.is_preferred ?? existing?.is_preferred ?? false,
    is_preferred_supplier: body.is_preferred_supplier ?? existing?.is_preferred_supplier ?? false,
    notes: body.notes === undefined ? (existing?.notes ?? null) : body.notes,
    is_active: body.is_active ?? existing?.is_active ?? true,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };
}

function filterSupplierProducts(searchParams) {
  let rows = [...supplierProducts.values()];
  const supplierId = searchParams.get("supplier_id");
  const productId = searchParams.get("product_id");
  const mapped = searchParams.get("mapped");
  const isActive = searchParams.get("is_active");
  const search = (searchParams.get("search") ?? searchParams.get("q") ?? "").trim().toLowerCase();
  if (supplierId) {
    rows = rows.filter((row) => row.supplier_id === supplierId);
  }
  if (productId) {
    rows = rows.filter((row) => row.product_id === productId);
  }
  if (mapped === "true") {
    rows = rows.filter((row) => row.is_mapped);
  }
  if (mapped === "false") {
    rows = rows.filter((row) => !row.is_mapped);
  }
  if (isActive === "true") {
    rows = rows.filter((row) => row.is_active);
  }
  if (isActive === "false") {
    rows = rows.filter((row) => !row.is_active);
  }
  if (search) {
    rows = rows.filter(
      (row) =>
        row.supplier_sku.toLowerCase().includes(search) ||
        row.supplier_item_name.toLowerCase().includes(search) ||
        (row.supplier_description ?? "").toLowerCase().includes(search),
    );
  }
  return rows;
}

function salesOrderAvailableActions(status) {
  const requiresApproval = tenantState.sales_order_requires_approval;
  switch (status) {
    case "DRAFT":
      return requiresApproval
        ? ["submit", "cancel", "clone", "delete"]
        : ["confirm", "cancel", "clone", "delete"];
    case "PENDING_APPROVAL":
      return ["approve", "reject", "cancel", "clone"];
    case "APPROVED":
      return ["confirm", "cancel", "clone"];
    case "REJECTED":
      return ["reopen", "cancel", "clone"];
    case "CONFIRMED":
      return ["close", "cancel", "clone", "create_proforma"];
    case "CLOSED":
      return ["reopen", "clone"];
    default:
      return ["clone"];
  }
}

function purchaseOrderAvailableActions(status, receiptStatus) {
  const requiresApproval = tenantState.purchase_order_requires_approval;
  switch (status) {
    case "DRAFT":
      return requiresApproval
        ? ["submit", "cancel", "clone", "delete"]
        : ["issue", "cancel", "clone", "delete"];
    case "PENDING_APPROVAL":
      return ["approve", "reject", "cancel", "clone"];
    case "APPROVED":
      return ["issue", "cancel", "clone"];
    case "REJECTED":
      return ["reopen", "cancel", "clone"];
    case "ISSUED":
      return receiptStatus === "RECEIVED"
        ? ["close", "cancel", "clone"]
        : ["close", "cancel", "clone", "create_goods_receipt"];
    case "CLOSED":
      return ["reopen", "clone"];
    default:
      return ["clone"];
  }
}

function adjustReserved(warehouseId, productId, qty) {
  const balance = getBalance(warehouseId, productId);
  const next = Math.max(0, qtyNumber(balance.qty_reserved) + qtyNumber(qty));
  balance.qty_reserved = qtyString(next);
  balance.qty_available = qtyString(
    qtyNumber(balance.qty_on_hand) - next - qtyNumber(balance.qty_quality_hold ?? 0),
  );
  balance.updated_at = new Date().toISOString();
}

function applySalesOrderReservations(order, mode) {
  const warehouseId = order.warehouse_id ?? WAREHOUSE_MAIN_ID;
  const shortfalls = [];
  for (const line of order.lines ?? []) {
    if (!line.product_id) {
      continue;
    }
    const current = qtyNumber(line.qty_reserved ?? 0);
    if (mode === "release") {
      if (current > 0) {
        adjustReserved(warehouseId, line.product_id, -current);
      }
      line.qty_reserved = "0";
      continue;
    }
    const requested = Math.max(0, qtyNumber(line.quantity) - qtyNumber(line.qty_delivered ?? 0));
    const delta = requested - current;
    if (delta < 0) {
      adjustReserved(warehouseId, line.product_id, delta);
      line.qty_reserved = qtyString(requested);
    } else if (delta > 0) {
      const available = qtyNumber(getBalance(warehouseId, line.product_id).qty_available);
      const add = Math.min(delta, Math.max(available, 0));
      if (add > 0) {
        adjustReserved(warehouseId, line.product_id, add);
      }
      line.qty_reserved = qtyString(current + add);
    }
    const reserved = qtyNumber(line.qty_reserved ?? 0);
    const shortfall = requested - reserved;
    if (shortfall > 0) {
      shortfalls.push({
        sales_order_line_id: line.id,
        product_id: line.product_id,
        requested: qtyString(requested),
        reserved: qtyString(reserved),
        shortfall: qtyString(shortfall),
      });
    }
  }
  order.reservation_shortfalls = shortfalls;
}

function applySalesOrderStatus(order, status) {
  const previous = order.status;
  order.status = status;
  order.version = (order.version ?? 1) + 1;
  order.available_actions = salesOrderAvailableActions(status);
  order.updated_at = new Date().toISOString();
  if (status === "CONFIRMED") {
    order.confirmed_at = order.updated_at;
    order.confirmed_by = USER_ID;
    if (previous !== "CONFIRMED") {
      applySalesOrderReservations(order, "reserve");
    }
  }
  if (status === "CLOSED") {
    order.closed_at = order.updated_at;
    order.closed_by = USER_ID;
    if (previous === "CONFIRMED") {
      applySalesOrderReservations(order, "release");
    }
  }
  if (status === "CANCELLED") {
    order.cancelled_at = order.updated_at;
    order.cancelled_by = USER_ID;
    if (previous === "CONFIRMED") {
      applySalesOrderReservations(order, "release");
    }
  }
  return order;
}

function applyPurchaseOrderStatus(order, status) {
  order.status = status;
  order.version = (order.version ?? 1) + 1;
  order.available_actions = purchaseOrderAvailableActions(status, order.receipt_status);
  order.updated_at = new Date().toISOString();
  if (status === "ISSUED") {
    order.issued_at = order.updated_at;
    order.issued_by = USER_ID;
  }
  if (status === "CLOSED") {
    order.closed_at = order.updated_at;
    order.closed_by = USER_ID;
  }
  if (status === "CANCELLED") {
    order.cancelled_at = order.updated_at;
    order.cancelled_by = USER_ID;
  }
  return order;
}

function buildSalesOrderLines(inputLines) {
  return (inputLines ?? []).map((line, index) => {
    const quantity = line.quantity ?? "1";
    const rate = line.rate ?? "0";
    return {
      id: crypto.randomUUID(),
      line_number: index + 1,
      product_id: line.product_id ?? null,
      description: line.description ?? "",
      quantity: String(quantity),
      unit_id: line.unit_id ?? null,
      rate: String(rate),
      discount_type: line.discount_type ?? null,
      discount_value: line.discount_value ?? null,
      discount_amount: "0",
      tax_id: line.tax_id ?? null,
      tax_rate: "0",
      tax_amount: "0",
      amount: moneyProduct(quantity, rate),
      qty_delivered: line.qty_delivered ?? "0",
      qty_returned: line.qty_returned ?? "0",
      qty_reserved: line.qty_reserved ?? "0",
      qty_invoiced: line.qty_invoiced ?? "0",
      qty_converted: line.qty_converted ?? "0",
      qty_remaining_to_invoice: line.qty_remaining_to_invoice ?? String(quantity),
      source_quotation_line_id: line.source_quotation_line_id ?? null,
    };
  });
}

function buildPurchaseOrderLines(inputLines) {
  return (inputLines ?? []).map((line, index) => {
    const quantity = line.quantity ?? "1";
    const rate = line.rate ?? "0";
    const catalog = line.supplier_product_id
      ? supplierProducts.get(line.supplier_product_id)
      : null;
    return {
      id: crypto.randomUUID(),
      line_number: index + 1,
      product_id: line.product_id ?? catalog?.product_id ?? null,
      supplier_product_id: line.supplier_product_id ?? null,
      supplier_sku: line.supplier_sku ?? catalog?.supplier_sku ?? null,
      description: line.description ?? "",
      quantity: String(quantity),
      unit_id: line.unit_id ?? null,
      rate: String(rate),
      discount_type: line.discount_type ?? null,
      discount_value: line.discount_value ?? null,
      discount_amount: "0",
      tax_id: line.tax_id ?? null,
      tax_rate: "0",
      tax_amount: "0",
      amount: moneyProduct(quantity, rate),
      qty_received: line.qty_received ?? "0",
      qty_billed: line.qty_billed ?? "0",
    };
  });
}

function buildSalesOrder(body, existing = null, extras = {}) {
  soSeq += existing ? 0 : 1;
  const id = existing?.id ?? extras.id ?? crypto.randomUUID();
  const sourceLines = (body.lines ?? existing?.lines ?? []).map((line) => ({
    ...line,
    source_quotation_line_id:
      extras.fromQuotation && line.id ? line.id : (line.source_quotation_line_id ?? null),
  }));
  const lines = buildSalesOrderLines(sourceLines);
  const subtotal = lines.reduce((sum, line) => sum + Number(line.amount), 0).toFixed(2);
  const now = new Date().toISOString();
  const documentNumber = existing?.document_number ?? `SO-${String(soSeq).padStart(4, "0")}`;
  const orderDate = body.order_date ?? existing?.order_date ?? "2026-08-27";
  const status = extras.status ?? existing?.status ?? "DRAFT";
  return {
    id,
    tenant_id: TENANT_ID,
    document_number: documentNumber,
    status,
    version: existing ? existing.version + 1 : 1,
    is_posted: false,
    reference_number: body.reference_number ?? existing?.reference_number ?? null,
    order_date: orderDate,
    document_date: orderDate,
    expected_shipment_date: body.expected_shipment_date ?? existing?.expected_shipment_date ?? null,
    branch_id: body.branch_id ?? existing?.branch_id ?? null,
    warehouse_id: body.warehouse_id ?? existing?.warehouse_id ?? extras.warehouse_id ?? null,
    customer_id: body.customer_id ?? existing?.customer_id ?? CUSTOMER_ID,
    contact_id: body.contact_id ?? existing?.contact_id ?? null,
    customer_trn: existing?.customer_trn ?? extras.customer_trn ?? null,
    tax_treatment: existing?.tax_treatment ?? extras.tax_treatment ?? "UNREGISTERED",
    place_of_supply: body.place_of_supply ?? existing?.place_of_supply ?? "DUBAI",
    currency_id: body.currency_id ?? existing?.currency_id ?? CURRENCY_ID,
    base_currency_id: existing?.base_currency_id ?? CURRENCY_ID,
    exchange_rate: existing?.exchange_rate ?? "1",
    price_list_id: body.price_list_id ?? existing?.price_list_id ?? null,
    payment_terms_id: body.payment_terms_id ?? existing?.payment_terms_id ?? null,
    salesperson_id: body.salesperson_id ?? existing?.salesperson_id ?? null,
    notes: body.notes ?? existing?.notes ?? null,
    terms_and_conditions: body.terms_and_conditions ?? existing?.terms_and_conditions ?? null,
    bill_to_snapshot: existing?.bill_to_snapshot ?? extras.bill_to_snapshot ?? null,
    ship_to_snapshot: existing?.ship_to_snapshot ?? extras.ship_to_snapshot ?? null,
    discount_type: body.discount_type ?? existing?.discount_type ?? null,
    discount_value: body.discount_value ?? existing?.discount_value ?? null,
    discount_amount: "0",
    shipping_amount: body.shipping_amount ?? existing?.shipping_amount ?? "0",
    adjustment_amount: body.adjustment_amount ?? existing?.adjustment_amount ?? "0",
    subtotal,
    tax_amount: "0",
    grand_total: subtotal,
    foreign_amount: subtotal,
    base_amount: subtotal,
    fulfillment_status: existing?.fulfillment_status ?? "NOT_DELIVERED",
    billing_status: existing?.billing_status ?? "NOT_INVOICED",
    source_quotation_id: extras.source_quotation_id ?? existing?.source_quotation_id ?? null,
    source_proforma_invoice_id:
      extras.source_proforma_invoice_id ?? existing?.source_proforma_invoice_id ?? null,
    customer_po_number: body.customer_po_number ?? existing?.customer_po_number ?? null,
    customer_po_date: body.customer_po_date ?? existing?.customer_po_date ?? null,
    confirmed_at: existing?.confirmed_at ?? null,
    confirmed_by: existing?.confirmed_by ?? null,
    closed_at: existing?.closed_at ?? null,
    closed_by: existing?.closed_by ?? null,
    cancelled_at: existing?.cancelled_at ?? null,
    cancelled_by: existing?.cancelled_by ?? null,
    cancel_reason: body.reason ?? existing?.cancel_reason ?? null,
    available_actions: salesOrderAvailableActions(status),
    lines,
    reservation_shortfalls: existing?.reservation_shortfalls ?? [],
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };
}

function relatedDocumentRef(documentType, document, relationship, documentDate) {
  return {
    document_type: documentType,
    document_id: document.id,
    document_number: document.document_number,
    status: document.status,
    relationship,
    document_date: documentDate ?? null,
    quantity_summary: null,
  };
}

function buildSalesInvoiceFromSource(source, extras = {}) {
  siSeq += 1;
  const now = new Date().toISOString();
  const documentNumber = `SI-${String(siSeq).padStart(4, "0")}`;
  const invoiceDate = extras.invoice_date ?? source.quote_date ?? source.order_date ?? now.slice(0, 10);
  const lines = (source.lines ?? []).map((line, index) => ({
    id: crypto.randomUUID(),
    line_number: index + 1,
    product_id: line.product_id ?? null,
    description: line.description ?? "",
    quantity: String(line.quantity ?? "1"),
    unit_id: line.unit_id ?? null,
    rate: String(line.rate ?? "0"),
    sales_order_line_id: extras.sales_order_id ? line.id : null,
    source_quotation_line_id: extras.source_quotation_id ? line.id : null,
    source_proforma_invoice_line_id: extras.source_proforma_invoice_id ? line.id : null,
    delivery_note_id: null,
    delivery_note_line_id: null,
    discount_type: line.discount_type ?? null,
    discount_value: line.discount_value ?? null,
    discount_amount: line.discount_amount ?? "0",
    tax_id: line.tax_id ?? null,
    tax_rate: line.tax_rate ?? "0",
    tax_amount: line.tax_amount ?? "0",
    amount: line.amount ?? "0",
    income_account_id: null,
    cogs_amount: "0",
    cogs_status: "PENDING",
    qty_credited: "0",
  }));
  const subtotal = source.subtotal ?? "0";
  return {
    id: crypto.randomUUID(),
    tenant_id: TENANT_ID,
    document_number: documentNumber,
    status: "DRAFT",
    version: 1,
    is_posted: false,
    invoice_date: invoiceDate,
    document_date: invoiceDate,
    customer_id: source.customer_id,
    contact_id: source.contact_id ?? null,
    customer_trn: source.customer_trn ?? null,
    branch_id: source.branch_id ?? null,
    salesperson_id: source.salesperson_id ?? null,
    sales_order_id: extras.sales_order_id ?? null,
    source_quotation_id: extras.source_quotation_id ?? null,
    source_proforma_invoice_id: extras.source_proforma_invoice_id ?? null,
    payment_terms_id: source.payment_terms_id ?? null,
    due_date: null,
    tax_treatment: source.tax_treatment ?? "UNREGISTERED",
    place_of_supply: source.place_of_supply ?? "DUBAI",
    is_export: false,
    currency_id: source.currency_id,
    base_currency_id: source.base_currency_id ?? source.currency_id,
    exchange_rate: source.exchange_rate ?? "1",
    discount_type: source.discount_type ?? null,
    discount_value: source.discount_value ?? null,
    discount_amount: source.discount_amount ?? "0",
    shipping_amount: source.shipping_amount ?? "0",
    adjustment_amount: source.adjustment_amount ?? "0",
    round_off_amount: "0",
    subtotal,
    tax_amount: source.tax_amount ?? "0",
    grand_total: source.grand_total ?? subtotal,
    foreign_amount: source.foreign_amount ?? subtotal,
    base_amount: source.base_amount ?? subtotal,
    bill_to_snapshot: source.bill_to_snapshot ?? null,
    ship_to_snapshot: source.ship_to_snapshot ?? null,
    notes: extras.notes ?? source.notes ?? null,
    terms_and_conditions: source.terms_and_conditions ?? null,
    amount_paid: "0",
    amount_credited: "0",
    balance_due: source.grand_total ?? subtotal,
    payment_status: "UNPAID",
    cogs_amount: "0",
    cogs_status: "PENDING",
    journal_entry_id: null,
    reversal_journal_entry_id: null,
    export_evidence_ok: true,
    export_evidence_checked_at: null,
    posted_at: null,
    posted_by: null,
    cancelled_at: null,
    cancelled_by: null,
    cancel_reason: null,
    is_overdue: false,
    is_partially_credited: false,
    is_fully_credited: false,
    available_actions: ["post", "delete"],
    related_documents: extras.related_documents ?? [],
    lines,
    created_at: now,
    updated_at: now,
  };
}

function buildProformaInvoiceFromSalesOrder(order, extras = {}) {
  pfiSeq += 1;
  const now = new Date().toISOString();
  const documentNumber = `PFI-${String(pfiSeq).padStart(4, "0")}`;
  const proformaDate = extras.proforma_date ?? order.order_date ?? now.slice(0, 10);
  const lines = (order.lines ?? []).map((line, index) => ({
    id: crypto.randomUUID(),
    line_number: index + 1,
    product_id: line.product_id ?? null,
    description: line.description ?? "",
    quantity: String(line.quantity ?? "1"),
    unit_id: line.unit_id ?? null,
    rate: String(line.rate ?? "0"),
    discount_type: line.discount_type ?? null,
    discount_value: line.discount_value ?? null,
    discount_amount: line.discount_amount ?? "0",
    tax_id: line.tax_id ?? null,
    tax_rate: line.tax_rate ?? "0",
    tax_amount: line.tax_amount ?? "0",
    amount: line.amount ?? "0",
    source_sales_order_line_id: line.id,
    qty_converted: "0",
    qty_remaining: String(line.quantity ?? "1"),
  }));
  const subtotal = order.subtotal ?? "0";
  return {
    id: crypto.randomUUID(),
    tenant_id: TENANT_ID,
    document_number: documentNumber,
    status: "DRAFT",
    version: 1,
    is_posted: false,
    proforma_date: proformaDate,
    document_date: proformaDate,
    valid_until: extras.valid_until ?? null,
    branch_id: order.branch_id ?? null,
    customer_id: order.customer_id,
    contact_id: order.contact_id ?? null,
    customer_trn: order.customer_trn ?? null,
    tax_treatment: order.tax_treatment ?? "UNREGISTERED",
    place_of_supply: order.place_of_supply ?? "DUBAI",
    currency_id: order.currency_id,
    base_currency_id: order.base_currency_id ?? order.currency_id,
    exchange_rate: order.exchange_rate ?? "1",
    price_list_id: order.price_list_id ?? null,
    payment_terms_id: order.payment_terms_id ?? null,
    salesperson_id: order.salesperson_id ?? null,
    notes: extras.notes ?? order.notes ?? null,
    terms_and_conditions: order.terms_and_conditions ?? null,
    bill_to_snapshot: order.bill_to_snapshot ?? null,
    ship_to_snapshot: order.ship_to_snapshot ?? null,
    discount_type: order.discount_type ?? null,
    discount_value: order.discount_value ?? null,
    discount_amount: order.discount_amount ?? "0",
    shipping_amount: order.shipping_amount ?? "0",
    adjustment_amount: order.adjustment_amount ?? "0",
    subtotal,
    tax_amount: order.tax_amount ?? "0",
    grand_total: order.grand_total ?? subtotal,
    foreign_amount: order.foreign_amount ?? subtotal,
    base_amount: order.base_amount ?? subtotal,
    source_quotation_id: order.source_quotation_id ?? null,
    source_sales_order_id: order.id,
    converted_at: null,
    converted_document_type: null,
    converted_document_id: null,
    available_actions: ["send", "confirm", "delete"],
    related_documents: extras.related_documents ?? [],
    lines,
    milestones: [],
    created_at: now,
    updated_at: now,
  };
}

function buildPurchaseOrder(body, existing = null) {
  poSeq += existing ? 0 : 1;
  const id = existing?.id ?? crypto.randomUUID();
  const lines = buildPurchaseOrderLines(body.lines ?? existing?.lines ?? []);
  const subtotal = lines.reduce((sum, line) => sum + Number(line.amount), 0).toFixed(2);
  const now = new Date().toISOString();
  const documentNumber = existing?.document_number ?? `PO-${String(poSeq).padStart(4, "0")}`;
  const orderDate = body.order_date ?? existing?.order_date ?? "2026-08-27";
  const status = existing?.status ?? "DRAFT";
  return {
    id,
    tenant_id: TENANT_ID,
    document_number: documentNumber,
    status,
    version: existing ? existing.version + 1 : 1,
    is_posted: false,
    reference_number: body.reference_number ?? existing?.reference_number ?? null,
    order_date: orderDate,
    document_date: orderDate,
    expected_delivery_date: body.expected_delivery_date ?? existing?.expected_delivery_date ?? null,
    branch_id: body.branch_id ?? existing?.branch_id ?? null,
    warehouse_id: body.warehouse_id ?? existing?.warehouse_id ?? null,
    supplier_id: body.supplier_id ?? existing?.supplier_id ?? SUPPLIER_ID,
    contact_id: body.contact_id ?? existing?.contact_id ?? null,
    supplier_trn: existing?.supplier_trn ?? null,
    tax_treatment: existing?.tax_treatment ?? "UNREGISTERED",
    place_of_supply: body.place_of_supply ?? existing?.place_of_supply ?? "DUBAI",
    currency_id: body.currency_id ?? existing?.currency_id ?? CURRENCY_ID,
    base_currency_id: existing?.base_currency_id ?? CURRENCY_ID,
    exchange_rate: existing?.exchange_rate ?? "1",
    payment_terms_id: body.payment_terms_id ?? existing?.payment_terms_id ?? null,
    notes: body.notes ?? existing?.notes ?? null,
    terms_and_conditions: body.terms_and_conditions ?? existing?.terms_and_conditions ?? null,
    supplier_address_snapshot: existing?.supplier_address_snapshot ?? null,
    deliver_to_snapshot: existing?.deliver_to_snapshot ?? null,
    discount_type: body.discount_type ?? existing?.discount_type ?? null,
    discount_value: body.discount_value ?? existing?.discount_value ?? null,
    discount_amount: "0",
    shipping_amount: body.shipping_amount ?? existing?.shipping_amount ?? "0",
    adjustment_amount: body.adjustment_amount ?? existing?.adjustment_amount ?? "0",
    subtotal,
    tax_amount: "0",
    grand_total: subtotal,
    foreign_amount: subtotal,
    base_amount: subtotal,
    receipt_status: existing?.receipt_status ?? "NOT_RECEIVED",
    billing_status: existing?.billing_status ?? "NOT_INVOICED",
    issued_at: existing?.issued_at ?? null,
    issued_by: existing?.issued_by ?? null,
    closed_at: existing?.closed_at ?? null,
    closed_by: existing?.closed_by ?? null,
    cancelled_at: existing?.cancelled_at ?? null,
    cancelled_by: existing?.cancelled_by ?? null,
    cancel_reason: body.reason ?? existing?.cancel_reason ?? null,
    available_actions: purchaseOrderAvailableActions(status, existing?.receipt_status),
    lines,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };
}

function warehouseRow(id, code, name) {
  return {
    id,
    tenant_id: TENANT_ID,
    code,
    name,
    phone: null,
    address: null,
    is_default: id === WAREHOUSE_MAIN_ID,
    is_active: true,
    created_at: NOW,
    updated_at: NOW,
  };
}

function warehouses() {
  return [
    warehouseRow(WAREHOUSE_MAIN_ID, "MAIN", "Main warehouse"),
    warehouseRow(WAREHOUSE_SITE_ID, "SITE", "Site warehouse"),
  ];
}

function warehouseById(id) {
  return warehouses().find((row) => row.id === id) ?? null;
}

function qtyNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function qtyString(value) {
  return String(value);
}

function includesSearch(values, search) {
  const query = String(search ?? "")
    .trim()
    .toLowerCase();
  if (!query) {
    return true;
  }
  return values.some((value) =>
    String(value ?? "")
      .toLowerCase()
      .includes(query),
  );
}

function inDocumentDateRange(date, from, to) {
  const day = String(date ?? "").slice(0, 10);
  if (from && day < from) {
    return false;
  }
  if (to && day > to) {
    return false;
  }
  return true;
}

function hasLineProduct(document, productId) {
  if (!productId) {
    return true;
  }
  return (document.lines ?? []).some((line) => line.product_id === productId);
}

function balanceKey(warehouseId, productId) {
  return `${warehouseId}:${productId}`;
}

function emptyBalance(warehouseId, productId) {
  const warehouse = warehouseById(warehouseId);
  const product = productById(productId);
  return {
    id: crypto.randomUUID(),
    tenant_id: TENANT_ID,
    warehouse_id: warehouseId,
    warehouse_code: warehouse?.code ?? "WH",
    warehouse_name: warehouse?.name ?? "Warehouse",
    product_id: productId,
    sku: product.sku,
    product_name: product.name,
    qty_on_hand: "0",
    qty_reserved: "0",
    qty_quality_hold: "0",
    qty_available: "0",
    qty_incoming: "0",
    qty_outgoing: "0",
    qty_in_transit: "0",
    reorder_level: null,
    reorder_qty: null,
    last_movement_at: null,
    created_at: NOW,
    updated_at: NOW,
  };
}

function getBalance(warehouseId, productId) {
  const key = balanceKey(warehouseId, productId);
  if (!balances.has(key)) {
    balances.set(key, emptyBalance(warehouseId, productId));
  }
  const row = balances.get(key);
  row.qty_quality_hold = row.qty_quality_hold ?? "0";
  row.qty_available = qtyString(
    qtyNumber(row.qty_on_hand) - qtyNumber(row.qty_reserved) - qtyNumber(row.qty_quality_hold),
  );
  return row;
}

function applyMovement({
  warehouseId,
  productId,
  qty,
  movementType,
  sourceType,
  sourceId,
  sourceLineId,
  documentDate,
  notes,
}) {
  const delta = qtyNumber(qty);
  const balance = getBalance(warehouseId, productId);
  const available =
    qtyNumber(balance.qty_on_hand) -
    qtyNumber(balance.qty_reserved) -
    qtyNumber(balance.qty_quality_hold ?? 0);
  if (delta < 0 && available + delta < 0 && !tenantState.allow_negative_stock) {
    const err = new Error("INSUFFICIENT");
    err.details = {
      warehouse_id: warehouseId,
      warehouse_code: balance.warehouse_code,
      product_id: productId,
      available_qty: qtyString(available),
      requested_qty: qtyString(Math.abs(delta)),
    };
    throw err;
  }
  const before = qtyNumber(balance.qty_on_hand);
  const after = before + delta;
  balance.qty_on_hand = qtyString(after);
  balance.qty_available = qtyString(
    after - qtyNumber(balance.qty_reserved) - qtyNumber(balance.qty_quality_hold ?? 0),
  );
  balance.last_movement_at = new Date().toISOString();
  balance.updated_at = balance.last_movement_at;
  const movement = {
    id: crypto.randomUUID(),
    tenant_id: TENANT_ID,
    movement_type: movementType,
    warehouse_id: warehouseId,
    warehouse_code: balance.warehouse_code,
    warehouse_name: balance.warehouse_name,
    product_id: productId,
    sku: balance.sku,
    product_name: balance.product_name,
    unit_id: UNIT_ID,
    qty: qtyString(delta),
    qty_before: qtyString(before),
    qty_after: qtyString(after),
    source_type: sourceType,
    source_id: sourceId,
    source_line_id: sourceLineId ?? null,
    document_date: documentDate,
    occurred_at: balance.last_movement_at,
    notes: notes ?? null,
    created_at: balance.last_movement_at,
  };
  movements.push(movement);
  return balance;
}

function draftActions() {
  return ["post", "cancel", "clone", "delete"];
}

function goodsReceiptActions(document) {
  if (document.status === "DRAFT") {
    return ["post", "cancel", "delete"];
  }
  if (document.status === "POSTED") {
    const actions = ["cancel"];
    if (document.qc_status === "PENDING" || document.qc_status === "PARTIAL") {
      actions.push("create_inspection");
    }
    return actions;
  }
  return [];
}

function qualityInspectionActions(status) {
  if (status === "DRAFT") {
    return ["approve", "cancel", "delete"];
  }
  return [];
}

function deliveryNoteActions(status) {
  if (status === "DRAFT") {
    return ["post", "cancel", "delete"];
  }
  if (status === "POSTED") {
    return ["cancel", "create_return"];
  }
  return [];
}

function packageActions(status) {
  if (status === "DRAFT") {
    return ["pack", "cancel", "delete", "print"];
  }
  if (status === "PACKED") {
    return ["cancel", "print"];
  }
  return ["print"];
}

function shipmentActions(status) {
  if (status === "DRAFT") {
    return ["dispatch", "cancel", "delete"];
  }
  if (status === "DISPATCHED") {
    return ["arrive", "cancel", "tracking"];
  }
  if (status === "IN_TRANSIT" || status === "ARRIVED") {
    return ["close", "tracking"];
  }
  return [];
}

function salesReturnActions(status) {
  if (status === "DRAFT") {
    return ["post", "cancel", "delete"];
  }
  if (status === "POSTED") {
    return ["cancel"];
  }
  return [];
}

function packedQtyForLine(salesOrderLineId) {
  let packed = 0;
  for (const pkg of packages.values()) {
    if (pkg.status === "CANCELLED") {
      continue;
    }
    for (const line of pkg.lines ?? []) {
      if (line.sales_order_line_id === salesOrderLineId) {
        packed += qtyNumber(line.quantity);
      }
    }
  }
  return packed;
}

function salesOrderCoverage(order) {
  return {
    sales_order_id: order.id,
    lines: (order.lines ?? []).map((line) => {
      const quantity = qtyNumber(line.quantity);
      const reserved = qtyNumber(line.qty_reserved ?? 0);
      const delivered = qtyNumber(line.qty_delivered ?? 0);
      const returned = qtyNumber(line.qty_returned ?? 0);
      return {
        sales_order_line_id: line.id,
        product_id: line.product_id ?? null,
        description: line.description ?? "",
        quantity: qtyString(quantity),
        qty_covered: "0",
        qty_uncovered: qtyString(quantity),
        qty_received: "0",
        qty_reserved: qtyString(reserved),
        qty_delivered: qtyString(delivered),
        qty_returned: qtyString(returned),
        purchase_orders: [],
      };
    }),
  };
}

function salesOrderDeliverableLines(order) {
  return (order.lines ?? []).map((line) => {
    const quantity = qtyNumber(line.quantity);
    const delivered = qtyNumber(line.qty_delivered ?? 0);
    const returned = qtyNumber(line.qty_returned ?? 0);
    const outstanding = Math.max(0, quantity - delivered + returned);
    return {
      sales_order_line_id: line.id,
      product_id: line.product_id ?? null,
      description: line.description ?? "",
      unit_id: line.unit_id ?? null,
      rate: String(line.rate ?? "0"),
      quantity: qtyString(quantity),
      qty_delivered: qtyString(delivered),
      qty_returned: qtyString(returned),
      qty_reserved: qtyString(line.qty_reserved ?? 0),
      outstanding: qtyString(outstanding),
    };
  });
}

function salesOrderPackableLines(order) {
  return (order.lines ?? []).map((line) => {
    const quantity = qtyNumber(line.quantity);
    const packed = packedQtyForLine(line.id);
    return {
      sales_order_line_id: line.id,
      product_id: line.product_id ?? null,
      description: line.description ?? "",
      unit_id: line.unit_id ?? null,
      quantity: qtyString(quantity),
      qty_packed: qtyString(packed),
      outstanding: qtyString(Math.max(0, quantity - packed)),
    };
  });
}

function salesOrderTracker(order) {
  const rows = [
    {
      stage: "SALES_ORDER",
      document_type: "SALES_ORDER",
      document_number: order.document_number,
      document_id: order.id,
      status: order.status,
      document_date: order.order_date ?? order.document_date ?? null,
      quantity_summary: null,
    },
  ];
  for (const note of deliveryNotes.values()) {
    if (note.sales_order_id === order.id) {
      rows.push({
        stage: "DELIVERY_NOTE",
        document_type: "DELIVERY_NOTE",
        document_number: note.document_number,
        document_id: note.id,
        status: note.status,
        document_date: note.document_date,
        quantity_summary: null,
      });
    }
  }
  for (const pkg of packages.values()) {
    if (pkg.sales_order_id === order.id) {
      rows.push({
        stage: "PACKAGE",
        document_type: "PACKAGE",
        document_number: pkg.document_number,
        document_id: pkg.id,
        status: pkg.status,
        document_date: null,
        quantity_summary: null,
      });
    }
  }
  return { sales_order_id: order.id, rows };
}

function buildDeliveryNote(body, existing = null) {
  dnSeq += existing ? 0 : 1;
  const id = existing?.id ?? crypto.randomUUID();
  const now = new Date().toISOString();
  const order = salesOrders.get(body.sales_order_id ?? existing?.sales_order_id);
  const lines = (body.lines ?? existing?.lines ?? []).map((line, index) => ({
    id: line.id ?? crypto.randomUUID(),
    line_number: index + 1,
    sales_order_line_id: line.sales_order_line_id,
    product_id: line.product_id ?? null,
    description: line.description ?? "",
    quantity: String(line.quantity ?? "0"),
    unit_id: line.unit_id ?? null,
    rate: String(line.rate ?? "0"),
  }));
  const status = existing?.status ?? "DRAFT";
  return {
    id,
    tenant_id: TENANT_ID,
    document_number: existing?.document_number ?? `DN-${String(dnSeq).padStart(4, "0")}`,
    status,
    version: existing ? existing.version + 1 : 1,
    is_posted: status === "POSTED",
    document_date: body.document_date ?? existing?.document_date ?? NOW.slice(0, 10),
    sales_order_id: body.sales_order_id ?? existing?.sales_order_id,
    customer_id: existing?.customer_id ?? order?.customer_id ?? CUSTOMER_ID,
    warehouse_id: body.warehouse_id ?? existing?.warehouse_id ?? order?.warehouse_id ?? WAREHOUSE_MAIN_ID,
    branch_id: body.branch_id ?? existing?.branch_id ?? null,
    shipment_id: existing?.shipment_id ?? null,
    tax_treatment: existing?.tax_treatment ?? order?.tax_treatment ?? "UNREGISTERED",
    place_of_supply: existing?.place_of_supply ?? order?.place_of_supply ?? "DUBAI",
    currency_id: body.currency_id ?? existing?.currency_id ?? order?.currency_id ?? CURRENCY_ID,
    base_currency_id: existing?.base_currency_id ?? CURRENCY_ID,
    exchange_rate: existing?.exchange_rate ?? "1",
    vehicle_number: body.vehicle_number ?? existing?.vehicle_number ?? null,
    driver_name: body.driver_name ?? existing?.driver_name ?? null,
    driver_contact: body.driver_contact ?? existing?.driver_contact ?? null,
    notes: body.notes ?? existing?.notes ?? null,
    posted_at: existing?.posted_at ?? null,
    posted_by: existing?.posted_by ?? null,
    cancelled_at: existing?.cancelled_at ?? null,
    cancelled_by: existing?.cancelled_by ?? null,
    cancel_reason: body.reason ?? existing?.cancel_reason ?? null,
    available_actions: deliveryNoteActions(status),
    lines,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };
}

function postDeliveryNote(document) {
  const order = salesOrders.get(document.sales_order_id);
  for (const line of document.lines ?? []) {
    if (!line.product_id) {
      continue;
    }
    const qty = qtyNumber(line.quantity);
    const soLine = order?.lines.find((row) => row.id === line.sales_order_line_id);
    const reserved = qtyNumber(soLine?.qty_reserved ?? 0);
    const release = Math.min(reserved, qty);
    if (release > 0 && soLine) {
      adjustReserved(document.warehouse_id, line.product_id, -release);
      soLine.qty_reserved = qtyString(reserved - release);
    }
    applyMovement({
      warehouseId: document.warehouse_id,
      productId: line.product_id,
      qty: -qty,
      movementType: "SALE",
      sourceType: "delivery_note",
      sourceId: document.id,
      sourceLineId: line.id,
      documentDate: document.document_date,
    });
    if (soLine) {
      soLine.qty_delivered = qtyString(qtyNumber(soLine.qty_delivered ?? 0) + qty);
    }
  }
  if (order) {
    salesOrders.set(order.id, order);
  }
  const now = new Date().toISOString();
  document.status = "POSTED";
  document.is_posted = true;
  document.posted_at = now;
  document.posted_by = USER_ID;
  document.version += 1;
  document.updated_at = now;
  document.available_actions = deliveryNoteActions("POSTED");
  return document;
}

function buildPackage(body, existing = null) {
  pkgSeq += existing ? 0 : 1;
  const id = existing?.id ?? crypto.randomUUID();
  const now = new Date().toISOString();
  const status = existing?.status ?? "DRAFT";
  const lines = (body.lines ?? existing?.lines ?? []).map((line, index) => ({
    id: line.id ?? crypto.randomUUID(),
    line_number: index + 1,
    sales_order_line_id: line.sales_order_line_id,
    product_id: line.product_id ?? null,
    quantity: String(line.quantity ?? "0"),
    unit_id: line.unit_id ?? null,
  }));
  return {
    id,
    tenant_id: TENANT_ID,
    document_number: existing?.document_number ?? `PKG-${String(pkgSeq).padStart(4, "0")}`,
    status,
    version: existing ? existing.version + 1 : 1,
    sales_order_id: body.sales_order_id ?? existing?.sales_order_id,
    delivery_note_id: body.delivery_note_id ?? existing?.delivery_note_id ?? null,
    package_number: body.package_number ?? existing?.package_number ?? null,
    length: body.length ?? existing?.length ?? null,
    width: body.width ?? existing?.width ?? null,
    height: body.height ?? existing?.height ?? null,
    dimension_unit: body.dimension_unit ?? existing?.dimension_unit ?? "cm",
    gross_weight: body.gross_weight ?? existing?.gross_weight ?? null,
    net_weight: body.net_weight ?? existing?.net_weight ?? null,
    weight_unit: body.weight_unit ?? existing?.weight_unit ?? null,
    shipping_marks: body.shipping_marks ?? existing?.shipping_marks ?? null,
    notes: body.notes ?? existing?.notes ?? null,
    available_actions: packageActions(status),
    lines,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };
}

function buildShipment(body, existing = null) {
  shpSeq += existing ? 0 : 1;
  const id = existing?.id ?? crypto.randomUUID();
  const now = new Date().toISOString();
  const status = existing?.status ?? "DRAFT";
  return {
    id,
    tenant_id: TENANT_ID,
    document_number: existing?.document_number ?? `SHP-${String(shpSeq).padStart(4, "0")}`,
    status,
    version: existing ? existing.version + 1 : 1,
    shipment_type: body.shipment_type ?? existing?.shipment_type ?? "DOMESTIC",
    transport_mode: body.transport_mode ?? existing?.transport_mode ?? "ROAD",
    incoterm: body.incoterm ?? existing?.incoterm ?? null,
    container_number: body.container_number ?? existing?.container_number ?? null,
    seal_number: body.seal_number ?? existing?.seal_number ?? null,
    carrier_name: body.carrier_name ?? existing?.carrier_name ?? null,
    vessel_or_flight_no: body.vessel_or_flight_no ?? existing?.vessel_or_flight_no ?? null,
    voyage_number: body.voyage_number ?? existing?.voyage_number ?? null,
    bl_awb_number: body.bl_awb_number ?? existing?.bl_awb_number ?? null,
    bl_awb_date: body.bl_awb_date ?? existing?.bl_awb_date ?? null,
    freight_forwarder_id: body.freight_forwarder_id ?? existing?.freight_forwarder_id ?? null,
    port_of_loading: body.port_of_loading ?? existing?.port_of_loading ?? null,
    port_of_discharge: body.port_of_discharge ?? existing?.port_of_discharge ?? null,
    etd: body.etd ?? existing?.etd ?? null,
    eta: body.eta ?? existing?.eta ?? null,
    actual_departure_date: body.actual_departure_date ?? existing?.actual_departure_date ?? null,
    actual_arrival_date: body.actual_arrival_date ?? existing?.actual_arrival_date ?? null,
    gross_weight: body.gross_weight ?? existing?.gross_weight ?? null,
    net_weight: body.net_weight ?? existing?.net_weight ?? null,
    total_packages: body.total_packages ?? existing?.total_packages ?? null,
    notes: body.notes ?? existing?.notes ?? null,
    available_actions: shipmentActions(status),
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };
}

function buildSalesReturn(body, existing = null) {
  srSeq += existing ? 0 : 1;
  const id = existing?.id ?? crypto.randomUUID();
  const now = new Date().toISOString();
  const note = deliveryNotes.get(body.delivery_note_id ?? existing?.delivery_note_id);
  const status = existing?.status ?? "DRAFT";
  const lines = (body.lines ?? existing?.lines ?? []).map((line, index) => ({
    id: line.id ?? crypto.randomUUID(),
    line_number: index + 1,
    delivery_note_line_id: line.delivery_note_line_id,
    product_id: line.product_id ?? null,
    quantity: String(line.quantity ?? "0"),
    unit_id: line.unit_id ?? null,
    rate: String(line.rate ?? "0"),
    disposition: line.disposition ?? "RESTOCK",
    notes: line.notes ?? null,
  }));
  return {
    id,
    tenant_id: TENANT_ID,
    document_number: existing?.document_number ?? `SR-${String(srSeq).padStart(4, "0")}`,
    status,
    version: existing ? existing.version + 1 : 1,
    is_posted: status === "POSTED",
    document_date: body.document_date ?? existing?.document_date ?? NOW.slice(0, 10),
    delivery_note_id: body.delivery_note_id ?? existing?.delivery_note_id,
    sales_order_id: existing?.sales_order_id ?? note?.sales_order_id,
    customer_id: existing?.customer_id ?? note?.customer_id ?? CUSTOMER_ID,
    warehouse_id: existing?.warehouse_id ?? note?.warehouse_id ?? WAREHOUSE_MAIN_ID,
    reason_code: body.reason_code ?? existing?.reason_code ?? "OTHER",
    notes: body.notes ?? existing?.notes ?? null,
    posted_at: existing?.posted_at ?? null,
    posted_by: existing?.posted_by ?? null,
    cancelled_at: existing?.cancelled_at ?? null,
    cancelled_by: existing?.cancelled_by ?? null,
    cancel_reason: body.reason ?? existing?.cancel_reason ?? null,
    available_actions: salesReturnActions(status),
    lines,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };
}

function postSalesReturn(document) {
  const order = salesOrders.get(document.sales_order_id);
  for (const line of document.lines ?? []) {
    if (!line.product_id) {
      continue;
    }
    const qty = qtyNumber(line.quantity);
    if (line.disposition === "QC_HOLD") {
      applyMovement({
        warehouseId: document.warehouse_id,
        productId: line.product_id,
        qty,
        movementType: "RETURN_IN",
        sourceType: "sales_return",
        sourceId: document.id,
        sourceLineId: line.id,
        documentDate: document.document_date,
      });
      const balance = getBalance(document.warehouse_id, line.product_id);
      balance.qty_quality_hold = qtyString(qtyNumber(balance.qty_quality_hold) + qty);
      getBalance(document.warehouse_id, line.product_id);
    } else if (line.disposition === "SCRAP") {
      applyMovement({
        warehouseId: document.warehouse_id,
        productId: line.product_id,
        qty,
        movementType: "RETURN_IN",
        sourceType: "sales_return",
        sourceId: document.id,
        sourceLineId: line.id,
        documentDate: document.document_date,
      });
      applyMovement({
        warehouseId: document.warehouse_id,
        productId: line.product_id,
        qty: -qty,
        movementType: "DAMAGE",
        sourceType: "sales_return",
        sourceId: document.id,
        sourceLineId: line.id,
        documentDate: document.document_date,
      });
    } else {
      applyMovement({
        warehouseId: document.warehouse_id,
        productId: line.product_id,
        qty,
        movementType: "RETURN_IN",
        sourceType: "sales_return",
        sourceId: document.id,
        sourceLineId: line.id,
        documentDate: document.document_date,
      });
    }
    const soLine = order?.lines.find((row) => {
      const note = deliveryNotes.get(document.delivery_note_id);
      const dnLine = note?.lines.find((item) => item.id === line.delivery_note_line_id);
      return dnLine && row.id === dnLine.sales_order_line_id;
    });
    if (soLine) {
      soLine.qty_returned = qtyString(qtyNumber(soLine.qty_returned ?? 0) + qty);
    }
  }
  if (order) {
    salesOrders.set(order.id, order);
  }
  const now = new Date().toISOString();
  document.status = "POSTED";
  document.is_posted = true;
  document.posted_at = now;
  document.posted_by = USER_ID;
  document.version += 1;
  document.updated_at = now;
  document.available_actions = salesReturnActions("POSTED");
  return document;
}

function productRequiresQc(productId) {
  return productById(productId).requires_qc === true;
}

function productById(productId) {
  if (productId === QC_PRODUCT_ID) {
    return qcProductRow();
  }
  return productRow();
}

function qcProductRow() {
  return {
    ...productRow(),
    id: QC_PRODUCT_ID,
    sku: "PIPE-QC",
    name: "QC copper pipe",
    requires_qc: true,
  };
}

function buildGoodsReceiptLines(inputLines) {
  return (inputLines ?? []).map((line, index) => ({
    id: line.id ?? crypto.randomUUID(),
    line_number: index + 1,
    purchase_order_line_id: line.purchase_order_line_id ?? null,
    product_id: line.product_id ?? PRODUCT_ID,
    supplier_product_id: line.supplier_product_id ?? null,
    supplier_sku: line.supplier_sku ?? null,
    description: line.description ?? "",
    quantity: String(line.quantity ?? "1"),
    unit_id: line.unit_id ?? UNIT_ID,
    rate: String(line.rate ?? "0"),
    net_weight: line.net_weight ?? null,
    gross_weight: line.gross_weight ?? null,
    qty_accepted: line.qty_accepted ?? "0",
    qty_rejected: line.qty_rejected ?? "0",
    qty_on_hold: line.qty_on_hold ?? "0",
  }));
}

function buildGoodsReceipt(body, existing = null) {
  grnSeq += existing ? 0 : 1;
  const now = new Date().toISOString();
  const documentNumber = existing?.document_number ?? `GRN-${String(grnSeq).padStart(4, "0")}`;
  const lines = buildGoodsReceiptLines(body.lines ?? existing?.lines ?? []);
  const status = existing?.status ?? "DRAFT";
  const document = {
    id: existing?.id ?? crypto.randomUUID(),
    tenant_id: TENANT_ID,
    document_number: documentNumber,
    status,
    version: existing ? existing.version + 1 : 1,
    is_posted: status === "POSTED",
    document_date: body.document_date ?? existing?.document_date ?? NOW.slice(0, 10),
    supplier_id: body.supplier_id ?? existing?.supplier_id ?? SUPPLIER_ID,
    warehouse_id: body.warehouse_id ?? existing?.warehouse_id ?? WAREHOUSE_MAIN_ID,
    purchase_order_id:
      body.purchase_order_id === undefined
        ? (existing?.purchase_order_id ?? null)
        : body.purchase_order_id,
    branch_id: body.branch_id ?? existing?.branch_id ?? null,
    tax_treatment: existing?.tax_treatment ?? "UNREGISTERED",
    place_of_supply: existing?.place_of_supply ?? "DUBAI",
    currency_id: body.currency_id ?? existing?.currency_id ?? CURRENCY_ID,
    base_currency_id: existing?.base_currency_id ?? CURRENCY_ID,
    exchange_rate: existing?.exchange_rate ?? "1",
    supplier_invoice_number:
      body.supplier_invoice_number ?? existing?.supplier_invoice_number ?? null,
    delivery_challan_number:
      body.delivery_challan_number ?? existing?.delivery_challan_number ?? null,
    bill_of_entry_number: body.bill_of_entry_number ?? existing?.bill_of_entry_number ?? null,
    bill_of_entry_date: body.bill_of_entry_date ?? existing?.bill_of_entry_date ?? null,
    container_number: body.container_number ?? existing?.container_number ?? null,
    bl_number: body.bl_number ?? existing?.bl_number ?? null,
    notes: body.notes ?? existing?.notes ?? null,
    qc_status: existing?.qc_status ?? "NOT_REQUIRED",
    posted_at: existing?.posted_at ?? null,
    posted_by: existing?.posted_by ?? null,
    cancelled_at: existing?.cancelled_at ?? null,
    cancelled_by: existing?.cancelled_by ?? null,
    cancel_reason: existing?.cancel_reason ?? null,
    available_actions: goodsReceiptActions({ status, qc_status: existing?.qc_status ?? "NOT_REQUIRED" }),
    lines,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };
  document.available_actions = goodsReceiptActions(document);
  return document;
}

function createGoodsReceiptFromPurchaseOrder(body) {
  const order = purchaseOrders.get(body.purchase_order_id);
  if (!order) {
    const err = new Error("NOT_FOUND");
    throw err;
  }
  const outstanding = (order.lines ?? []).filter(
    (line) => qtyNumber(line.quantity) - qtyNumber(line.qty_received) > 0,
  );
  const lines = outstanding.map((line) => ({
    purchase_order_line_id: line.id,
    product_id: line.product_id ?? PRODUCT_ID,
    supplier_product_id: line.supplier_product_id ?? null,
    supplier_sku: line.supplier_sku ?? null,
    description: line.description,
    quantity: qtyString(qtyNumber(line.quantity) - qtyNumber(line.qty_received)),
    unit_id: line.unit_id ?? UNIT_ID,
    rate: line.rate,
  }));
  return buildGoodsReceipt({
    supplier_id: order.supplier_id,
    warehouse_id: body.warehouse_id ?? order.warehouse_id ?? WAREHOUSE_MAIN_ID,
    document_date: body.document_date ?? NOW.slice(0, 10),
    purchase_order_id: order.id,
    notes: body.notes ?? null,
    lines,
  });
}

function refreshPoReceipt(order) {
  const lines = order.lines ?? [];
  const total = lines.reduce((sum, line) => sum + qtyNumber(line.quantity), 0);
  const received = lines.reduce((sum, line) => sum + qtyNumber(line.qty_received), 0);
  if (received <= 0) {
    order.receipt_status = "NOT_RECEIVED";
  } else if (received + 0.0001 >= total) {
    order.receipt_status = "RECEIVED";
  } else {
    order.receipt_status = "PARTIALLY_RECEIVED";
  }
  order.available_actions = purchaseOrderAvailableActions(order.status, order.receipt_status);
}

function postGoodsReceipt(document) {
  const needsQc = document.lines.some((line) => productRequiresQc(line.product_id));
  const postedLines = document.lines.map((line) => {
    const hold = productRequiresQc(line.product_id) ? line.quantity : "0";
    if (line.product_id) {
      applyMovement({
        warehouseId: document.warehouse_id,
        productId: line.product_id,
        qty: line.quantity,
        movementType: "PURCHASE",
        sourceType: "goods_receipt",
        sourceId: document.id,
        sourceLineId: line.id,
        documentDate: document.document_date,
      });
      if (productRequiresQc(line.product_id)) {
        const balance = getBalance(document.warehouse_id, line.product_id);
        balance.qty_quality_hold = qtyString(qtyNumber(balance.qty_quality_hold) + qtyNumber(line.quantity));
        getBalance(document.warehouse_id, line.product_id);
      }
    }
    return { ...line, qty_on_hold: hold, qty_accepted: "0", qty_rejected: "0" };
  });
  if (document.purchase_order_id) {
    const order = purchaseOrders.get(document.purchase_order_id);
    if (order) {
      for (const line of postedLines) {
        if (!line.purchase_order_line_id) {
          continue;
        }
        const poLine = order.lines.find((item) => item.id === line.purchase_order_line_id);
        if (poLine) {
          poLine.qty_received = qtyString(qtyNumber(poLine.qty_received) + qtyNumber(line.quantity));
        }
      }
      refreshPoReceipt(order);
      purchaseOrders.set(order.id, order);
    }
  }
  const now = new Date().toISOString();
  const posted = {
    ...document,
    status: "POSTED",
    is_posted: true,
    version: document.version + 1,
    posted_at: now,
    posted_by: USER_ID,
    qc_status: needsQc ? "PENDING" : "NOT_REQUIRED",
    lines: postedLines,
    updated_at: now,
  };
  posted.available_actions = goodsReceiptActions(posted);
  if (needsQc) {
    const inspection = buildQualityInspection({
      goods_receipt_id: posted.id,
      lines: postedLines
        .filter((line) => qtyNumber(line.qty_on_hold) > 0)
        .map((line) => ({
          goods_receipt_line_id: line.id,
          qty_inspected: line.qty_on_hold,
          qty_accepted: line.qty_on_hold,
          qty_rejected: "0",
          qty_rework: "0",
        })),
    });
    qualityInspections.set(inspection.id, inspection);
  }
  return posted;
}

function cancelPostedGoodsReceipt(document) {
  const approved = [...qualityInspections.values()].some(
    (row) => row.goods_receipt_id === document.id && row.status === "APPROVED",
  );
  if (approved) {
    const err = new Error("GRN_CANNOT_CANCEL");
    throw err;
  }
  for (const line of document.lines) {
    if (!line.product_id) {
      continue;
    }
    applyMovement({
      warehouseId: document.warehouse_id,
      productId: line.product_id,
      qty: `-${line.quantity}`,
      movementType: "PURCHASE",
      sourceType: "goods_receipt",
      sourceId: document.id,
      sourceLineId: line.id,
      documentDate: document.document_date,
    });
    if (qtyNumber(line.qty_on_hold) > 0) {
      const balance = getBalance(document.warehouse_id, line.product_id);
      balance.qty_quality_hold = qtyString(
        Math.max(0, qtyNumber(balance.qty_quality_hold) - qtyNumber(line.qty_on_hold)),
      );
      getBalance(document.warehouse_id, line.product_id);
    }
  }
  if (document.purchase_order_id) {
    const order = purchaseOrders.get(document.purchase_order_id);
    if (order) {
      for (const line of document.lines) {
        if (!line.purchase_order_line_id) {
          continue;
        }
        const poLine = order.lines.find((item) => item.id === line.purchase_order_line_id);
        if (poLine) {
          poLine.qty_received = qtyString(
            Math.max(0, qtyNumber(poLine.qty_received) - qtyNumber(line.quantity)),
          );
        }
      }
      refreshPoReceipt(order);
      purchaseOrders.set(order.id, order);
    }
  }
  for (const inspection of qualityInspections.values()) {
    if (inspection.goods_receipt_id === document.id && inspection.status === "DRAFT") {
      inspection.status = "CANCELLED";
      inspection.available_actions = [];
      inspection.version += 1;
    }
  }
  const now = new Date().toISOString();
  return {
    ...document,
    status: "CANCELLED",
    is_posted: false,
    version: document.version + 1,
    cancelled_at: now,
    cancelled_by: USER_ID,
    available_actions: [],
    updated_at: now,
  };
}

function buildQualityInspection(body, existing = null) {
  qiSeq += existing ? 0 : 1;
  const now = new Date().toISOString();
  const documentNumber = existing?.document_number ?? `QCR-${String(qiSeq).padStart(4, "0")}`;
  const lines = (body.lines ?? existing?.lines ?? []).map((line, index) => ({
    id: line.id ?? crypto.randomUUID(),
    line_number: index + 1,
    goods_receipt_line_id: line.goods_receipt_line_id,
    qty_inspected: String(line.qty_inspected ?? "0"),
    qty_accepted: String(line.qty_accepted ?? "0"),
    qty_rejected: String(line.qty_rejected ?? "0"),
    qty_rework: String(line.qty_rework ?? "0"),
    disposition: line.disposition ?? null,
    notes: line.notes ?? null,
  }));
  const status = existing?.status ?? "DRAFT";
  return {
    id: existing?.id ?? crypto.randomUUID(),
    tenant_id: TENANT_ID,
    document_number: documentNumber,
    status,
    version: existing ? existing.version + 1 : 1,
    goods_receipt_id: body.goods_receipt_id ?? existing?.goods_receipt_id,
    inspection_date: body.inspection_date ?? existing?.inspection_date ?? NOW.slice(0, 10),
    inspector_user_id: body.inspector_user_id ?? existing?.inspector_user_id ?? null,
    notes: body.notes ?? existing?.notes ?? null,
    approved_at: existing?.approved_at ?? null,
    approved_by: existing?.approved_by ?? null,
    cancelled_at: existing?.cancelled_at ?? null,
    cancelled_by: existing?.cancelled_by ?? null,
    cancel_reason: existing?.cancel_reason ?? null,
    available_actions: qualityInspectionActions(status),
    period_locked: false,
    lines,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };
}

function approveQualityInspection(inspection) {
  const receipt = goodsReceipts.get(inspection.goods_receipt_id);
  if (!receipt) {
    const err = new Error("NOT_FOUND");
    throw err;
  }
  for (const line of inspection.lines) {
    const accepted = qtyNumber(line.qty_accepted);
    const rejected = qtyNumber(line.qty_rejected);
    const rework = qtyNumber(line.qty_rework);
    const inspected = qtyNumber(line.qty_inspected);
    if (Math.abs(accepted + rejected + rework - inspected) > 0.0001) {
      const err = new Error("QUALITY_QTY_MISMATCH");
      throw err;
    }
    const receiptLine = receipt.lines.find((item) => item.id === line.goods_receipt_line_id);
    if (!receiptLine?.product_id) {
      continue;
    }
    const balance = getBalance(receipt.warehouse_id, receiptLine.product_id);
    const release = accepted + rejected;
    balance.qty_quality_hold = qtyString(Math.max(0, qtyNumber(balance.qty_quality_hold) - release));
    receiptLine.qty_on_hold = qtyString(Math.max(0, qtyNumber(receiptLine.qty_on_hold) - release));
    receiptLine.qty_accepted = qtyString(qtyNumber(receiptLine.qty_accepted) + accepted);
    receiptLine.qty_rejected = qtyString(qtyNumber(receiptLine.qty_rejected) + rejected);
    if (rejected > 0) {
      applyMovement({
        warehouseId: receipt.warehouse_id,
        productId: receiptLine.product_id,
        qty: `-${qtyString(rejected)}`,
        movementType: line.disposition === "RETURN_TO_SUPPLIER" ? "RETURN_OUT" : "DAMAGE",
        sourceType: "quality_inspection",
        sourceId: inspection.id,
        sourceLineId: line.id,
        documentDate: inspection.inspection_date,
      });
    } else {
      getBalance(receipt.warehouse_id, receiptLine.product_id);
    }
  }
  const remainingHold = receipt.lines.some((line) => qtyNumber(line.qty_on_hold) > 0);
  receipt.qc_status = remainingHold ? "PARTIAL" : "CLEARED";
  receipt.available_actions = goodsReceiptActions(receipt);
  receipt.version += 1;
  goodsReceipts.set(receipt.id, receipt);
  const now = new Date().toISOString();
  return {
    ...inspection,
    status: "APPROVED",
    version: inspection.version + 1,
    approved_at: now,
    approved_by: USER_ID,
    available_actions: [],
    updated_at: now,
  };
}

function todayIsoDate() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function actorCanOverride() {
  return currentSessionKind !== "limited";
}

function isHardLocked(documentDate) {
  return Boolean(tenantState.hard_lock_date && documentDate <= tenantState.hard_lock_date);
}

function isSoftLocked(documentDate) {
  return Boolean(tenantState.lock_date && documentDate <= tenantState.lock_date);
}

function isPeriodCovered(documentDate) {
  return isHardLocked(documentDate) || isSoftLocked(documentDate);
}

function isPeriodLockedForActor(documentDate) {
  if (isHardLocked(documentDate)) {
    return true;
  }
  return isSoftLocked(documentDate) && !actorCanOverride();
}

function periodLockErrorDetails(documentDate) {
  const hard = isHardLocked(documentDate);
  return {
    lock_date: tenantState.lock_date,
    hard_lock_date: tenantState.hard_lock_date,
    document_date: documentDate,
    tier: hard ? "hard" : "soft",
    reason: hard ? tenantState.hard_lock_reason : tenantState.lock_reason,
  };
}

function rejectIfPeriodLocked(res, documentDate) {
  if (!isPeriodLockedForActor(documentDate)) {
    return false;
  }
  fail(res, 409, "PERIOD_LOCKED", "Period locked", periodLockErrorDetails(documentDate));
  return true;
}

function stockDocumentResponse(document) {
  const period_locked = isPeriodCovered(document.document_date);
  let available_actions = [...(document.available_actions ?? [])];
  if (document.status === "DRAFT" && isPeriodLockedForActor(document.document_date)) {
    available_actions = available_actions.filter((action) => action !== "post");
  }
  return { ...document, period_locked, available_actions };
}

function negativeBalances() {
  return [...balances.values()]
    .filter((row) => qtyNumber(row.qty_on_hand) < 0)
    .map((row) => ({
      warehouse_id: row.warehouse_id,
      warehouse_code: row.warehouse_code,
      product_id: row.product_id,
      sku: row.sku,
      qty_on_hand: row.qty_on_hand,
    }));
}

function unpostedDocumentsOnOrBefore(cutoff) {
  if (!cutoff) {
    return [];
  }
  const rows = [];
  for (const document of adjustments.values()) {
    if (document.status === "DRAFT" && document.document_date <= cutoff) {
      rows.push({
        id: document.id,
        document_type: "stock_adjustment",
        document_number: document.document_number,
        document_date: document.document_date,
        status: document.status,
      });
    }
  }
  for (const document of transfers.values()) {
    if (document.status === "DRAFT" && document.document_date <= cutoff) {
      rows.push({
        id: document.id,
        document_type: "stock_transfer",
        document_number: document.document_number,
        document_date: document.document_date,
        status: document.status,
      });
    }
  }
  for (const document of goodsReceipts.values()) {
    if (document.status === "DRAFT" && document.document_date <= cutoff) {
      rows.push({
        id: document.id,
        document_type: "goods_receipt",
        document_number: document.document_number,
        document_date: document.document_date,
        status: document.status,
      });
    }
  }
  for (const document of qualityInspections.values()) {
    if (document.status === "DRAFT" && document.inspection_date <= cutoff) {
      rows.push({
        id: document.id,
        document_type: "quality_inspection",
        document_number: document.document_number,
        document_date: document.inspection_date,
        status: document.status,
      });
    }
  }
  for (const document of deliveryNotes.values()) {
    if (document.status === "DRAFT" && document.document_date <= cutoff) {
      rows.push({
        id: document.id,
        document_type: "delivery_note",
        document_number: document.document_number,
        document_date: document.document_date,
        status: document.status,
      });
    }
  }
  for (const document of salesReturns.values()) {
    if (document.status === "DRAFT" && document.document_date <= cutoff) {
      rows.push({
        id: document.id,
        document_type: "sales_return",
        document_number: document.document_number,
        document_date: document.document_date,
        status: document.status,
      });
    }
  }
  return rows;
}

function previewCutoff(lockDate, hardLockDate) {
  if (lockDate && hardLockDate) {
    return lockDate >= hardLockDate ? lockDate : hardLockDate;
  }
  return lockDate || hardLockDate || null;
}

function periodLockPreview(lockDate, hardLockDate) {
  const negatives = negativeBalances();
  const unposted = unpostedDocumentsOnOrBefore(previewCutoff(lockDate, hardLockDate));
  const unlocking = !lockDate && !hardLockDate;
  const blocked = !unlocking && negatives.length > 0 && !tenantState.allow_negative_stock;
  const requiresAcknowledgement =
    !unlocking && negatives.length > 0 && tenantState.allow_negative_stock;
  return {
    allow_negative_stock: tenantState.allow_negative_stock,
    negative_balances: negatives.slice(0, 50),
    negative_balances_total_count: negatives.length,
    negative_balances_are_current: true,
    unposted_documents: unposted.slice(0, 50),
    unposted_documents_total_count: unposted.length,
    blocked,
    requires_acknowledgement: requiresAcknowledgement,
  };
}

function isRetreatOrClear(current, next) {
  if (current && !next) {
    return true;
  }
  return Boolean(current && next && next < current);
}

function periodLockState() {
  return {
    lock_date: tenantState.lock_date,
    hard_lock_date: tenantState.hard_lock_date,
    lock_reason: tenantState.lock_reason,
    hard_lock_reason: tenantState.hard_lock_reason,
  };
}

function isStale(req, version) {
  const match = req.headers["if-match"];
  return match != null && match !== "" && String(match) !== String(version);
}

function replayPost(req) {
  const key = req.headers["idempotency-key"];
  if (key && postReplays.has(key)) {
    return postReplays.get(key);
  }
  return null;
}

function storePost(req, document) {
  const key = req.headers["idempotency-key"];
  if (key) {
    postReplays.set(key, document);
  }
}

function buildAdjustment(body, existing = null) {
  adjSeq += existing ? 0 : 1;
  const now = new Date().toISOString();
  const documentNumber = existing?.document_number ?? `STA-${String(adjSeq).padStart(4, "0")}`;
  const lines = (body.lines ?? existing?.lines ?? []).map((line, index) => ({
    id: line.id ?? crypto.randomUUID(),
    line_number: index + 1,
    product_id: line.product_id,
    unit_id: line.unit_id ?? UNIT_ID,
    qty_counted: line.qty_counted ?? null,
    qty_booked: existing?.is_posted ? (line.qty_booked ?? null) : null,
    qty_delta: line.qty_delta ?? null,
    notes: line.notes ?? null,
  }));
  const status = existing?.status ?? "DRAFT";
  return {
    id: existing?.id ?? crypto.randomUUID(),
    tenant_id: TENANT_ID,
    document_number: documentNumber,
    status,
    version: existing ? existing.version + 1 : 1,
    is_posted: status === "POSTED",
    document_date: body.document_date ?? existing?.document_date ?? NOW.slice(0, 10),
    warehouse_id: body.warehouse_id ?? existing?.warehouse_id,
    reason: body.reason ?? existing?.reason ?? "OPENING_STOCK",
    branch_id: body.branch_id ?? existing?.branch_id ?? null,
    reference: body.reference ?? existing?.reference ?? null,
    notes: body.notes ?? existing?.notes ?? null,
    posted_at: existing?.posted_at ?? null,
    posted_by: existing?.posted_by ?? null,
    cancelled_at: existing?.cancelled_at ?? null,
    cancelled_by: existing?.cancelled_by ?? null,
    cancel_reason: existing?.cancel_reason ?? null,
    available_actions: status === "DRAFT" ? draftActions() : [],
    lines,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };
}

function buildTransfer(body, existing = null) {
  xferSeq += existing ? 0 : 1;
  const now = new Date().toISOString();
  const documentNumber = existing?.document_number ?? `STR-${String(xferSeq).padStart(4, "0")}`;
  const lines = (body.lines ?? existing?.lines ?? []).map((line, index) => ({
    id: line.id ?? crypto.randomUUID(),
    line_number: index + 1,
    product_id: line.product_id,
    unit_id: line.unit_id ?? UNIT_ID,
    qty: String(line.qty ?? "0"),
    qty_transferred: existing?.is_posted ? String(line.qty_transferred ?? line.qty ?? "0") : "0",
    qty_source_before: existing?.is_posted ? (line.qty_source_before ?? null) : null,
    qty_dest_before: existing?.is_posted ? (line.qty_dest_before ?? null) : null,
    notes: line.notes ?? null,
  }));
  const status = existing?.status ?? "DRAFT";
  return {
    id: existing?.id ?? crypto.randomUUID(),
    tenant_id: TENANT_ID,
    document_number: documentNumber,
    status,
    version: existing ? existing.version + 1 : 1,
    is_posted: status === "POSTED",
    document_date: body.document_date ?? existing?.document_date ?? NOW.slice(0, 10),
    from_warehouse_id: body.from_warehouse_id ?? existing?.from_warehouse_id,
    to_warehouse_id: body.to_warehouse_id ?? existing?.to_warehouse_id,
    branch_id: body.branch_id ?? existing?.branch_id ?? null,
    reason: body.reason ?? existing?.reason ?? null,
    reference: body.reference ?? existing?.reference ?? null,
    notes: body.notes ?? existing?.notes ?? null,
    posted_at: existing?.posted_at ?? null,
    posted_by: existing?.posted_by ?? null,
    cancelled_at: existing?.cancelled_at ?? null,
    cancelled_by: existing?.cancelled_by ?? null,
    cancel_reason: existing?.cancel_reason ?? null,
    available_actions: status === "DRAFT" ? draftActions() : [],
    lines,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };
}

function postAdjustment(document) {
  const postedLines = document.lines.map((line) => {
    const booked = qtyNumber(getBalance(document.warehouse_id, line.product_id).qty_on_hand);
    const delta =
      document.reason === "COUNT"
        ? qtyNumber(line.qty_counted) - booked
        : qtyNumber(line.qty_delta);
    applyMovement({
      warehouseId: document.warehouse_id,
      productId: line.product_id,
      qty: delta,
      movementType: document.reason === "OPENING_STOCK" ? "OPENING_STOCK" : "ADJUSTMENT",
      sourceType: "stock_adjustment",
      sourceId: document.id,
      sourceLineId: line.id,
      documentDate: document.document_date,
      notes: document.reason,
    });
    return {
      ...line,
      qty_booked: qtyString(booked),
      qty_delta: qtyString(delta),
    };
  });
  const now = new Date().toISOString();
  return {
    ...document,
    status: "POSTED",
    is_posted: true,
    version: document.version + 1,
    posted_at: now,
    posted_by: USER_ID,
    available_actions: [],
    lines: postedLines,
    updated_at: now,
  };
}

function postTransfer(document) {
  const postedLines = document.lines.map((line) => {
    const sourceBefore = qtyNumber(
      getBalance(document.from_warehouse_id, line.product_id).qty_on_hand,
    );
    const destBefore = qtyNumber(getBalance(document.to_warehouse_id, line.product_id).qty_on_hand);
    const qty = qtyNumber(line.qty);
    applyMovement({
      warehouseId: document.from_warehouse_id,
      productId: line.product_id,
      qty: -qty,
      movementType: "TRANSFER_OUT",
      sourceType: "stock_transfer",
      sourceId: document.id,
      sourceLineId: line.id,
      documentDate: document.document_date,
    });
    applyMovement({
      warehouseId: document.to_warehouse_id,
      productId: line.product_id,
      qty,
      movementType: "TRANSFER_IN",
      sourceType: "stock_transfer",
      sourceId: document.id,
      sourceLineId: line.id,
      documentDate: document.document_date,
    });
    return {
      ...line,
      qty_transferred: qtyString(qty),
      qty_source_before: qtyString(sourceBefore),
      qty_dest_before: qtyString(destBefore),
    };
  });
  const now = new Date().toISOString();
  return {
    ...document,
    status: "POSTED",
    is_posted: true,
    version: document.version + 1,
    posted_at: now,
    posted_by: USER_ID,
    available_actions: [],
    lines: postedLines,
    updated_at: now,
  };
}

function money4(value) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount.toFixed(4) : "0.0000";
}

function journalActions(status) {
  if (status === "DRAFT") {
    return ["post", "cancel", "delete"];
  }
  if (status === "POSTED") {
    return ["reverse"];
  }
  return [];
}

function makeAccount(fields) {
  return {
    id: fields.id,
    tenant_id: TENANT_ID,
    code: fields.code,
    name: fields.name,
    description: fields.description ?? null,
    account_type: fields.account_type,
    account_subtype: fields.account_subtype,
    parent_id: fields.parent_id ?? null,
    depth: fields.parent_id ? 1 : 0,
    is_group: Boolean(fields.is_group),
    is_system: Boolean(fields.is_system),
    system_role: fields.system_role ?? null,
    currency_id: fields.currency_id ?? null,
    is_active: fields.is_active ?? true,
    created_at: NOW,
    updated_at: NOW,
  };
}

function emptyOpeningState() {
  return {
    committed: false,
    books_start_date: null,
    hard_lock_date: null,
    journal_entry_id: null,
    document_number: null,
    committed_at: null,
    can_reset: false,
  };
}

function seedLedger() {
  accounts = new Map();
  journals = new Map();
  jvSeq = 0;
  openingBalanceState = emptyOpeningState();
  const rows = [
    makeAccount({
      id: ACCOUNT_ASSETS_GROUP_ID,
      code: "1000",
      name: "Assets",
      account_type: "ASSET",
      account_subtype: "OTHER_CURRENT_ASSET",
      is_group: true,
      is_system: true,
    }),
    makeAccount({
      id: ACCOUNT_CASH_ID,
      code: "1010",
      name: "Cash on hand",
      account_type: "ASSET",
      account_subtype: "CASH",
      parent_id: ACCOUNT_ASSETS_GROUP_ID,
      is_system: true,
      system_role: "CASH_ON_HAND",
    }),
    makeAccount({
      id: ACCOUNT_BANK_ID,
      code: "1020",
      name: "Bank",
      account_type: "ASSET",
      account_subtype: "BANK",
      parent_id: ACCOUNT_ASSETS_GROUP_ID,
      is_system: true,
      system_role: "BANK",
    }),
    makeAccount({
      id: ACCOUNT_AR_ID,
      code: "1100",
      name: "Accounts receivable",
      account_type: "ASSET",
      account_subtype: "ACCOUNTS_RECEIVABLE",
      parent_id: ACCOUNT_ASSETS_GROUP_ID,
      is_system: true,
      system_role: "ACCOUNTS_RECEIVABLE",
    }),
    makeAccount({
      id: ACCOUNT_AP_ID,
      code: "2000",
      name: "Accounts payable",
      account_type: "LIABILITY",
      account_subtype: "ACCOUNTS_PAYABLE",
      is_system: true,
      system_role: "ACCOUNTS_PAYABLE",
    }),
    makeAccount({
      id: ACCOUNT_EQUITY_ID,
      code: "3000",
      name: "Opening balance equity",
      account_type: "EQUITY",
      account_subtype: "EQUITY",
      is_system: true,
      system_role: "OPENING_BALANCE_EQUITY",
    }),
  ];
  for (const row of rows) {
    accounts.set(row.id, row);
  }
  const posted = buildJournal(
    {
      entry_date: "2026-01-15",
      currency_id: CURRENCY_ID,
      exchange_rate: "1",
      narration: "Seeded cash",
      lines: [
        { account_id: ACCOUNT_CASH_ID, debit: "1000.0000", credit: "0.0000" },
        { account_id: ACCOUNT_EQUITY_ID, debit: "0.0000", credit: "1000.0000" },
      ],
    },
    null,
    { id: SEEDED_JOURNAL_ID, status: "POSTED", journal_type: "MANUAL" },
  );
  journals.set(posted.id, posted);
}

function accountTree() {
  const nodes = [...accounts.values()].map((row) => ({ ...row, children: [] }));
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const roots = [];
  for (const node of nodes) {
    if (node.parent_id && byId.has(node.parent_id)) {
      byId.get(node.parent_id).children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

function systemRoleMappings() {
  return ACCOUNT_SYSTEM_ROLES.map((role) => {
    const account = [...accounts.values()].find((row) => row.system_role === role);
    return {
      role,
      account_id: account?.id ?? null,
      account_code: account?.code ?? null,
      account_name: account?.name ?? null,
    };
  });
}

function buildJournal(body, existing = null, overrides = {}) {
  if (!existing) {
    jvSeq += 1;
  }
  const now = new Date().toISOString();
  const lines = (body.lines ?? existing?.lines ?? []).map((line, index) => ({
    id: line.id ?? crypto.randomUUID(),
    line_number: index + 1,
    account_id: line.account_id,
    debit: money4(line.debit),
    credit: money4(line.credit),
    debit_base: money4(line.debit_base ?? line.debit),
    credit_base: money4(line.credit_base ?? line.credit),
    currency_id: line.currency_id ?? body.currency_id ?? existing?.currency_id ?? CURRENCY_ID,
    exchange_rate: money4(
      line.exchange_rate ?? body.exchange_rate ?? existing?.exchange_rate ?? "1",
    ),
    party_type: line.party_type ?? null,
    party_id: line.party_id ?? null,
    due_date: line.due_date ?? null,
    external_reference: line.external_reference ?? null,
    tax_id: line.tax_id ?? null,
    branch_id: line.branch_id ?? body.branch_id ?? existing?.branch_id ?? null,
    description: line.description ?? null,
  }));
  const totalDebit = money4(lines.reduce((sum, line) => sum + Number(line.debit_base), 0));
  const totalCredit = money4(lines.reduce((sum, line) => sum + Number(line.credit_base), 0));
  const status = overrides.status ?? existing?.status ?? "DRAFT";
  const isPosted = status === "POSTED";
  return {
    id: overrides.id ?? existing?.id ?? crypto.randomUUID(),
    tenant_id: TENANT_ID,
    document_number: existing?.document_number ?? `JV-${String(jvSeq).padStart(4, "0")}`,
    entry_date: body.entry_date ?? existing?.entry_date ?? "2026-01-15",
    status,
    version: existing ? existing.version + 1 : 1,
    is_posted: isPosted,
    journal_type: overrides.journal_type ?? existing?.journal_type ?? "MANUAL",
    source_type: overrides.source_type ?? existing?.source_type ?? null,
    source_id: overrides.source_id ?? existing?.source_id ?? null,
    reversal_of_id: overrides.reversal_of_id ?? existing?.reversal_of_id ?? null,
    reversed_by_id: overrides.reversed_by_id ?? existing?.reversed_by_id ?? null,
    currency_id: body.currency_id ?? existing?.currency_id ?? CURRENCY_ID,
    exchange_rate: money4(body.exchange_rate ?? existing?.exchange_rate ?? "1"),
    branch_id: body.branch_id === undefined ? (existing?.branch_id ?? null) : body.branch_id,
    narration: body.narration === undefined ? (existing?.narration ?? null) : body.narration,
    reference: body.reference === undefined ? (existing?.reference ?? null) : body.reference,
    posted_at: isPosted ? (existing?.posted_at ?? now) : null,
    posted_by: isPosted ? (existing?.posted_by ?? USER_ID) : null,
    total_debit_base: totalDebit,
    total_credit_base: totalCredit,
    available_actions: journalActions(status),
    period_locked: false,
    lines,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };
}

function refuseJournalPost(document) {
  if (Number(document.total_debit_base) !== Number(document.total_credit_base)) {
    return "JOURNAL_UNBALANCED";
  }
  for (const line of document.lines) {
    const hasDebit = Number(line.debit) !== 0;
    const hasCredit = Number(line.credit) !== 0;
    if (hasDebit === hasCredit) {
      return "JOURNAL_LINE_INVALID";
    }
    const account = accounts.get(line.account_id);
    if (!account || account.is_group) {
      return "ACCOUNT_NOT_POSTABLE";
    }
  }
  return null;
}

function postJournal(document) {
  const now = new Date().toISOString();
  return {
    ...document,
    status: "POSTED",
    is_posted: true,
    version: document.version + 1,
    posted_at: now,
    posted_by: USER_ID,
    available_actions: journalActions("POSTED"),
    updated_at: now,
  };
}

function reverseJournal(document) {
  const reversed = buildJournal(
    {
      entry_date: document.entry_date,
      currency_id: document.currency_id,
      exchange_rate: document.exchange_rate,
      narration: `Reversal of ${document.document_number}`,
      branch_id: document.branch_id,
      lines: document.lines.map((line) => ({
        ...line,
        id: crypto.randomUUID(),
        debit: line.credit,
        credit: line.debit,
        debit_base: line.credit_base,
        credit_base: line.debit_base,
      })),
    },
    null,
    { status: "POSTED", journal_type: "REVERSAL", reversal_of_id: document.id },
  );
  const original = {
    ...document,
    reversed_by_id: reversed.id,
    version: document.version + 1,
    available_actions: [],
    updated_at: new Date().toISOString(),
  };
  return { original, reversed };
}

function trialBalanceReport(from, to, includeZero) {
  const buckets = new Map();
  for (const account of accounts.values()) {
    if (account.is_group) {
      continue;
    }
    buckets.set(account.id, {
      account,
      opening_debit: 0,
      opening_credit: 0,
      period_debit: 0,
      period_credit: 0,
    });
  }
  for (const journal of journals.values()) {
    if (journal.status !== "POSTED") {
      continue;
    }
    const before = Boolean(from && journal.entry_date < from);
    const inPeriod = inDocumentDateRange(journal.entry_date, from, to);
    for (const line of journal.lines) {
      const bucket = buckets.get(line.account_id);
      if (!bucket) {
        continue;
      }
      if (before) {
        bucket.opening_debit += Number(line.debit_base);
        bucket.opening_credit += Number(line.credit_base);
      } else if (inPeriod) {
        bucket.period_debit += Number(line.debit_base);
        bucket.period_credit += Number(line.credit_base);
      }
    }
  }
  const totals = {
    opening_debit: 0,
    opening_credit: 0,
    period_debit: 0,
    period_credit: 0,
    closing_debit: 0,
    closing_credit: 0,
  };
  const lines = [];
  for (const bucket of buckets.values()) {
    const closingDebit = bucket.opening_debit + bucket.period_debit;
    const closingCredit = bucket.opening_credit + bucket.period_credit;
    const hasActivity =
      bucket.opening_debit !== 0 ||
      bucket.opening_credit !== 0 ||
      bucket.period_debit !== 0 ||
      bucket.period_credit !== 0;
    if (!includeZero && !hasActivity) {
      continue;
    }
    lines.push({
      account_id: bucket.account.id,
      account_code: bucket.account.code,
      account_name: bucket.account.name,
      account_type: bucket.account.account_type,
      is_group: bucket.account.is_group,
      opening_debit: money4(bucket.opening_debit),
      opening_credit: money4(bucket.opening_credit),
      period_debit: money4(bucket.period_debit),
      period_credit: money4(bucket.period_credit),
      closing_debit: money4(closingDebit),
      closing_credit: money4(closingCredit),
    });
    totals.opening_debit += bucket.opening_debit;
    totals.opening_credit += bucket.opening_credit;
    totals.period_debit += bucket.period_debit;
    totals.period_credit += bucket.period_credit;
    totals.closing_debit += closingDebit;
    totals.closing_credit += closingCredit;
  }
  lines.sort((left, right) => left.account_code.localeCompare(right.account_code));
  return {
    from_date: from,
    to_date: to,
    is_balanced: money4(totals.closing_debit) === money4(totals.closing_credit),
    total_opening_debit: money4(totals.opening_debit),
    total_opening_credit: money4(totals.opening_credit),
    total_period_debit: money4(totals.period_debit),
    total_period_credit: money4(totals.period_credit),
    total_closing_debit: money4(totals.closing_debit),
    total_closing_credit: money4(totals.closing_credit),
    lines,
  };
}

function generalLedgerReport(accountId, from, to) {
  const account = accounts.get(accountId);
  if (!account) {
    return null;
  }
  const rows = [];
  for (const journal of journals.values()) {
    if (journal.status !== "POSTED") {
      continue;
    }
    for (const line of journal.lines) {
      if (line.account_id !== accountId) {
        continue;
      }
      rows.push({ journal, line });
    }
  }
  rows.sort((left, right) => {
    if (left.journal.entry_date === right.journal.entry_date) {
      return left.line.line_number - right.line.line_number;
    }
    return left.journal.entry_date < right.journal.entry_date ? -1 : 1;
  });
  let running = 0;
  let opening = 0;
  const lines = [];
  for (const row of rows) {
    const delta = Number(row.line.debit_base) - Number(row.line.credit_base);
    if (from && row.journal.entry_date < from) {
      opening += delta;
      running = opening;
      continue;
    }
    if (!inDocumentDateRange(row.journal.entry_date, from, to)) {
      continue;
    }
    running += delta;
    lines.push({
      journal_entry_id: row.journal.id,
      journal_entry_line_id: row.line.id,
      document_number: row.journal.document_number,
      entry_date: row.journal.entry_date,
      source_type: row.journal.source_type,
      source_id: row.journal.source_id,
      account_id: accountId,
      debit: row.line.debit,
      credit: row.line.credit,
      debit_base: row.line.debit_base,
      credit_base: row.line.credit_base,
      running_balance: money4(running),
      party_id: row.line.party_id,
      description: row.line.description,
      narration: row.journal.narration,
    });
  }
  return {
    account_id: account.id,
    account_code: account.code,
    account_name: account.name,
    from_date: from,
    to_date: to,
    opening_balance: money4(opening),
    closing_balance: money4(running),
    lines,
  };
}

function accountStatementReport(partyType, partyId, from, to) {
  const rows = [];
  for (const journal of journals.values()) {
    if (journal.status !== "POSTED") {
      continue;
    }
    for (const line of journal.lines) {
      if (line.party_id !== partyId || (partyType && line.party_type !== partyType)) {
        continue;
      }
      rows.push({ journal, line });
    }
  }
  rows.sort((left, right) =>
    left.journal.entry_date < right.journal.entry_date ? -1 : 1,
  );
  let running = 0;
  let opening = 0;
  const lines = [];
  for (const row of rows) {
    const delta = Number(row.line.debit_base) - Number(row.line.credit_base);
    if (from && row.journal.entry_date < from) {
      opening += delta;
      running = opening;
      continue;
    }
    if (!inDocumentDateRange(row.journal.entry_date, from, to)) {
      continue;
    }
    running += delta;
    lines.push({
      journal_entry_id: row.journal.id,
      document_number: row.journal.document_number,
      entry_date: row.journal.entry_date,
      due_date: row.line.due_date,
      external_reference: row.line.external_reference,
      debit: row.line.debit,
      credit: row.line.credit,
      running_balance: money4(running),
      description: row.line.description,
    });
  }
  return {
    party_type: partyType,
    party_id: partyId,
    from_date: from,
    to_date: to,
    opening_balance: money4(opening),
    closing_balance: money4(running),
    lines,
  };
}

function previewOpeningBalances(body) {
  const booksStart = body.books_start_date;
  const lines = [];
  let totalDebit = 0;
  let totalCredit = 0;
  for (const line of body.gl_lines ?? []) {
    const account = accounts.get(line.account_id);
    if (!account) {
      continue;
    }
    const debit = Number(line.debit ?? 0);
    const credit = Number(line.credit ?? 0);
    totalDebit += debit;
    totalCredit += credit;
    lines.push({
      account_id: account.id,
      account_code: account.code,
      account_name: account.name,
      debit: money4(debit),
      credit: money4(credit),
      party_id: null,
      due_date: null,
      external_reference: null,
      description: line.description ?? null,
    });
  }
  const difference = totalDebit - totalCredit;
  if (difference !== 0) {
    const equity = accounts.get(ACCOUNT_EQUITY_ID);
    lines.push({
      account_id: equity.id,
      account_code: equity.code,
      account_name: equity.name,
      debit: difference < 0 ? money4(-difference) : "0.0000",
      credit: difference > 0 ? money4(difference) : "0.0000",
      party_id: null,
      due_date: null,
      external_reference: null,
      description: "Opening balance equity",
    });
    if (difference > 0) {
      totalCredit += difference;
    } else {
      totalDebit += -difference;
    }
  }
  const entryDate = booksStart ? new Date(`${booksStart}T00:00:00.000Z`) : new Date(NOW);
  entryDate.setUTCDate(entryDate.getUTCDate() - 1);
  return {
    books_start_date: booksStart,
    entry_date: entryDate.toISOString().slice(0, 10),
    opening_balance_equity_account_id: ACCOUNT_EQUITY_ID,
    difference: money4(difference),
    total_debit: money4(totalDebit),
    total_credit: money4(totalCredit),
    inventory_value: "0.0000",
    lines,
  };
}

function currentTenant() {
  return {
    id: TENANT_ID,
    name: tenantState.name,
    code: "PLUMBIT",
    timezone: tenantState.timezone,
    status: "ACTIVE",
    industry: null,
    website: null,
    contact_email: null,
    phone: null,
    founded: null,
    fiscal_year_start: null,
    fiscal_year_start_month: tenantState.fiscal_year_start_month,
    fiscal_year_start_day: tenantState.fiscal_year_start_day,
    books_start_date: tenantState.books_start_date,
    default_currency: tenantState.default_currency,
    default_currency_id: tenantState.default_currency_id,
    quotation_requires_approval: tenantState.quotation_requires_approval,
    sales_order_requires_approval: tenantState.sales_order_requires_approval,
    purchase_order_requires_approval: tenantState.purchase_order_requires_approval,
    allow_negative_stock: tenantState.allow_negative_stock,
    costing_method: tenantState.costing_method,
    allow_over_receipt: tenantState.allow_over_receipt,
    over_receipt_tolerance_pct: tenantState.over_receipt_tolerance_pct,
    qc_required_default: tenantState.qc_required_default,
    lock_date: tenantState.lock_date,
    hard_lock_date: tenantState.hard_lock_date,
    headquarters: null,
    logo_url: tenantLogoUrl,
    users_count: 1,
    departments_count: 0,
    branches_count: 0,
    created_at: NOW,
    updated_at: NOW,
  };
}

function me() {
  if (currentSessionKind === "limited") {
    return {
      id: LIMITED_USER_ID,
      tenant_id: TENANT_ID,
      name: "Riley Reader",
      email: LIMITED_EMAIL,
      phone: null,
      status: "ACTIVE",
      last_login_at: NOW,
      employee_id: null,
      created_at: NOW,
      updated_at: NOW,
      roles: [{ id: EMPLOYEE_ROLE_ID, name: "Employee", is_system_role: false }],
      permissions: ["users.auth.change_password", "inventory.unit.read"],
    };
  }
  return {
    id: USER_ID,
    tenant_id: TENANT_ID,
    name: "Ada Lovelace",
    email: EMAIL,
    phone: null,
    status: "ACTIVE",
    last_login_at: NOW,
    employee_id: null,
    created_at: NOW,
    updated_at: NOW,
    roles: [
      { id: SUPERADMIN_ROLE_ID, name: "Superadmin", is_system_role: true },
      { id: EMPLOYEE_ROLE_ID, name: "Employee", is_system_role: false },
    ],
    permissions: [
      "users.auth.change_password",
      "erp.currency.read",
      "erp.currency.create",
      "erp.currency.update",
      "erp.currency.delete",
      "erp.exchange_rate.read",
      "erp.exchange_rate.create",
      "erp.exchange_rate.update",
      "erp.tax.read",
      "erp.tax.create",
      "erp.tax.update",
      "erp.tax.delete",
      "erp.payment_term.read",
      "erp.payment_term.create",
      "erp.payment_term.update",
      "erp.payment_term.delete",
      "erp.terms_template.read",
      "erp.terms_template.create",
      "erp.terms_template.update",
      "erp.terms_template.delete",
      "erp.document_sequence.read",
      "erp.document_sequence.create",
      "erp.document_sequence.update",
      "erp.document_sequence.delete",
      "inventory.unit.read",
      "inventory.unit.create",
      "inventory.unit.update",
      "inventory.unit.delete",
      "inventory.category.read",
      "inventory.category.create",
      "inventory.category.update",
      "inventory.category.delete",
      "inventory.product.read",
      "inventory.product.create",
      "inventory.product.update",
      "inventory.product.delete",
      "inventory.price_list.read",
      "inventory.price_list.create",
      "inventory.price_list.update",
      "inventory.price_list.delete",
      "inventory.warehouse.read",
      "inventory.warehouse.create",
      "inventory.warehouse.update",
      "inventory.warehouse.delete",
      "inventory.stock.read",
      "inventory.stock.update",
      "inventory.stock_adjustment.read",
      "inventory.stock_adjustment.create",
      "inventory.stock_adjustment.update",
      "inventory.stock_adjustment.delete",
      "inventory.stock_adjustment.post",
      "inventory.stock_transfer.read",
      "inventory.stock_transfer.create",
      "inventory.stock_transfer.update",
      "inventory.stock_transfer.delete",
      "inventory.stock_transfer.post",
      "inventory.cost.read",
      "inventory.goods_receipt.read",
      "inventory.goods_receipt.create",
      "inventory.goods_receipt.update",
      "inventory.goods_receipt.delete",
      "inventory.goods_receipt.post",
      "inventory.quality_inspection.read",
      "inventory.quality_inspection.create",
      "inventory.quality_inspection.update",
      "inventory.quality_inspection.approve",
      "inventory.delivery_note.read",
      "inventory.delivery_note.create",
      "inventory.delivery_note.update",
      "inventory.delivery_note.delete",
      "inventory.delivery_note.post",
      "inventory.package.read",
      "inventory.package.create",
      "inventory.package.update",
      "inventory.package.delete",
      "inventory.shipment.read",
      "inventory.shipment.create",
      "inventory.shipment.update",
      "inventory.shipment.delete",
      "inventory.shipment.dispatch",
      "inventory.shipment.close",
      "inventory.sales_return.read",
      "inventory.sales_return.create",
      "inventory.sales_return.update",
      "inventory.sales_return.delete",
      "inventory.sales_return.post",
      "inventory.product.history",
      "crm.customer.history",
      "erp.supplier.history",
      "crm.customer.read",
      "crm.customer.create",
      "crm.customer.update",
      "crm.customer.delete",
      "crm.contact.read",
      "crm.contact.create",
      "crm.contact.update",
      "crm.contact.delete",
      "erp.quotation.read",
      "erp.quotation.create",
      "erp.quotation.update",
      "erp.quotation.delete",
      "erp.quotation.approve",
      "erp.quotation.send",
      "erp.sales_order.read",
      "erp.sales_order.create",
      "erp.sales_order.update",
      "erp.sales_order.delete",
      "erp.sales_order.approve",
      "erp.sales_order.confirm",
      "erp.sales_order.close",
      "erp.purchase_order.read",
      "erp.purchase_order.create",
      "erp.purchase_order.update",
      "erp.purchase_order.delete",
      "erp.purchase_order.approve",
      "erp.purchase_order.issue",
      "erp.purchase_order.close",
      "erp.period.lock",
      "erp.period.override",
      "erp.supplier.read",
      "erp.supplier.create",
      "erp.supplier.update",
      "erp.supplier.delete",
      "erp.supplier_product.read",
      "erp.supplier_product.create",
      "erp.supplier_product.update",
      "erp.supplier_product.delete",
      "erp.supplier_product.link",
      "erp.account.read",
      "erp.account.create",
      "erp.account.update",
      "erp.account.delete",
      "erp.journal_entry.read",
      "erp.journal_entry.create",
      "erp.journal_entry.update",
      "erp.journal_entry.delete",
      "erp.journal_entry.post",
      "erp.journal_entry.reverse",
      "erp.opening_balance.manage",
      "erp.report.ledger",
      "identity.attachment.read",
      "identity.attachment.create",
      "identity.attachment.update",
      "identity.attachment.delete",
      "identity.branch.read",
      "identity.department.read",
      "identity.organization.read",
      "identity.organization.update",
      "identity.permission.read",
      "identity.role.read",
      "identity.role.update",
      "identity.user.read",
    ],
  };
}

function tokenPair() {
  accessToken = `access-token-${Date.now()}`;
  refreshToken = `refresh-token-${Date.now()}`;
  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: "bearer",
    expires_in: 900,
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://127.0.0.1:${PORT}`);

  if (req.method === "GET" && url.pathname === "/health") {
    json(res, 200, { status: "ok" });
    return;
  }

  try {
    if (req.method === "GET" && url.pathname.replace(/\/$/, "") === "/api/v1/tenants") {
      ok(res, [{ tenant_id: TENANT_ID, name: ORGANIZATION_NAME, logo_url: tenantLogoUrl }]);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/v1/auth/login") {
      const body = await readBody(req);
      const isAda =
        body.tenant_id === TENANT_ID && body.email === EMAIL && body.password === currentPassword;
      const isReader =
        body.tenant_id === TENANT_ID &&
        body.email === LIMITED_EMAIL &&
        body.password === LIMITED_PASSWORD;
      if (!isAda && !isReader) {
        fail(res, 401, "AUTH_INVALID_CREDENTIALS", "Invalid credentials");
        return;
      }
      currentSessionKind = isReader ? "limited" : "superadmin";
      resetErpState();
      ok(res, tokenPair());
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/v1/auth/refresh") {
      const body = await readBody(req);
      if (body.refresh_token !== refreshToken) {
        fail(res, 401, "AUTH_TOKEN_EXPIRED", "Expired");
        return;
      }
      ok(res, tokenPair());
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/v1/auth/logout") {
      ok(res, null);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/v1/auth/me") {
      if (unauthorized(req, res)) {
        return;
      }
      ok(res, me());
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/v1/auth/change-password") {
      if (unauthorized(req, res)) {
        return;
      }
      const body = await readBody(req);
      if (body.current_password !== currentPassword) {
        fail(res, 401, "AUTH_INVALID_CREDENTIALS", "Invalid credentials");
        return;
      }
      ok(res, tokenPair());
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/v1/auth/forgot-password") {
      ok(res, null);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/v1/auth/reset-password") {
      const body = await readBody(req);
      if (body.token !== RESET_TOKEN) {
        fail(res, 400, "AUTH_RESET_TOKEN_INVALID", "Invalid");
        return;
      }
      ok(res, null);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/v1/tenants/current") {
      if (unauthorized(req, res)) {
        return;
      }
      ok(res, currentTenant());
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/v1/period-lock") {
      if (unauthorized(req, res)) {
        return;
      }
      ok(res, periodLockState());
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/v1/period-lock/preview") {
      if (unauthorized(req, res)) {
        return;
      }
      const lockDate = url.searchParams.get("lock_date");
      const hardLockDate = url.searchParams.get("hard_lock_date");
      ok(res, periodLockPreview(lockDate || null, hardLockDate || null));
      return;
    }

    if (req.method === "PATCH" && url.pathname === "/api/v1/period-lock") {
      if (unauthorized(req, res)) {
        return;
      }
      const body = await readBody(req);
      const nextLock = Object.prototype.hasOwnProperty.call(body, "lock_date")
        ? body.lock_date
        : tenantState.lock_date;
      const nextHard = Object.prototype.hasOwnProperty.call(body, "hard_lock_date")
        ? body.hard_lock_date
        : tenantState.hard_lock_date;
      const today = todayIsoDate();
      if (nextLock && nextLock > today) {
        fail(res, 422, "VALIDATION_ERROR", "Validation error", [
          {
            loc: ["body", "lock_date"],
            msg: "Lock date cannot be in the future",
            type: "value_error",
          },
        ]);
        return;
      }
      if (nextHard && nextHard > today) {
        fail(res, 422, "VALIDATION_ERROR", "Validation error", [
          {
            loc: ["body", "hard_lock_date"],
            msg: "Books close cannot be in the future",
            type: "value_error",
          },
        ]);
        return;
      }
      if (nextLock && nextHard && nextHard > nextLock) {
        fail(res, 422, "VALIDATION_ERROR", "Validation error", [
          {
            loc: ["body", "hard_lock_date"],
            msg: "Books close cannot be after the transaction lock",
            type: "value_error",
          },
        ]);
        return;
      }
      const retreating =
        isRetreatOrClear(tenantState.lock_date, nextLock) ||
        isRetreatOrClear(tenantState.hard_lock_date, nextHard);
      const reason = typeof body.reason === "string" ? body.reason.trim() : "";
      if (retreating && reason.length < 10) {
        fail(res, 422, "VALIDATION_ERROR", "Validation error", [
          {
            loc: ["body", "reason"],
            msg: "Reason must be at least 10 characters",
            type: "value_error",
          },
        ]);
        return;
      }
      const unlocking = !nextLock && !nextHard;
      const preview = periodLockPreview(nextLock, nextHard);
      if (!unlocking && preview.blocked) {
        fail(res, 409, "PERIOD_LOCK_BLOCKED_NEGATIVE_STOCK", "Negative stock", {
          reason: "negative_stock_disallowed",
          balances: preview.negative_balances,
          total_count: preview.negative_balances_total_count,
        });
        return;
      }
      if (!unlocking && preview.requires_acknowledgement && !body.acknowledge_negative_stock) {
        fail(res, 409, "PERIOD_LOCK_BLOCKED_NEGATIVE_STOCK", "Negative stock", {
          reason: "acknowledgement_required",
          balances: preview.negative_balances,
          total_count: preview.negative_balances_total_count,
        });
        return;
      }
      tenantState.lock_date = nextLock;
      tenantState.hard_lock_date = nextHard;
      if (reason) {
        if (nextLock) {
          tenantState.lock_reason = reason;
        }
        if (nextHard) {
          tenantState.hard_lock_reason = reason;
        }
      }
      if (Object.prototype.hasOwnProperty.call(body, "lock_date") && !nextLock) {
        tenantState.lock_reason = null;
      }
      if (Object.prototype.hasOwnProperty.call(body, "hard_lock_date") && !nextHard) {
        tenantState.hard_lock_reason = null;
      }
      ok(res, periodLockState());
      return;
    }

    if (req.method === "PATCH" && url.pathname === "/api/v1/tenants/current") {
      if (unauthorized(req, res)) {
        return;
      }
      const body = await readBody(req);
      tenantState = {
        ...tenantState,
        ...(body.name ? { name: body.name } : {}),
        ...(body.timezone ? { timezone: body.timezone } : {}),
        ...(body.default_currency !== undefined ? { default_currency: body.default_currency } : {}),
        ...(body.default_currency_id !== undefined
          ? { default_currency_id: body.default_currency_id }
          : {}),
        ...(body.quotation_requires_approval !== undefined
          ? { quotation_requires_approval: body.quotation_requires_approval }
          : {}),
        ...(body.sales_order_requires_approval !== undefined
          ? { sales_order_requires_approval: body.sales_order_requires_approval }
          : {}),
        ...(body.purchase_order_requires_approval !== undefined
          ? { purchase_order_requires_approval: body.purchase_order_requires_approval }
          : {}),
        ...(body.allow_negative_stock !== undefined
          ? { allow_negative_stock: body.allow_negative_stock }
          : {}),
        ...(body.allow_over_receipt !== undefined
          ? { allow_over_receipt: body.allow_over_receipt }
          : {}),
        ...(body.over_receipt_tolerance_pct !== undefined
          ? { over_receipt_tolerance_pct: body.over_receipt_tolerance_pct }
          : {}),
        ...(body.qc_required_default !== undefined
          ? { qc_required_default: body.qc_required_default }
          : {}),
        ...(body.fiscal_year_start_month !== undefined
          ? { fiscal_year_start_month: body.fiscal_year_start_month }
          : {}),
        ...(body.fiscal_year_start_day !== undefined
          ? { fiscal_year_start_day: body.fiscal_year_start_day }
          : {}),
        ...(body.books_start_date !== undefined ? { books_start_date: body.books_start_date } : {}),
      };
      ok(res, currentTenant());
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/v1/tenants/current/logo") {
      if (unauthorized(req, res)) {
        return;
      }
      await drain(req);
      tenantLogoUrl = LOGO_DATA_URL;
      ok(res, currentTenant());
      return;
    }

    if (req.method === "DELETE" && url.pathname === "/api/v1/tenants/current/logo") {
      if (unauthorized(req, res)) {
        return;
      }
      if (!tenantLogoUrl) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      tenantLogoUrl = null;
      ok(res, currentTenant());
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/v1/roles") {
      if (unauthorized(req, res)) {
        return;
      }
      listOk(res, [
        {
          id: SUPERADMIN_ROLE_ID,
          tenant_id: TENANT_ID,
          name: "Superadmin",
          description: "System role",
          is_system_role: true,
          user_count: 1,
          created_at: NOW,
          updated_at: NOW,
        },
        {
          id: EMPLOYEE_ROLE_ID,
          tenant_id: TENANT_ID,
          name: "Employee",
          description: null,
          is_system_role: false,
          user_count: 1,
          created_at: NOW,
          updated_at: NOW,
        },
      ]);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/v1/customers") {
      if (unauthorized(req, res)) {
        return;
      }
      listOk(res, [customer()]);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/v1/suppliers") {
      if (unauthorized(req, res)) {
        return;
      }
      listOk(res, [supplier()]);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/v1/currencies") {
      if (unauthorized(req, res)) {
        return;
      }
      listOk(res, [currency()]);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/v1/supplier-products/resolve") {
      if (unauthorized(req, res)) {
        return;
      }
      const supplierId = url.searchParams.get("supplier_id");
      const sku = (url.searchParams.get("supplier_sku") ?? "").trim().toUpperCase();
      const match = [...supplierProducts.values()].find(
        (row) => row.supplier_id === supplierId && row.supplier_sku.trim().toUpperCase() === sku,
      );
      if (!match) {
        ok(res, {
          supplier_sku: url.searchParams.get("supplier_sku"),
          status: "UNKNOWN_SKU",
          supplier_product_id: null,
          product_id: null,
          product_sku: null,
          product_name: null,
        });
        return;
      }
      ok(res, {
        supplier_sku: match.supplier_sku,
        status: match.is_mapped ? "MAPPED" : "UNMAPPED",
        supplier_product_id: match.id,
        product_id: match.product_id,
        product_sku: match.product_sku,
        product_name: match.product_name,
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/v1/supplier-products/resolve") {
      if (unauthorized(req, res)) {
        return;
      }
      const body = await readBody(req);
      const skus = body.supplier_skus ?? [];
      ok(
        res,
        skus.map((supplierSku) => {
          const normalized = String(supplierSku).trim().toUpperCase();
          const match = [...supplierProducts.values()].find(
            (row) =>
              row.supplier_id === body.supplier_id &&
              row.supplier_sku.trim().toUpperCase() === normalized,
          );
          if (!match) {
            return {
              supplier_sku: supplierSku,
              status: "UNKNOWN_SKU",
              supplier_product_id: null,
              product_id: null,
              product_sku: null,
              product_name: null,
            };
          }
          return {
            supplier_sku: match.supplier_sku,
            status: match.is_mapped ? "MAPPED" : "UNMAPPED",
            supplier_product_id: match.id,
            product_id: match.product_id,
            product_sku: match.product_sku,
            product_name: match.product_name,
          };
        }),
      );
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/v1/supplier-products") {
      if (unauthorized(req, res)) {
        return;
      }
      listOk(res, filterSupplierProducts(url.searchParams));
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/v1/supplier-products") {
      if (unauthorized(req, res)) {
        return;
      }
      const body = await readBody(req);
      const row = toSupplierProduct(body);
      supplierProducts.set(row.id, row);
      ok(res, row, 201);
      return;
    }

    const supplierProductLink = url.pathname.match(
      /^\/api\/v1\/supplier-products\/([0-9a-f-]{36})\/(link|unlink)$/i,
    );
    if (req.method === "POST" && supplierProductLink) {
      if (unauthorized(req, res)) {
        return;
      }
      const existing = supplierProducts.get(supplierProductLink[1]);
      if (!existing) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      const body = supplierProductLink[2] === "link" ? await readBody(req) : {};
      const row = toSupplierProduct(
        supplierProductLink[2] === "link" ? { product_id: body.product_id } : { product_id: null },
        existing,
      );
      supplierProducts.set(row.id, row);
      ok(res, row);
      return;
    }

    const supplierProductDetail = url.pathname.match(
      /^\/api\/v1\/supplier-products\/([0-9a-f-]{36})$/i,
    );
    if (
      supplierProductDetail &&
      (req.method === "GET" || req.method === "PATCH" || req.method === "DELETE")
    ) {
      if (unauthorized(req, res)) {
        return;
      }
      const existing = supplierProducts.get(supplierProductDetail[1]);
      if (!existing) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      if (req.method === "GET") {
        ok(res, existing);
        return;
      }
      if (req.method === "DELETE") {
        supplierProducts.delete(supplierProductDetail[1]);
        ok(res, existing);
        return;
      }
      const body = await readBody(req);
      const row = toSupplierProduct(body, existing);
      supplierProducts.set(row.id, row);
      ok(res, row);
      return;
    }

    if (req.method === "PUT" && url.pathname === "/api/v1/exchange-rates") {
      if (unauthorized(req, res)) {
        return;
      }
      const body = await readBody(req);
      ok(res, {
        id: crypto.randomUUID(),
        tenant_id: TENANT_ID,
        from_currency_id: body.currency_id ?? CURRENCY_ID,
        to_currency_id: CURRENCY_ID,
        effective_date: body.effective_date ?? NOW.slice(0, 10),
        rate: body.rate_to_base ?? "1",
        created_at: NOW,
        updated_at: NOW,
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/v1/quotations/compose-defaults") {
      if (unauthorized(req, res)) {
        return;
      }
      const customerId = url.searchParams.get("customer_id");
      if (customerId !== CUSTOMER_ID) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      const seeded = customer();
      ok(res, {
        customer_id: seeded.id,
        customer_name: seeded.name,
        customer_trn: seeded.trn,
        tax_treatment: seeded.tax_treatment,
        currency_id: seeded.currency_id,
        price_list_id: seeded.default_price_list_id,
        payment_terms_id: seeded.payment_terms_id,
        salesperson_id: seeded.salesperson_id,
        contact_id: null,
        place_of_supply: "DUBAI",
        bill_to_snapshot: null,
        ship_to_snapshot: null,
        terms_and_conditions: null,
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/v1/sales-orders/compose-defaults") {
      if (unauthorized(req, res)) {
        return;
      }
      const customerId = url.searchParams.get("customer_id");
      if (customerId !== CUSTOMER_ID) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      const seeded = customer();
      ok(res, {
        customer_id: seeded.id,
        customer_name: seeded.name,
        customer_trn: seeded.trn,
        tax_treatment: seeded.tax_treatment,
        currency_id: seeded.currency_id,
        price_list_id: seeded.default_price_list_id,
        payment_terms_id: seeded.payment_terms_id,
        salesperson_id: seeded.salesperson_id,
        contact_id: null,
        warehouse_id: WAREHOUSE_MAIN_ID,
        place_of_supply: "DUBAI",
        bill_to_snapshot: null,
        ship_to_snapshot: null,
        terms_and_conditions: null,
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/v1/purchase-orders/compose-defaults") {
      if (unauthorized(req, res)) {
        return;
      }
      const supplierId = url.searchParams.get("supplier_id");
      if (supplierId !== SUPPLIER_ID) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      const seeded = supplier();
      ok(res, {
        supplier_id: seeded.id,
        supplier_name: seeded.name,
        supplier_trn: seeded.trn,
        tax_treatment: seeded.tax_treatment,
        currency_id: seeded.currency_id,
        payment_terms_id: seeded.payment_terms_id,
        contact_id: null,
        warehouse_id: WAREHOUSE_MAIN_ID,
        place_of_supply: "DUBAI",
        supplier_address_snapshot: null,
        deliver_to_snapshot: null,
        terms_and_conditions: null,
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/v1/quotations") {
      if (unauthorized(req, res)) {
        return;
      }
      listOk(
        res,
        filterBySearch([...quotations.values()], url.searchParams.get("search"), [
          "quote_number",
          "document_number",
          "notes",
        ]),
      );
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/v1/quotations") {
      if (unauthorized(req, res)) {
        return;
      }
      const body = await readBody(req);
      const quotation = buildQuotation(body);
      quotations.set(quotation.id, quotation);
      ok(res, quotation, 201);
      return;
    }

    const quotationAction = url.pathname.match(
      /^\/api\/v1\/quotations\/([0-9a-f-]{36})\/(submit|approve|reject|reopen|send|accept|decline|cancel|clone)$/i,
    );
    if (req.method === "POST" && quotationAction) {
      if (unauthorized(req, res)) {
        return;
      }
      const quotation = quotations.get(quotationAction[1]);
      if (!quotation) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      const action = quotationAction[2];
      if (action === "clone") {
        const cloned = buildQuotation({
          ...quotation,
          lines: quotation.lines,
          customer_id: quotation.customer_id,
        });
        cloned.status = "DRAFT";
        cloned.available_actions = quotationAvailableActions("DRAFT");
        quotations.set(cloned.id, cloned);
        ok(res, cloned, 201);
        return;
      }
      const nextStatus = {
        submit: "PENDING_APPROVAL",
        approve: "APPROVED",
        reject: "REJECTED",
        reopen: "DRAFT",
        send: "SENT",
        accept: "ACCEPTED",
        decline: "DECLINED",
        cancel: "CANCELLED",
      }[action];
      if (nextStatus) {
        applyQuotationStatus(quotation, nextStatus);
      }
      quotations.set(quotation.id, quotation);
      ok(res, quotation);
      return;
    }

    const quotationDetail = url.pathname.match(/^\/api\/v1\/quotations\/([0-9a-f-]{36})$/i);
    if (
      quotationDetail &&
      (req.method === "GET" || req.method === "PATCH" || req.method === "DELETE")
    ) {
      if (unauthorized(req, res)) {
        return;
      }
      const existing = quotations.get(quotationDetail[1]);
      if (!existing) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      if (req.method === "GET") {
        ok(res, existing);
        return;
      }
      if (req.method === "DELETE") {
        quotations.delete(quotationDetail[1]);
        ok(res, existing);
        return;
      }
      const body = await readBody(req);
      const quotation = buildQuotation(body, existing);
      quotations.set(quotation.id, quotation);
      ok(res, quotation);
      return;
    }

    const convertQuotation = url.pathname.match(
      /^\/api\/v1\/quotations\/([0-9a-f-]{36})\/convert-to-sales-order$/i,
    );
    if (req.method === "POST" && convertQuotation) {
      if (unauthorized(req, res)) {
        return;
      }
      const quotation = quotations.get(convertQuotation[1]);
      if (!quotation) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      if (quotation.status !== "ACCEPTED" && quotation.status !== "PARTIALLY_CONVERTED") {
        fail(
          res,
          409,
          "INVALID_STATUS",
          "Only an accepted quotation can be converted to a sales order",
        );
        return;
      }
      if (quotation.converted_document_id) {
        fail(res, 409, "ALREADY_CONVERTED", "Quotation already converted");
        return;
      }
      const body = await readBody(req);
      const order = buildSalesOrder(
        {
          customer_id: quotation.customer_id,
          contact_id: quotation.contact_id,
          branch_id: body.branch_id ?? quotation.branch_id,
          warehouse_id: body.warehouse_id ?? WAREHOUSE_MAIN_ID,
          order_date: body.order_date ?? quotation.quote_date,
          expected_shipment_date: body.expected_shipment_date ?? null,
          reference_number: body.reference_number ?? null,
          customer_po_number: body.customer_po_number ?? null,
          currency_id: quotation.currency_id,
          price_list_id: quotation.price_list_id,
          payment_terms_id: quotation.payment_terms_id,
          salesperson_id: quotation.salesperson_id,
          notes: quotation.notes,
          terms_and_conditions: quotation.terms_and_conditions,
          place_of_supply: quotation.place_of_supply,
          discount_type: quotation.discount_type,
          discount_value: quotation.discount_value,
          shipping_amount: quotation.shipping_amount,
          adjustment_amount: quotation.adjustment_amount,
          lines: quotation.lines,
        },
        null,
        {
          fromQuotation: true,
          source_quotation_id: quotation.id,
          customer_trn: quotation.customer_trn,
          tax_treatment: quotation.tax_treatment,
          bill_to_snapshot: quotation.bill_to_snapshot,
          ship_to_snapshot: quotation.ship_to_snapshot,
          warehouse_id: body.warehouse_id ?? WAREHOUSE_MAIN_ID,
        },
      );
      salesOrders.set(order.id, order);
      const now = new Date().toISOString();
      quotation.status = "CONVERTED";
      quotation.version = (quotation.version ?? 1) + 1;
      quotation.converted_at = now;
      quotation.converted_document_type = "SALES_ORDER";
      quotation.converted_document_id = order.id;
      quotation.available_actions = quotationAvailableActions("CONVERTED");
      quotation.updated_at = now;
      quotations.set(quotation.id, quotation);
      ok(res, order);
      return;
    }

    const convertQuotationToInvoice = url.pathname.match(
      /^\/api\/v1\/quotations\/([0-9a-f-]{36})\/convert-to-sales-invoice$/i,
    );
    if (req.method === "POST" && convertQuotationToInvoice) {
      if (unauthorized(req, res)) {
        return;
      }
      const quotation = quotations.get(convertQuotationToInvoice[1]);
      if (!quotation) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      if (quotation.status !== "ACCEPTED" && quotation.status !== "PARTIALLY_CONVERTED") {
        fail(
          res,
          409,
          "INVALID_STATUS",
          "Only an accepted quotation can be converted to a sales invoice",
        );
        return;
      }
      const body = await readBody(req);
      const replay = replayPost(req);
      if (replay) {
        ok(res, replay, 201);
        return;
      }
      const invoice = buildSalesInvoiceFromSource(quotation, {
        invoice_date: body.invoice_date,
        notes: body.notes,
        source_quotation_id: quotation.id,
        related_documents: [
          relatedDocumentRef("QUOTATION", quotation, "source", quotation.quote_date),
        ],
      });
      salesInvoices.set(invoice.id, invoice);
      const related = quotation.related_documents ?? [];
      related.push(relatedDocumentRef("SALES_INVOICE", invoice, "child", invoice.invoice_date));
      quotation.related_documents = related;
      quotation.status = "CONVERTED";
      quotation.version = (quotation.version ?? 1) + 1;
      quotation.converted_at = new Date().toISOString();
      quotation.available_actions = quotationAvailableActions("CONVERTED");
      quotation.updated_at = quotation.converted_at;
      quotations.set(quotation.id, quotation);
      storePost(req, invoice);
      ok(res, invoice, 201);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/v1/sales-invoices") {
      if (unauthorized(req, res)) {
        return;
      }
      listOk(res, [...salesInvoices.values()]);
      return;
    }

    const salesInvoiceDetail = url.pathname.match(/^\/api\/v1\/sales-invoices\/([0-9a-f-]{36})$/i);
    if (req.method === "GET" && salesInvoiceDetail) {
      if (unauthorized(req, res)) {
        return;
      }
      const invoice = salesInvoices.get(salesInvoiceDetail[1]);
      if (!invoice) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      ok(res, invoice);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/v1/proforma-invoices") {
      if (unauthorized(req, res)) {
        return;
      }
      listOk(
        res,
        filterBySearch([...proformaInvoices.values()], url.searchParams.get("search"), [
          "document_number",
          "notes",
        ]),
      );
      return;
    }

    const proformaInvoiceDetail = url.pathname.match(
      /^\/api\/v1\/proforma-invoices\/([0-9a-f-]{36})$/i,
    );
    if (req.method === "GET" && proformaInvoiceDetail) {
      if (unauthorized(req, res)) {
        return;
      }
      const invoice = proformaInvoices.get(proformaInvoiceDetail[1]);
      if (!invoice) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      ok(res, invoice);
      return;
    }

    const proformaInvoiceAction = url.pathname.match(
      /^\/api\/v1\/proforma-invoices\/([0-9a-f-]{36})\/(send|confirm|clone)$/i,
    );
    if (req.method === "POST" && proformaInvoiceAction) {
      if (unauthorized(req, res)) {
        return;
      }
      const invoice = proformaInvoices.get(proformaInvoiceAction[1]);
      if (!invoice) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      const action = proformaInvoiceAction[2];
      if (action === "clone") {
        const cloned = {
          ...invoice,
          id: crypto.randomUUID(),
          document_number: `PFI-${String(++pfiSeq).padStart(4, "0")}`,
          status: "DRAFT",
          version: 1,
          available_actions: ["send", "confirm", "delete"],
          converted_at: null,
          converted_document_type: null,
          converted_document_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        proformaInvoices.set(cloned.id, cloned);
        ok(res, cloned, 201);
        return;
      }
      if (action === "send") {
        invoice.status = "SENT";
        invoice.available_actions = ["confirm", "clone"];
      } else if (action === "confirm") {
        invoice.status = "CONFIRMED";
        invoice.available_actions = ["convert", "create_sales_invoice", "clone"];
        invoice.confirmed_at = new Date().toISOString();
      }
      invoice.version = (invoice.version ?? 1) + 1;
      invoice.updated_at = new Date().toISOString();
      proformaInvoices.set(invoice.id, invoice);
      ok(res, invoice);
      return;
    }

    const convertProformaToSalesOrder = url.pathname.match(
      /^\/api\/v1\/proforma-invoices\/([0-9a-f-]{36})\/convert-to-sales-order$/i,
    );
    if (req.method === "POST" && convertProformaToSalesOrder) {
      if (unauthorized(req, res)) {
        return;
      }
      const invoice = proformaInvoices.get(convertProformaToSalesOrder[1]);
      if (!invoice) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      if (invoice.status !== "CONFIRMED" && invoice.status !== "PARTIALLY_CONVERTED") {
        fail(
          res,
          409,
          "INVALID_STATUS",
          "Only a confirmed proforma invoice can be converted to a sales order",
        );
        return;
      }
      const body = await readBody(req);
      const order = buildSalesOrder(
        {
          customer_id: invoice.customer_id,
          contact_id: invoice.contact_id,
          branch_id: body.branch_id ?? invoice.branch_id,
          warehouse_id: body.warehouse_id ?? WAREHOUSE_MAIN_ID,
          order_date: body.order_date ?? invoice.proforma_date,
          expected_shipment_date:
            body.expected_shipment_date ?? invoice.expected_shipment_date ?? null,
          customer_po_number: body.customer_po_number ?? null,
          customer_po_date: body.customer_po_date ?? null,
          currency_id: invoice.currency_id,
          price_list_id: invoice.price_list_id,
          payment_terms_id: invoice.payment_terms_id,
          salesperson_id: invoice.salesperson_id,
          notes: invoice.notes,
          terms_and_conditions: invoice.terms_and_conditions,
          place_of_supply: invoice.place_of_supply,
          discount_type: invoice.discount_type,
          discount_value: invoice.discount_value,
          shipping_amount: invoice.shipping_amount,
          adjustment_amount: invoice.adjustment_amount,
          lines: invoice.lines,
        },
        null,
        {
          source_quotation_id: invoice.source_quotation_id ?? null,
          source_proforma_invoice_id: invoice.id,
          customer_trn: invoice.customer_trn,
          tax_treatment: invoice.tax_treatment,
          bill_to_snapshot: invoice.bill_to_snapshot,
          ship_to_snapshot: invoice.ship_to_snapshot,
          warehouse_id: body.warehouse_id ?? WAREHOUSE_MAIN_ID,
        },
      );
      salesOrders.set(order.id, order);
      const now = new Date().toISOString();
      invoice.status = "CONVERTED";
      invoice.version = (invoice.version ?? 1) + 1;
      invoice.converted_at = now;
      invoice.converted_document_type = "SALES_ORDER";
      invoice.converted_document_id = order.id;
      invoice.available_actions = ["clone"];
      invoice.updated_at = now;
      proformaInvoices.set(invoice.id, invoice);
      ok(res, order);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/v1/sales-orders") {
      if (unauthorized(req, res)) {
        return;
      }
      listOk(
        res,
        filterBySearch([...salesOrders.values()], url.searchParams.get("search"), [
          "document_number",
          "reference_number",
          "customer_po_number",
          "notes",
        ]),
      );
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/v1/sales-orders") {
      if (unauthorized(req, res)) {
        return;
      }
      const body = await readBody(req);
      const order = buildSalesOrder(body);
      salesOrders.set(order.id, order);
      ok(res, order, 201);
      return;
    }

    const salesOrderAction = url.pathname.match(
      /^\/api\/v1\/sales-orders\/([0-9a-f-]{36})\/(submit|approve|reject|reopen|confirm|close|cancel|clone)$/i,
    );
    if (req.method === "POST" && salesOrderAction) {
      if (unauthorized(req, res)) {
        return;
      }
      const order = salesOrders.get(salesOrderAction[1]);
      if (!order) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      const action = salesOrderAction[2];
      if (action === "clone") {
        const cloned = buildSalesOrder({
          ...order,
          lines: order.lines,
          customer_id: order.customer_id,
        });
        cloned.status = "DRAFT";
        cloned.available_actions = salesOrderAvailableActions("DRAFT");
        salesOrders.set(cloned.id, cloned);
        ok(res, cloned, 201);
        return;
      }
      let nextStatus = {
        submit: "PENDING_APPROVAL",
        approve: "APPROVED",
        reject: "REJECTED",
        confirm: "CONFIRMED",
        close: "CLOSED",
        cancel: "CANCELLED",
      }[action];
      if (action === "reopen") {
        nextStatus = order.status === "CLOSED" ? "CONFIRMED" : "DRAFT";
      }
      if (nextStatus) {
        applySalesOrderStatus(order, nextStatus);
      }
      salesOrders.set(order.id, order);
      ok(res, order);
      return;
    }

    const convertSalesOrderToProforma = url.pathname.match(
      /^\/api\/v1\/sales-orders\/([0-9a-f-]{36})\/convert-to-proforma-invoice$/i,
    );
    if (req.method === "POST" && convertSalesOrderToProforma) {
      if (unauthorized(req, res)) {
        return;
      }
      const order = salesOrders.get(convertSalesOrderToProforma[1]);
      if (!order) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      if (order.status !== "CONFIRMED") {
        fail(
          res,
          409,
          "INVALID_STATUS",
          "Only a confirmed sales order can be converted to a proforma invoice",
        );
        return;
      }
      const body = await readBody(req);
      const invoice = buildProformaInvoiceFromSalesOrder(order, {
        proforma_date: body.proforma_date,
        valid_until: body.valid_until,
        related_documents: [relatedDocumentRef("SALES_ORDER", order, "source", order.order_date)],
      });
      proformaInvoices.set(invoice.id, invoice);
      const related = order.related_documents ?? [];
      related.push(
        relatedDocumentRef("PROFORMA_INVOICE", invoice, "child", invoice.proforma_date),
      );
      order.related_documents = related;
      order.version = (order.version ?? 1) + 1;
      order.updated_at = new Date().toISOString();
      salesOrders.set(order.id, order);
      ok(res, invoice, 201);
      return;
    }

    const salesOrderExtra = url.pathname.match(
      /^\/api\/v1\/sales-orders\/([0-9a-f-]{36})\/(coverage|tracker|deliverable-lines|packable-lines)$/i,
    );
    if (req.method === "GET" && salesOrderExtra) {
      if (unauthorized(req, res)) {
        return;
      }
      const order = salesOrders.get(salesOrderExtra[1]);
      if (!order) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      const extra = salesOrderExtra[2];
      if (extra === "coverage") {
        ok(res, salesOrderCoverage(order));
        return;
      }
      if (extra === "tracker") {
        ok(res, salesOrderTracker(order));
        return;
      }
      if (extra === "deliverable-lines") {
        ok(res, salesOrderDeliverableLines(order));
        return;
      }
      ok(res, salesOrderPackableLines(order));
      return;
    }

    const salesOrderDetail = url.pathname.match(/^\/api\/v1\/sales-orders\/([0-9a-f-]{36})$/i);
    if (
      salesOrderDetail &&
      (req.method === "GET" || req.method === "PATCH" || req.method === "DELETE")
    ) {
      if (unauthorized(req, res)) {
        return;
      }
      const existing = salesOrders.get(salesOrderDetail[1]);
      if (!existing) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      if (req.method === "GET") {
        ok(res, existing);
        return;
      }
      if (req.method === "DELETE") {
        salesOrders.delete(salesOrderDetail[1]);
        ok(res, existing);
        return;
      }
      const body = await readBody(req);
      const order = buildSalesOrder(body, existing);
      salesOrders.set(order.id, order);
      ok(res, order);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/v1/purchase-orders") {
      if (unauthorized(req, res)) {
        return;
      }
      listOk(
        res,
        filterBySearch([...purchaseOrders.values()], url.searchParams.get("search"), [
          "document_number",
          "reference_number",
          "notes",
        ]),
      );
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/v1/purchase-orders") {
      if (unauthorized(req, res)) {
        return;
      }
      const body = await readBody(req);
      const order = buildPurchaseOrder(body);
      purchaseOrders.set(order.id, order);
      ok(res, order, 201);
      return;
    }

    const purchaseOrderAction = url.pathname.match(
      /^\/api\/v1\/purchase-orders\/([0-9a-f-]{36})\/(submit|approve|reject|reopen|issue|close|cancel|clone)$/i,
    );
    if (req.method === "POST" && purchaseOrderAction) {
      if (unauthorized(req, res)) {
        return;
      }
      const order = purchaseOrders.get(purchaseOrderAction[1]);
      if (!order) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      const action = purchaseOrderAction[2];
      if (action === "clone") {
        const cloned = buildPurchaseOrder({
          ...order,
          lines: order.lines,
          supplier_id: order.supplier_id,
        });
        cloned.status = "DRAFT";
        cloned.available_actions = purchaseOrderAvailableActions("DRAFT");
        purchaseOrders.set(cloned.id, cloned);
        ok(res, cloned, 201);
        return;
      }
      let nextStatus = {
        submit: "PENDING_APPROVAL",
        approve: "APPROVED",
        reject: "REJECTED",
        issue: "ISSUED",
        close: "CLOSED",
        cancel: "CANCELLED",
      }[action];
      if (action === "reopen") {
        nextStatus = order.status === "CLOSED" ? "ISSUED" : "DRAFT";
      }
      if (nextStatus) {
        applyPurchaseOrderStatus(order, nextStatus);
      }
      purchaseOrders.set(order.id, order);
      ok(res, order);
      return;
    }

    const purchaseOrderDetail = url.pathname.match(
      /^\/api\/v1\/purchase-orders\/([0-9a-f-]{36})$/i,
    );
    if (
      purchaseOrderDetail &&
      (req.method === "GET" || req.method === "PATCH" || req.method === "DELETE")
    ) {
      if (unauthorized(req, res)) {
        return;
      }
      const existing = purchaseOrders.get(purchaseOrderDetail[1]);
      if (!existing) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      if (req.method === "GET") {
        ok(res, existing);
        return;
      }
      if (req.method === "DELETE") {
        purchaseOrders.delete(purchaseOrderDetail[1]);
        ok(res, existing);
        return;
      }
      const body = await readBody(req);
      const order = buildPurchaseOrder(body, existing);
      purchaseOrders.set(order.id, order);
      ok(res, order);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/v1/permissions/matrix") {
      if (unauthorized(req, res)) {
        return;
      }
      ok(res, {
        modules: [
          {
            module: "identity",
            resources: [
              {
                resource: "role",
                actions: [
                  {
                    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
                    action: "update",
                    code: "identity.role.update",
                    granted: true,
                  },
                ],
              },
              {
                resource: "user",
                actions: [
                  {
                    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
                    action: "read",
                    code: "identity.user.read",
                    granted: true,
                  },
                ],
              },
            ],
          },
          {
            module: "inventory",
            resources: [
              {
                resource: "product",
                actions: [
                  {
                    id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
                    action: "read",
                    code: "inventory.product.read",
                    granted: true,
                  },
                ],
              },
            ],
          },
          {
            module: "erp",
            resources: [
              {
                resource: "period",
                actions: [
                  {
                    id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
                    action: "lock",
                    code: "erp.period.lock",
                    granted: true,
                  },
                  {
                    id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
                    action: "override",
                    code: "erp.period.override",
                    granted: true,
                  },
                ],
              },
            ],
          },
        ],
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/v1/units") {
      if (unauthorized(req, res)) {
        return;
      }
      listOk(res, [unitRow()]);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/v1/products") {
      if (unauthorized(req, res)) {
        return;
      }
      listOk(res, [productRow(), qcProductRow()]);
      return;
    }

    const productHistory = url.pathname.match(
      /^\/api\/v1\/products\/([0-9a-f-]{36})\/(customers|sales-history|purchase-history)$/i,
    );
    if (req.method === "GET" && productHistory) {
      if (unauthorized(req, res)) {
        return;
      }
      listOk(res, []);
      return;
    }

    const customerHistory = url.pathname.match(
      /^\/api\/v1\/customers\/([0-9a-f-]{36})\/(products|sales-history)$/i,
    );
    if (req.method === "GET" && customerHistory) {
      if (unauthorized(req, res)) {
        return;
      }
      listOk(res, []);
      return;
    }

    const supplierHistory = url.pathname.match(
      /^\/api\/v1\/suppliers\/([0-9a-f-]{36})\/purchase-history$/i,
    );
    if (req.method === "GET" && supplierHistory) {
      if (unauthorized(req, res)) {
        return;
      }
      listOk(res, []);
      return;
    }

    const productDetail = url.pathname.match(/^\/api\/v1\/products\/([0-9a-f-]{36})$/i);
    if (req.method === "GET" && productDetail) {
      if (unauthorized(req, res)) {
        return;
      }
      const product = productById(productDetail[1]);
      if (product.id !== productDetail[1]) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      ok(res, product);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/v1/warehouses") {
      if (unauthorized(req, res)) {
        return;
      }
      listOk(res, warehouses());
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/v1/stock") {
      if (unauthorized(req, res)) {
        return;
      }
      const warehouseId = url.searchParams.get("warehouse_id");
      const productId = url.searchParams.get("product_id");
      const categoryId = url.searchParams.get("category_id");
      const negativeOnly = url.searchParams.get("negative_only") === "true";
      const belowReorder = url.searchParams.get("below_reorder") === "true";
      const search = url.searchParams.get("search") ?? "";
      let rows = [...balances.values()].map((row) => {
        row.qty_quality_hold = row.qty_quality_hold ?? "0";
        row.qty_available = qtyString(
          qtyNumber(row.qty_on_hand) - qtyNumber(row.qty_reserved) - qtyNumber(row.qty_quality_hold),
        );
        return row;
      });
      if (warehouseId) {
        rows = rows.filter((row) => row.warehouse_id === warehouseId);
      }
      if (productId) {
        rows = rows.filter((row) => row.product_id === productId);
      }
      if (categoryId) {
        const product = productRow();
        rows = rows.filter(
          (row) => row.product_id === product.id && product.category_id === categoryId,
        );
      }
      if (negativeOnly) {
        rows = rows.filter((row) => qtyNumber(row.qty_on_hand) < 0);
      }
      if (belowReorder) {
        rows = rows.filter(
          (row) =>
            row.reorder_level != null && qtyNumber(row.qty_on_hand) < qtyNumber(row.reorder_level),
        );
      }
      rows = rows.filter((row) =>
        includesSearch([row.sku, row.product_name, row.warehouse_code, row.warehouse_name], search),
      );
      listOk(res, rows);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/v1/stock-movements") {
      if (unauthorized(req, res)) {
        return;
      }
      const productId = url.searchParams.get("product_id");
      const warehouseId = url.searchParams.get("warehouse_id");
      const categoryId = url.searchParams.get("category_id");
      const movementType = url.searchParams.get("movement_type");
      const sourceType = url.searchParams.get("source_type");
      const sourceId = url.searchParams.get("source_id");
      const dateFrom = url.searchParams.get("document_date_from");
      const dateTo = url.searchParams.get("document_date_to");
      const search = url.searchParams.get("search") ?? "";
      let rows = [...movements];
      if (productId) {
        rows = rows.filter((row) => row.product_id === productId);
      }
      if (warehouseId) {
        rows = rows.filter((row) => row.warehouse_id === warehouseId);
      }
      if (categoryId) {
        const product = productRow();
        rows = rows.filter(
          (row) => row.product_id === product.id && product.category_id === categoryId,
        );
      }
      if (movementType) {
        rows = rows.filter((row) => row.movement_type === movementType);
      }
      if (sourceType) {
        rows = rows.filter((row) => row.source_type === sourceType);
      }
      if (sourceId) {
        rows = rows.filter((row) => row.source_id === sourceId);
      }
      rows = rows.filter((row) => inDocumentDateRange(row.document_date, dateFrom, dateTo));
      rows = rows.filter((row) => includesSearch([row.sku, row.product_name, row.notes], search));
      listOk(res, rows);
      return;
    }

    const reorderMatch = url.pathname.match(/^\/api\/v1\/stock\/([0-9a-f-]{36})\/reorder$/i);
    if (req.method === "PATCH" && reorderMatch) {
      if (unauthorized(req, res)) {
        return;
      }
      const body = await readBody(req);
      const row = [...balances.values()].find((item) => item.id === reorderMatch[1]);
      if (!row) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      if (body.reorder_level !== undefined) {
        row.reorder_level = body.reorder_level;
      }
      if (body.reorder_qty !== undefined) {
        row.reorder_qty = body.reorder_qty;
      }
      ok(res, row);
      return;
    }

    const layersMatch = url.pathname.match(/^\/api\/v1\/stock\/([0-9a-f-]{36})\/layers$/i);
    if (req.method === "GET" && layersMatch) {
      if (unauthorized(req, res)) {
        return;
      }
      ok(res, []);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/v1/stock-adjustments") {
      if (unauthorized(req, res)) {
        return;
      }
      const status = url.searchParams.get("status");
      const warehouseId = url.searchParams.get("warehouse_id");
      const reason = url.searchParams.get("reason");
      const branchId = url.searchParams.get("branch_id");
      const productId = url.searchParams.get("product_id");
      const dateFrom = url.searchParams.get("document_date_from");
      const dateTo = url.searchParams.get("document_date_to");
      const search = url.searchParams.get("search") ?? "";
      const rows = [...adjustments.values()].filter((row) => {
        if (status && row.status !== status) {
          return false;
        }
        if (warehouseId && row.warehouse_id !== warehouseId) {
          return false;
        }
        if (reason && row.reason !== reason) {
          return false;
        }
        if (branchId && row.branch_id !== branchId) {
          return false;
        }
        if (!hasLineProduct(row, productId)) {
          return false;
        }
        if (!inDocumentDateRange(row.document_date, dateFrom, dateTo)) {
          return false;
        }
        return includesSearch([row.document_number, row.notes, row.reference], search);
      });
      listOk(res, rows.map(stockDocumentResponse));
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/v1/stock-adjustments") {
      if (unauthorized(req, res)) {
        return;
      }
      const body = await readBody(req);
      const documentDate = body.document_date ?? NOW.slice(0, 10);
      if (rejectIfPeriodLocked(res, documentDate)) {
        return;
      }
      const document = buildAdjustment(body);
      adjustments.set(document.id, document);
      ok(res, stockDocumentResponse(document), 201);
      return;
    }

    const adjustmentAction = url.pathname.match(
      /^\/api\/v1\/stock-adjustments\/([0-9a-f-]{36})\/(post|cancel|clone)$/i,
    );
    if (req.method === "POST" && adjustmentAction) {
      if (unauthorized(req, res)) {
        return;
      }
      const document = adjustments.get(adjustmentAction[1]);
      if (!document) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      const action = adjustmentAction[2];
      if (action === "clone") {
        const cloned = buildAdjustment(document);
        cloned.document_number = `STA-${String(++adjSeq).padStart(4, "0")}`;
        cloned.status = "DRAFT";
        cloned.is_posted = false;
        cloned.available_actions = draftActions();
        adjustments.set(cloned.id, cloned);
        ok(res, stockDocumentResponse(cloned));
        return;
      }
      if (isStale(req, document.version)) {
        fail(res, 409, "DOCUMENT_STALE", "Stale");
        return;
      }
      if (action === "post") {
        const replayed = replayPost(req);
        if (replayed) {
          ok(res, stockDocumentResponse(replayed));
          return;
        }
        if (document.status === "POSTED") {
          ok(res, stockDocumentResponse(document));
          return;
        }
        if (rejectIfPeriodLocked(res, document.document_date)) {
          return;
        }
        try {
          const posted = postAdjustment(document);
          adjustments.set(posted.id, posted);
          storePost(req, posted);
          ok(res, stockDocumentResponse(posted));
        } catch (error) {
          if (error.message === "INSUFFICIENT") {
            fail(res, 409, "INVENTORY_INSUFFICIENT_STOCK", "Insufficient stock", error.details);
            return;
          }
          throw error;
        }
        return;
      }
      if (action === "cancel") {
        const body = await readBody(req);
        document.status = "CANCELLED";
        document.available_actions = [];
        document.cancel_reason = body.reason ?? null;
        document.cancelled_at = new Date().toISOString();
        document.version += 1;
        adjustments.set(document.id, document);
        ok(res, stockDocumentResponse(document));
        return;
      }
    }

    const adjustmentDetail = url.pathname.match(/^\/api\/v1\/stock-adjustments\/([0-9a-f-]{36})$/i);
    if (adjustmentDetail) {
      if (unauthorized(req, res)) {
        return;
      }
      const existing = adjustments.get(adjustmentDetail[1]);
      if (!existing) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      if (req.method === "GET") {
        ok(res, stockDocumentResponse(existing));
        return;
      }
      if (isStale(req, existing.version)) {
        fail(res, 409, "DOCUMENT_STALE", "Stale");
        return;
      }
      if (req.method === "DELETE") {
        adjustments.delete(adjustmentDetail[1]);
        ok(res, stockDocumentResponse(existing));
        return;
      }
      if (req.method === "PATCH") {
        const body = await readBody(req);
        const documentDate = body.document_date ?? existing.document_date;
        if (rejectIfPeriodLocked(res, documentDate)) {
          return;
        }
        const updated = buildAdjustment(body, existing);
        adjustments.set(updated.id, updated);
        ok(res, stockDocumentResponse(updated));
        return;
      }
    }

    if (req.method === "GET" && url.pathname === "/api/v1/stock-transfers") {
      if (unauthorized(req, res)) {
        return;
      }
      const status = url.searchParams.get("status");
      const fromWarehouseId = url.searchParams.get("from_warehouse_id");
      const toWarehouseId = url.searchParams.get("to_warehouse_id");
      const branchId = url.searchParams.get("branch_id");
      const productId = url.searchParams.get("product_id");
      const dateFrom = url.searchParams.get("document_date_from");
      const dateTo = url.searchParams.get("document_date_to");
      const search = url.searchParams.get("search") ?? "";
      const rows = [...transfers.values()].filter((row) => {
        if (status && row.status !== status) {
          return false;
        }
        if (fromWarehouseId && row.from_warehouse_id !== fromWarehouseId) {
          return false;
        }
        if (toWarehouseId && row.to_warehouse_id !== toWarehouseId) {
          return false;
        }
        if (branchId && row.branch_id !== branchId) {
          return false;
        }
        if (!hasLineProduct(row, productId)) {
          return false;
        }
        if (!inDocumentDateRange(row.document_date, dateFrom, dateTo)) {
          return false;
        }
        return includesSearch([row.document_number, row.notes, row.reference], search);
      });
      listOk(res, rows.map(stockDocumentResponse));
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/v1/stock-transfers") {
      if (unauthorized(req, res)) {
        return;
      }
      const body = await readBody(req);
      const documentDate = body.document_date ?? NOW.slice(0, 10);
      if (rejectIfPeriodLocked(res, documentDate)) {
        return;
      }
      const document = buildTransfer(body);
      transfers.set(document.id, document);
      ok(res, stockDocumentResponse(document), 201);
      return;
    }

    const transferAction = url.pathname.match(
      /^\/api\/v1\/stock-transfers\/([0-9a-f-]{36})\/(post|cancel|clone)$/i,
    );
    if (req.method === "POST" && transferAction) {
      if (unauthorized(req, res)) {
        return;
      }
      const document = transfers.get(transferAction[1]);
      if (!document) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      const action = transferAction[2];
      if (action === "clone") {
        const cloned = buildTransfer(document);
        cloned.document_number = `STR-${String(++xferSeq).padStart(4, "0")}`;
        cloned.status = "DRAFT";
        cloned.is_posted = false;
        cloned.available_actions = draftActions();
        transfers.set(cloned.id, cloned);
        ok(res, stockDocumentResponse(cloned));
        return;
      }
      if (isStale(req, document.version)) {
        fail(res, 409, "DOCUMENT_STALE", "Stale");
        return;
      }
      if (action === "post") {
        const replayed = replayPost(req);
        if (replayed) {
          ok(res, stockDocumentResponse(replayed));
          return;
        }
        if (document.status === "POSTED") {
          ok(res, stockDocumentResponse(document));
          return;
        }
        if (rejectIfPeriodLocked(res, document.document_date)) {
          return;
        }
        try {
          const posted = postTransfer(document);
          transfers.set(posted.id, posted);
          storePost(req, posted);
          ok(res, stockDocumentResponse(posted));
        } catch (error) {
          if (error.message === "INSUFFICIENT") {
            fail(res, 409, "INVENTORY_INSUFFICIENT_STOCK", "Insufficient stock", error.details);
            return;
          }
          throw error;
        }
        return;
      }
      if (action === "cancel") {
        const body = await readBody(req);
        document.status = "CANCELLED";
        document.available_actions = [];
        document.cancel_reason = body.reason ?? null;
        document.cancelled_at = new Date().toISOString();
        document.version += 1;
        transfers.set(document.id, document);
        ok(res, stockDocumentResponse(document));
        return;
      }
    }

    const transferDetail = url.pathname.match(/^\/api\/v1\/stock-transfers\/([0-9a-f-]{36})$/i);
    if (transferDetail) {
      if (unauthorized(req, res)) {
        return;
      }
      const existing = transfers.get(transferDetail[1]);
      if (!existing) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      if (req.method === "GET") {
        ok(res, stockDocumentResponse(existing));
        return;
      }
      if (isStale(req, existing.version)) {
        fail(res, 409, "DOCUMENT_STALE", "Stale");
        return;
      }
      if (req.method === "DELETE") {
        transfers.delete(transferDetail[1]);
        ok(res, stockDocumentResponse(existing));
        return;
      }
      if (req.method === "PATCH") {
        const body = await readBody(req);
        const documentDate = body.document_date ?? existing.document_date;
        if (rejectIfPeriodLocked(res, documentDate)) {
          return;
        }
        const updated = buildTransfer(body, existing);
        transfers.set(updated.id, updated);
        ok(res, stockDocumentResponse(updated));
        return;
      }
    }

    if (req.method === "GET" && url.pathname === "/api/v1/goods-receipts") {
      if (unauthorized(req, res)) {
        return;
      }
      const status = url.searchParams.get("status");
      const supplierId = url.searchParams.get("supplier_id");
      const warehouseId = url.searchParams.get("warehouse_id");
      const purchaseOrderId = url.searchParams.get("purchase_order_id");
      const qcStatus = url.searchParams.get("qc_status");
      const productId = url.searchParams.get("product_id");
      const dateFrom = url.searchParams.get("document_date_from");
      const dateTo = url.searchParams.get("document_date_to");
      const search = url.searchParams.get("search") ?? "";
      const rows = [...goodsReceipts.values()].filter((row) => {
        if (status && row.status !== status) {
          return false;
        }
        if (supplierId && row.supplier_id !== supplierId) {
          return false;
        }
        if (warehouseId && row.warehouse_id !== warehouseId) {
          return false;
        }
        if (purchaseOrderId && row.purchase_order_id !== purchaseOrderId) {
          return false;
        }
        if (qcStatus && row.qc_status !== qcStatus) {
          return false;
        }
        if (!hasLineProduct(row, productId)) {
          return false;
        }
        if (!inDocumentDateRange(row.document_date, dateFrom, dateTo)) {
          return false;
        }
        return includesSearch([row.document_number, row.notes, row.supplier_invoice_number], search);
      });
      listOk(res, rows.map(stockDocumentResponse));
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/v1/goods-receipts/from-purchase-order") {
      if (unauthorized(req, res)) {
        return;
      }
      const body = await readBody(req);
      try {
        const document = createGoodsReceiptFromPurchaseOrder(body);
        goodsReceipts.set(document.id, document);
        ok(res, stockDocumentResponse(document), 201);
      } catch (error) {
        if (error.message === "NOT_FOUND") {
          fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
          return;
        }
        throw error;
      }
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/v1/goods-receipts") {
      if (unauthorized(req, res)) {
        return;
      }
      const body = await readBody(req);
      const documentDate = body.document_date ?? NOW.slice(0, 10);
      if (rejectIfPeriodLocked(res, documentDate)) {
        return;
      }
      const document = buildGoodsReceipt(body);
      goodsReceipts.set(document.id, document);
      ok(res, stockDocumentResponse(document), 201);
      return;
    }

    const goodsReceiptAction = url.pathname.match(
      /^\/api\/v1\/goods-receipts\/([0-9a-f-]{36})\/(post|cancel)$/i,
    );
    if (req.method === "POST" && goodsReceiptAction) {
      if (unauthorized(req, res)) {
        return;
      }
      const document = goodsReceipts.get(goodsReceiptAction[1]);
      if (!document) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      if (isStale(req, document.version)) {
        fail(res, 409, "DOCUMENT_STALE", "Stale");
        return;
      }
      const action = goodsReceiptAction[2];
      if (action === "post") {
        const replayed = replayPost(req);
        if (replayed) {
          ok(res, stockDocumentResponse(replayed));
          return;
        }
        if (document.status === "POSTED") {
          ok(res, stockDocumentResponse(document));
          return;
        }
        if (rejectIfPeriodLocked(res, document.document_date)) {
          return;
        }
        const posted = postGoodsReceipt(document);
        goodsReceipts.set(posted.id, posted);
        storePost(req, posted);
        ok(res, stockDocumentResponse(posted));
        return;
      }
      if (action === "cancel") {
        const body = await readBody(req);
        if (document.status === "DRAFT") {
          document.status = "CANCELLED";
          document.available_actions = [];
          document.cancel_reason = body.reason ?? null;
          document.cancelled_at = new Date().toISOString();
          document.version += 1;
          goodsReceipts.set(document.id, document);
          ok(res, stockDocumentResponse(document));
          return;
        }
        try {
          const cancelled = cancelPostedGoodsReceipt(document);
          cancelled.cancel_reason = body.reason ?? null;
          goodsReceipts.set(cancelled.id, cancelled);
          ok(res, stockDocumentResponse(cancelled));
        } catch (error) {
          if (error.message === "GRN_CANNOT_CANCEL") {
            fail(res, 409, "GRN_CANNOT_CANCEL", "Cannot cancel");
            return;
          }
          throw error;
        }
        return;
      }
    }

    const goodsReceiptDetail = url.pathname.match(/^\/api\/v1\/goods-receipts\/([0-9a-f-]{36})$/i);
    if (
      goodsReceiptDetail &&
      (req.method === "GET" || req.method === "PATCH" || req.method === "DELETE")
    ) {
      if (unauthorized(req, res)) {
        return;
      }
      const existing = goodsReceipts.get(goodsReceiptDetail[1]);
      if (!existing) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      if (req.method === "GET") {
        ok(res, stockDocumentResponse(existing));
        return;
      }
      if (isStale(req, existing.version)) {
        fail(res, 409, "DOCUMENT_STALE", "Stale");
        return;
      }
      if (req.method === "DELETE") {
        goodsReceipts.delete(goodsReceiptDetail[1]);
        ok(res, stockDocumentResponse(existing));
        return;
      }
      const body = await readBody(req);
      const documentDate = body.document_date ?? existing.document_date;
      if (rejectIfPeriodLocked(res, documentDate)) {
        return;
      }
      const updated = buildGoodsReceipt(body, existing);
      goodsReceipts.set(updated.id, updated);
      ok(res, stockDocumentResponse(updated));
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/v1/quality-inspections") {
      if (unauthorized(req, res)) {
        return;
      }
      const status = url.searchParams.get("status");
      const goodsReceiptId = url.searchParams.get("goods_receipt_id");
      const dateFrom = url.searchParams.get("inspection_date_from");
      const dateTo = url.searchParams.get("inspection_date_to");
      const search = url.searchParams.get("search") ?? "";
      const rows = [...qualityInspections.values()].filter((row) => {
        if (status && row.status !== status) {
          return false;
        }
        if (goodsReceiptId && row.goods_receipt_id !== goodsReceiptId) {
          return false;
        }
        if (!inDocumentDateRange(row.inspection_date, dateFrom, dateTo)) {
          return false;
        }
        return includesSearch([row.document_number, row.notes], search);
      });
      listOk(res, rows);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/v1/quality-inspections") {
      if (unauthorized(req, res)) {
        return;
      }
      const body = await readBody(req);
      const document = buildQualityInspection(body);
      qualityInspections.set(document.id, document);
      ok(res, document, 201);
      return;
    }

    const qualityInspectionAction = url.pathname.match(
      /^\/api\/v1\/quality-inspections\/([0-9a-f-]{36})\/(approve|cancel)$/i,
    );
    if (req.method === "POST" && qualityInspectionAction) {
      if (unauthorized(req, res)) {
        return;
      }
      const document = qualityInspections.get(qualityInspectionAction[1]);
      if (!document) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      if (isStale(req, document.version)) {
        fail(res, 409, "DOCUMENT_STALE", "Stale");
        return;
      }
      if (qualityInspectionAction[2] === "approve") {
        try {
          const approved = approveQualityInspection(document);
          qualityInspections.set(approved.id, approved);
          ok(res, approved);
        } catch (error) {
          if (error.message === "QUALITY_QTY_MISMATCH") {
            fail(res, 409, "QUALITY_QTY_MISMATCH", "Quantities do not add up");
            return;
          }
          throw error;
        }
        return;
      }
      const body = await readBody(req);
      document.status = "CANCELLED";
      document.available_actions = [];
      document.cancel_reason = body.reason ?? null;
      document.cancelled_at = new Date().toISOString();
      document.version += 1;
      qualityInspections.set(document.id, document);
      ok(res, document);
      return;
    }

    const qualityInspectionDetail = url.pathname.match(
      /^\/api\/v1\/quality-inspections\/([0-9a-f-]{36})$/i,
    );
    if (
      qualityInspectionDetail &&
      (req.method === "GET" || req.method === "PATCH" || req.method === "DELETE")
    ) {
      if (unauthorized(req, res)) {
        return;
      }
      const existing = qualityInspections.get(qualityInspectionDetail[1]);
      if (!existing) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      if (req.method === "GET") {
        ok(res, existing);
        return;
      }
      if (isStale(req, existing.version)) {
        fail(res, 409, "DOCUMENT_STALE", "Stale");
        return;
      }
      if (req.method === "DELETE") {
        qualityInspections.delete(qualityInspectionDetail[1]);
        ok(res, existing);
        return;
      }
      const body = await readBody(req);
      const updated = buildQualityInspection(body, existing);
      qualityInspections.set(updated.id, updated);
      ok(res, updated);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/v1/attachments") {
      if (unauthorized(req, res)) {
        return;
      }
      const entityType = url.searchParams.get("entity_type");
      const entityId = url.searchParams.get("entity_id");
      const category = url.searchParams.get("category");
      const rows = [...attachments.values()].filter((row) => {
        if (entityType && row.entity_type !== entityType) {
          return false;
        }
        if (entityId && row.entity_id !== entityId) {
          return false;
        }
        if (category && row.category !== category) {
          return false;
        }
        return true;
      });
      listOk(res, rows);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/v1/attachments") {
      if (unauthorized(req, res)) {
        return;
      }
      await drain(req);
      attachmentSeq += 1;
      const id = `a1a1a1a1-a1a1-41a1-81a1-${String(attachmentSeq).padStart(12, "0")}`;
      const row = {
        id,
        tenant_id: TENANT_ID,
        entity_type: "QUOTATION",
        entity_id: CUSTOMER_ID,
        original_filename: "upload.bin",
        content_type: "application/octet-stream",
        size_bytes: 12,
        category: "OTHER",
        image_width: null,
        image_height: null,
        thumbnail_url: null,
        created_by: USER_ID,
        created_at: NOW,
        updated_at: NOW,
      };
      attachments.set(id, row);
      ok(res, row, 201);
      return;
    }

    const attachmentDetail = url.pathname.match(/^\/api\/v1\/attachments\/([0-9a-f-]{36})$/i);
    if (attachmentDetail) {
      if (unauthorized(req, res)) {
        return;
      }
      const existing = attachments.get(attachmentDetail[1]);
      if (!existing) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      if (req.method === "GET") {
        ok(res, { ...existing, download_url: "https://example.test/file.bin" });
        return;
      }
      if (req.method === "PATCH") {
        const body = await readBody(req);
        existing.category = body.category ?? existing.category;
        existing.updated_at = new Date().toISOString();
        attachments.set(existing.id, existing);
        ok(res, existing);
        return;
      }
      if (req.method === "DELETE") {
        attachments.delete(existing.id);
        ok(res, existing);
        return;
      }
    }

    if (req.method === "GET" && url.pathname === "/api/v1/delivery-notes") {
      if (unauthorized(req, res)) {
        return;
      }
      const status = url.searchParams.get("status");
      const salesOrderId = url.searchParams.get("sales_order_id");
      const shipmentId = url.searchParams.get("shipment_id");
      const unshipped = url.searchParams.get("unshipped");
      const search = (url.searchParams.get("search") ?? "").toLowerCase();
      const rows = [...deliveryNotes.values()].filter((row) => {
        if (status && row.status !== status) {
          return false;
        }
        if (salesOrderId && row.sales_order_id !== salesOrderId) {
          return false;
        }
        if (shipmentId && row.shipment_id !== shipmentId) {
          return false;
        }
        if (unshipped === "true" && row.shipment_id) {
          return false;
        }
        if (search && !String(row.document_number).toLowerCase().includes(search)) {
          return false;
        }
        return true;
      });
      listOk(res, rows);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/v1/delivery-notes/from-sales-order") {
      if (unauthorized(req, res)) {
        return;
      }
      const body = await readBody(req);
      const order = salesOrders.get(body.sales_order_id);
      if (!order) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      const lines = salesOrderDeliverableLines(order)
        .filter((line) => qtyNumber(line.outstanding) > 0)
        .map((line) => ({
          sales_order_line_id: line.sales_order_line_id,
          product_id: line.product_id,
          description: line.description,
          quantity: line.outstanding,
          unit_id: line.unit_id,
          rate: line.rate,
        }));
      const document = buildDeliveryNote({
        ...body,
        warehouse_id: body.warehouse_id ?? order.warehouse_id ?? WAREHOUSE_MAIN_ID,
        lines,
      });
      deliveryNotes.set(document.id, document);
      ok(res, stockDocumentResponse(document), 201);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/v1/delivery-notes") {
      if (unauthorized(req, res)) {
        return;
      }
      const body = await readBody(req);
      const document = buildDeliveryNote(body);
      deliveryNotes.set(document.id, document);
      ok(res, stockDocumentResponse(document), 201);
      return;
    }

    const deliveryNotePackage = url.pathname.match(
      /^\/api\/v1\/delivery-notes\/([0-9a-f-]{36})\/packages(?:\/([0-9a-f-]{36}))?$/i,
    );
    if (deliveryNotePackage) {
      if (unauthorized(req, res)) {
        return;
      }
      const note = deliveryNotes.get(deliveryNotePackage[1]);
      if (!note) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      if (req.method === "POST") {
        const body = await readBody(req);
        const pkg = packages.get(body.package_id);
        if (!pkg) {
          fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
          return;
        }
        pkg.delivery_note_id = note.id;
        pkg.updated_at = new Date().toISOString();
        packages.set(pkg.id, pkg);
        ok(res, stockDocumentResponse(note));
        return;
      }
      if (req.method === "DELETE" && deliveryNotePackage[2]) {
        const pkg = packages.get(deliveryNotePackage[2]);
        if (pkg) {
          pkg.delivery_note_id = null;
          pkg.updated_at = new Date().toISOString();
          packages.set(pkg.id, pkg);
        }
        ok(res, stockDocumentResponse(note));
        return;
      }
    }

    const deliveryNoteAction = url.pathname.match(
      /^\/api\/v1\/delivery-notes\/([0-9a-f-]{36})\/(post|cancel)$/i,
    );
    if (req.method === "POST" && deliveryNoteAction) {
      if (unauthorized(req, res)) {
        return;
      }
      const document = deliveryNotes.get(deliveryNoteAction[1]);
      if (!document) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      if (isStale(req, document.version)) {
        fail(res, 409, "DOCUMENT_STALE", "Stale");
        return;
      }
      if (deliveryNoteAction[2] === "post") {
        try {
          const posted = postDeliveryNote(document);
          deliveryNotes.set(posted.id, posted);
          ok(res, stockDocumentResponse(posted));
        } catch (error) {
          if (error.message === "INSUFFICIENT") {
            fail(res, 409, "INVENTORY_INSUFFICIENT_STOCK", "Insufficient stock", error.details);
            return;
          }
          throw error;
        }
        return;
      }
      const body = await readBody(req);
      document.status = "CANCELLED";
      document.available_actions = [];
      document.cancel_reason = body.reason ?? null;
      document.cancelled_at = new Date().toISOString();
      document.version += 1;
      deliveryNotes.set(document.id, document);
      ok(res, stockDocumentResponse(document));
      return;
    }

    const deliveryNoteDetail = url.pathname.match(/^\/api\/v1\/delivery-notes\/([0-9a-f-]{36})$/i);
    if (deliveryNoteDetail) {
      if (unauthorized(req, res)) {
        return;
      }
      const existing = deliveryNotes.get(deliveryNoteDetail[1]);
      if (!existing) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      if (req.method === "GET") {
        ok(res, stockDocumentResponse(existing));
        return;
      }
      if (isStale(req, existing.version)) {
        fail(res, 409, "DOCUMENT_STALE", "Stale");
        return;
      }
      if (req.method === "DELETE") {
        deliveryNotes.delete(deliveryNoteDetail[1]);
        ok(res, stockDocumentResponse(existing));
        return;
      }
      if (req.method === "PATCH") {
        const body = await readBody(req);
        const updated = buildDeliveryNote(body, existing);
        deliveryNotes.set(updated.id, updated);
        ok(res, stockDocumentResponse(updated));
        return;
      }
    }

    if (req.method === "GET" && url.pathname === "/api/v1/packages") {
      if (unauthorized(req, res)) {
        return;
      }
      const status = url.searchParams.get("status");
      const salesOrderId = url.searchParams.get("sales_order_id");
      const deliveryNoteId = url.searchParams.get("delivery_note_id");
      const rows = [...packages.values()].filter((row) => {
        if (status && row.status !== status) {
          return false;
        }
        if (salesOrderId && row.sales_order_id !== salesOrderId) {
          return false;
        }
        if (deliveryNoteId && row.delivery_note_id !== deliveryNoteId) {
          return false;
        }
        return true;
      });
      listOk(res, rows);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/v1/packages") {
      if (unauthorized(req, res)) {
        return;
      }
      const body = await readBody(req);
      const document = buildPackage(body);
      packages.set(document.id, document);
      ok(res, document, 201);
      return;
    }

    const packageAction = url.pathname.match(/^\/api\/v1\/packages\/([0-9a-f-]{36})\/(pack|cancel)$/i);
    if (req.method === "POST" && packageAction) {
      if (unauthorized(req, res)) {
        return;
      }
      const document = packages.get(packageAction[1]);
      if (!document) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      if (isStale(req, document.version)) {
        fail(res, 409, "DOCUMENT_STALE", "Stale");
        return;
      }
      document.status = packageAction[2] === "pack" ? "PACKED" : "CANCELLED";
      document.version += 1;
      document.updated_at = new Date().toISOString();
      document.available_actions = packageActions(document.status);
      packages.set(document.id, document);
      ok(res, document);
      return;
    }

    const packageDetail = url.pathname.match(/^\/api\/v1\/packages\/([0-9a-f-]{36})$/i);
    if (packageDetail) {
      if (unauthorized(req, res)) {
        return;
      }
      const existing = packages.get(packageDetail[1]);
      if (!existing) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      if (req.method === "GET") {
        ok(res, existing);
        return;
      }
      if (isStale(req, existing.version)) {
        fail(res, 409, "DOCUMENT_STALE", "Stale");
        return;
      }
      if (req.method === "DELETE") {
        packages.delete(packageDetail[1]);
        ok(res, existing);
        return;
      }
      if (req.method === "PATCH") {
        const body = await readBody(req);
        const updated = buildPackage(body, existing);
        packages.set(updated.id, updated);
        ok(res, updated);
        return;
      }
    }

    if (req.method === "GET" && url.pathname === "/api/v1/shipments") {
      if (unauthorized(req, res)) {
        return;
      }
      const status = url.searchParams.get("status");
      const shipmentType = url.searchParams.get("shipment_type");
      const rows = [...shipments.values()].filter((row) => {
        if (status && row.status !== status) {
          return false;
        }
        if (shipmentType && row.shipment_type !== shipmentType) {
          return false;
        }
        return true;
      });
      listOk(res, rows);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/v1/shipments") {
      if (unauthorized(req, res)) {
        return;
      }
      const body = await readBody(req);
      const document = buildShipment(body);
      shipments.set(document.id, document);
      ok(res, document, 201);
      return;
    }

    const shipmentNotes = url.pathname.match(
      /^\/api\/v1\/shipments\/([0-9a-f-]{36})\/delivery-notes(?:\/([0-9a-f-]{36}))?$/i,
    );
    if (shipmentNotes) {
      if (unauthorized(req, res)) {
        return;
      }
      const shipment = shipments.get(shipmentNotes[1]);
      if (!shipment) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      if (req.method === "POST") {
        const body = await readBody(req);
        for (const noteId of body.delivery_note_ids ?? []) {
          const note = deliveryNotes.get(noteId);
          if (note) {
            note.shipment_id = shipment.id;
            note.updated_at = new Date().toISOString();
            deliveryNotes.set(note.id, note);
          }
        }
        ok(res, shipment);
        return;
      }
      if (req.method === "DELETE" && shipmentNotes[2]) {
        const note = deliveryNotes.get(shipmentNotes[2]);
        if (note) {
          note.shipment_id = null;
          note.updated_at = new Date().toISOString();
          deliveryNotes.set(note.id, note);
        }
        ok(res, shipment);
        return;
      }
    }

    const shipmentAction = url.pathname.match(
      /^\/api\/v1\/shipments\/([0-9a-f-]{36})\/(dispatch|arrive|close|cancel)$/i,
    );
    if (req.method === "POST" && shipmentAction) {
      if (unauthorized(req, res)) {
        return;
      }
      const document = shipments.get(shipmentAction[1]);
      if (!document) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      if (isStale(req, document.version)) {
        fail(res, 409, "DOCUMENT_STALE", "Stale");
        return;
      }
      const nextStatus = {
        dispatch: "DISPATCHED",
        arrive: "ARRIVED",
        close: "CLOSED",
        cancel: "CANCELLED",
      }[shipmentAction[2]];
      document.status = nextStatus;
      document.version += 1;
      document.updated_at = new Date().toISOString();
      document.available_actions = shipmentActions(document.status);
      shipments.set(document.id, document);
      ok(res, document);
      return;
    }

    const shipmentTracking = url.pathname.match(/^\/api\/v1\/shipments\/([0-9a-f-]{36})\/tracking$/i);
    if (req.method === "PATCH" && shipmentTracking) {
      if (unauthorized(req, res)) {
        return;
      }
      const document = shipments.get(shipmentTracking[1]);
      if (!document) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      if (isStale(req, document.version)) {
        fail(res, 409, "DOCUMENT_STALE", "Stale");
        return;
      }
      const body = await readBody(req);
      Object.assign(document, {
        carrier_name: body.carrier_name ?? document.carrier_name,
        vessel_or_flight_no: body.vessel_or_flight_no ?? document.vessel_or_flight_no,
        voyage_number: body.voyage_number ?? document.voyage_number,
        bl_awb_number: body.bl_awb_number ?? document.bl_awb_number,
        bl_awb_date: body.bl_awb_date ?? document.bl_awb_date,
        etd: body.etd ?? document.etd,
        eta: body.eta ?? document.eta,
        actual_departure_date: body.actual_departure_date ?? document.actual_departure_date,
        actual_arrival_date: body.actual_arrival_date ?? document.actual_arrival_date,
      });
      document.version += 1;
      document.updated_at = new Date().toISOString();
      shipments.set(document.id, document);
      ok(res, document);
      return;
    }

    const shipmentDetail = url.pathname.match(/^\/api\/v1\/shipments\/([0-9a-f-]{36})$/i);
    if (shipmentDetail) {
      if (unauthorized(req, res)) {
        return;
      }
      const existing = shipments.get(shipmentDetail[1]);
      if (!existing) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      if (req.method === "GET") {
        ok(res, existing);
        return;
      }
      if (isStale(req, existing.version)) {
        fail(res, 409, "DOCUMENT_STALE", "Stale");
        return;
      }
      if (req.method === "DELETE") {
        shipments.delete(shipmentDetail[1]);
        ok(res, existing);
        return;
      }
      if (req.method === "PATCH") {
        const body = await readBody(req);
        const updated = buildShipment(body, existing);
        shipments.set(updated.id, updated);
        ok(res, updated);
        return;
      }
    }

    if (req.method === "GET" && url.pathname === "/api/v1/sales-returns") {
      if (unauthorized(req, res)) {
        return;
      }
      const status = url.searchParams.get("status");
      const deliveryNoteId = url.searchParams.get("delivery_note_id");
      const rows = [...salesReturns.values()].filter((row) => {
        if (status && row.status !== status) {
          return false;
        }
        if (deliveryNoteId && row.delivery_note_id !== deliveryNoteId) {
          return false;
        }
        return true;
      });
      listOk(res, rows);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/v1/sales-returns") {
      if (unauthorized(req, res)) {
        return;
      }
      const body = await readBody(req);
      const document = buildSalesReturn(body);
      salesReturns.set(document.id, document);
      ok(res, stockDocumentResponse(document), 201);
      return;
    }

    const salesReturnAction = url.pathname.match(
      /^\/api\/v1\/sales-returns\/([0-9a-f-]{36})\/(post|cancel)$/i,
    );
    if (req.method === "POST" && salesReturnAction) {
      if (unauthorized(req, res)) {
        return;
      }
      const document = salesReturns.get(salesReturnAction[1]);
      if (!document) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      if (isStale(req, document.version)) {
        fail(res, 409, "DOCUMENT_STALE", "Stale");
        return;
      }
      if (salesReturnAction[2] === "post") {
        const posted = postSalesReturn(document);
        salesReturns.set(posted.id, posted);
        ok(res, stockDocumentResponse(posted));
        return;
      }
      const body = await readBody(req);
      document.status = "CANCELLED";
      document.available_actions = [];
      document.cancel_reason = body.reason ?? null;
      document.cancelled_at = new Date().toISOString();
      document.version += 1;
      salesReturns.set(document.id, document);
      ok(res, stockDocumentResponse(document));
      return;
    }

    const salesReturnDetail = url.pathname.match(/^\/api\/v1\/sales-returns\/([0-9a-f-]{36})$/i);
    if (salesReturnDetail) {
      if (unauthorized(req, res)) {
        return;
      }
      const existing = salesReturns.get(salesReturnDetail[1]);
      if (!existing) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      if (req.method === "GET") {
        ok(res, stockDocumentResponse(existing));
        return;
      }
      if (isStale(req, existing.version)) {
        fail(res, 409, "DOCUMENT_STALE", "Stale");
        return;
      }
      if (req.method === "DELETE") {
        salesReturns.delete(salesReturnDetail[1]);
        ok(res, stockDocumentResponse(existing));
        return;
      }
      if (req.method === "PATCH") {
        const body = await readBody(req);
        const updated = buildSalesReturn(body, existing);
        salesReturns.set(updated.id, updated);
        ok(res, stockDocumentResponse(updated));
        return;
      }
    }

    if (req.method === "GET" && url.pathname === "/api/v1/accounts/tree") {
      if (unauthorized(req, res)) {
        return;
      }
      ok(res, accountTree());
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/v1/accounts/system-roles") {
      if (unauthorized(req, res)) {
        return;
      }
      ok(res, systemRoleMappings());
      return;
    }

    const systemRolePut = url.pathname.match(/^\/api\/v1\/accounts\/system-roles\/([A-Z0-9_]+)$/i);
    if (req.method === "PUT" && systemRolePut) {
      if (unauthorized(req, res)) {
        return;
      }
      const role = systemRolePut[1];
      const body = await readBody(req);
      const account = accounts.get(body.account_id);
      if (!account) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      for (const row of accounts.values()) {
        if (row.system_role === role) {
          row.system_role = null;
        }
      }
      account.system_role = role;
      accounts.set(account.id, account);
      ok(res, {
        role,
        account_id: account.id,
        account_code: account.code,
        account_name: account.name,
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/v1/accounts") {
      if (unauthorized(req, res)) {
        return;
      }
      const search = url.searchParams.get("search") ?? "";
      const accountType = url.searchParams.get("account_type");
      const accountSubtype = url.searchParams.get("account_subtype");
      const isGroup = url.searchParams.get("is_group");
      const isActive = url.searchParams.get("is_active");
      const rows = [...accounts.values()].filter((row) => {
        if (accountType && row.account_type !== accountType) {
          return false;
        }
        if (accountSubtype && row.account_subtype !== accountSubtype) {
          return false;
        }
        if (isGroup === "true" && !row.is_group) {
          return false;
        }
        if (isGroup === "false" && row.is_group) {
          return false;
        }
        if (isActive === "true" && !row.is_active) {
          return false;
        }
        if (isActive === "false" && row.is_active) {
          return false;
        }
        return includesSearch([row.code, row.name], search);
      });
      listOk(res, rows);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/v1/accounts") {
      if (unauthorized(req, res)) {
        return;
      }
      const body = await readBody(req);
      const created = makeAccount({
        id: crypto.randomUUID(),
        code: body.code,
        name: body.name,
        description: body.description,
        account_type: body.account_type,
        account_subtype: body.account_subtype,
        parent_id: body.parent_id ?? null,
        is_group: body.is_group,
        currency_id: body.currency_id,
      });
      accounts.set(created.id, created);
      ok(res, created, 201);
      return;
    }

    const accountDetail = url.pathname.match(/^\/api\/v1\/accounts\/([0-9a-f-]{36})$/i);
    if (accountDetail) {
      if (unauthorized(req, res)) {
        return;
      }
      const existing = accounts.get(accountDetail[1]);
      if (!existing) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      if (req.method === "GET") {
        ok(res, existing);
        return;
      }
      if (req.method === "DELETE") {
        if (existing.is_system) {
          fail(res, 409, "VALIDATION_ERROR", "System accounts cannot be deleted");
          return;
        }
        accounts.delete(existing.id);
        ok(res, existing);
        return;
      }
      if (req.method === "PATCH") {
        const body = await readBody(req);
        const updated = {
          ...existing,
          ...(body.code !== undefined && !existing.is_system ? { code: body.code } : {}),
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.description !== undefined ? { description: body.description } : {}),
          ...(body.account_type !== undefined ? { account_type: body.account_type } : {}),
          ...(body.account_subtype !== undefined ? { account_subtype: body.account_subtype } : {}),
          ...(body.parent_id !== undefined ? { parent_id: body.parent_id } : {}),
          ...(body.is_group !== undefined ? { is_group: body.is_group } : {}),
          ...(body.is_active !== undefined ? { is_active: body.is_active } : {}),
          ...(body.currency_id !== undefined ? { currency_id: body.currency_id } : {}),
          updated_at: new Date().toISOString(),
        };
        accounts.set(updated.id, updated);
        ok(res, updated);
        return;
      }
    }

    if (req.method === "GET" && url.pathname === "/api/v1/journals") {
      if (unauthorized(req, res)) {
        return;
      }
      const search = url.searchParams.get("search") ?? "";
      const status = url.searchParams.get("status");
      const journalType = url.searchParams.get("journal_type");
      const dateFrom = url.searchParams.get("entry_date_from");
      const dateTo = url.searchParams.get("entry_date_to");
      const rows = [...journals.values()].filter((row) => {
        if (status && row.status !== status) {
          return false;
        }
        if (journalType && row.journal_type !== journalType) {
          return false;
        }
        if (!inDocumentDateRange(row.entry_date, dateFrom, dateTo)) {
          return false;
        }
        return includesSearch([row.document_number, row.narration, row.reference], search);
      });
      listOk(res, rows);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/v1/journals") {
      if (unauthorized(req, res)) {
        return;
      }
      const body = await readBody(req);
      const created = buildJournal(body);
      journals.set(created.id, created);
      ok(res, created, 201);
      return;
    }

    const journalAction = url.pathname.match(
      /^\/api\/v1\/journals\/([0-9a-f-]{36})\/(post|cancel|reverse)$/i,
    );
    if (req.method === "POST" && journalAction) {
      if (unauthorized(req, res)) {
        return;
      }
      const document = journals.get(journalAction[1]);
      if (!document) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      if (isStale(req, document.version)) {
        fail(res, 409, "DOCUMENT_STALE", "Stale");
        return;
      }
      const replayed = replayPost(req);
      if (replayed) {
        ok(res, replayed);
        return;
      }
      if (journalAction[2] === "post") {
        const refusal = refuseJournalPost(document);
        if (refusal) {
          fail(res, 422, refusal, refusal);
          return;
        }
        const posted = postJournal(document);
        journals.set(posted.id, posted);
        storePost(req, posted);
        ok(res, posted);
        return;
      }
      if (journalAction[2] === "cancel") {
        const body = await readBody(req);
        const cancelled = {
          ...document,
          status: "CANCELLED",
          available_actions: [],
          version: document.version + 1,
          updated_at: new Date().toISOString(),
          cancel_reason: body.reason ?? null,
        };
        journals.set(cancelled.id, cancelled);
        ok(res, cancelled);
        return;
      }
      const { original, reversed } = reverseJournal(document);
      journals.set(original.id, original);
      journals.set(reversed.id, reversed);
      storePost(req, reversed);
      ok(res, reversed);
      return;
    }

    const journalDetail = url.pathname.match(/^\/api\/v1\/journals\/([0-9a-f-]{36})$/i);
    if (journalDetail) {
      if (unauthorized(req, res)) {
        return;
      }
      const existing = journals.get(journalDetail[1]);
      if (!existing) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      if (req.method === "GET") {
        ok(res, existing);
        return;
      }
      if (isStale(req, existing.version)) {
        fail(res, 409, "DOCUMENT_STALE", "Stale");
        return;
      }
      if (req.method === "DELETE") {
        journals.delete(existing.id);
        ok(res, existing);
        return;
      }
      if (req.method === "PATCH") {
        const body = await readBody(req);
        const updated = buildJournal(body, existing);
        journals.set(updated.id, updated);
        ok(res, updated);
        return;
      }
    }

    if (req.method === "GET" && url.pathname === "/api/v1/opening-balances") {
      if (unauthorized(req, res)) {
        return;
      }
      ok(res, openingBalanceState);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/v1/opening-balances/preview") {
      if (unauthorized(req, res)) {
        return;
      }
      const body = await readBody(req);
      ok(res, previewOpeningBalances(body));
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/v1/opening-balances/commit") {
      if (unauthorized(req, res)) {
        return;
      }
      const replayed = replayPost(req);
      if (replayed) {
        ok(res, replayed);
        return;
      }
      const body = await readBody(req);
      const preview = previewOpeningBalances(body);
      const committedJournal = buildJournal(
        {
          entry_date: preview.entry_date,
          currency_id: CURRENCY_ID,
          exchange_rate: "1",
          narration: "Opening balances",
          lines: preview.lines.map((line) => ({
            account_id: line.account_id,
            debit: line.debit,
            credit: line.credit,
            description: line.description,
          })),
        },
        null,
        { status: "POSTED", journal_type: "OPENING_BALANCE" },
      );
      journals.set(committedJournal.id, committedJournal);
      tenantState.books_start_date = body.books_start_date;
      tenantState.hard_lock_date = preview.entry_date;
      openingBalanceState = {
        committed: true,
        books_start_date: body.books_start_date,
        hard_lock_date: preview.entry_date,
        journal_entry_id: committedJournal.id,
        document_number: committedJournal.document_number,
        committed_at: new Date().toISOString(),
        can_reset: true,
      };
      storePost(req, openingBalanceState);
      ok(res, openingBalanceState);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/v1/opening-balances/reset") {
      if (unauthorized(req, res)) {
        return;
      }
      if (!openingBalanceState.can_reset) {
        fail(res, 409, "VALIDATION_ERROR", "Opening balances cannot be reset");
        return;
      }
      if (openingBalanceState.journal_entry_id) {
        journals.delete(openingBalanceState.journal_entry_id);
      }
      tenantState.books_start_date = null;
      tenantState.hard_lock_date = null;
      openingBalanceState = emptyOpeningState();
      ok(res, openingBalanceState);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/v1/reports/trial-balance") {
      if (unauthorized(req, res)) {
        return;
      }
      const from = url.searchParams.get("from") ?? url.searchParams.get("from_date");
      const to = url.searchParams.get("to") ?? url.searchParams.get("to_date");
      const includeZero = url.searchParams.get("include_zero") === "true";
      ok(res, trialBalanceReport(from, to, includeZero));
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/v1/reports/general-ledger") {
      if (unauthorized(req, res)) {
        return;
      }
      const accountId = url.searchParams.get("account_id");
      const from = url.searchParams.get("from") ?? url.searchParams.get("from_date");
      const to = url.searchParams.get("to") ?? url.searchParams.get("to_date");
      const report = generalLedgerReport(accountId, from, to);
      if (!report) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      ok(res, report);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/v1/reports/account-statement") {
      if (unauthorized(req, res)) {
        return;
      }
      const partyType = url.searchParams.get("party_type");
      const partyId = url.searchParams.get("party_id");
      const from = url.searchParams.get("from") ?? url.searchParams.get("from_date");
      const to = url.searchParams.get("to") ?? url.searchParams.get("to_date");
      ok(res, accountStatementReport(partyType, partyId, from, to));
      return;
    }

    if (req.method === "GET" && EMPTY_LIST_PATHS.has(url.pathname)) {
      if (unauthorized(req, res)) {
        return;
      }
      listOk(res, []);
      return;
    }

    fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
  } catch (error) {
    process.stderr.write(`mock error ${req.method} ${url.pathname}: ${error}\n`);
    fail(res, 500, "INTERNAL_ERROR", "Mock failed");
  }
});

server.listen(PORT, "127.0.0.1", () => {
  process.stdout.write(`mock backend listening on ${PORT}\n`);
});
