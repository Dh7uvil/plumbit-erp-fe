import http from "node:http";

const PORT = Number(process.env.MOCK_API_PORT ?? 4010);
const TENANT_ID = "11111111-1111-4111-8111-111111111111";
const USER_ID = "22222222-2222-4222-8222-222222222222";
const SUPERADMIN_ROLE_ID = "33333333-3333-4333-8333-333333333333";
const EMPLOYEE_ROLE_ID = "66666666-6666-4666-8666-666666666666";
const CURRENCY_ID = "44444444-4444-4444-8444-444444444444";
const CUSTOMER_ID = "55555555-5555-4555-8555-555555555555";
const UNIT_ID = "88888888-8888-4888-8888-888888888888";
const PRODUCT_ID = "99999999-9999-4999-8999-999999999999";
const WAREHOUSE_MAIN_ID = "12121212-1212-4121-8121-121212121212";
const WAREHOUSE_SITE_ID = "13131313-1313-4131-8131-131313131313";
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
  "/api/v1/attachments",
  "/api/v1/branches",
  "/api/v1/categories",
  "/api/v1/contacts",
  "/api/v1/departments",
  "/api/v1/document-sequences",
  "/api/v1/exchange-rates",
  "/api/v1/payment-terms",
  "/api/v1/price-lists",
  "/api/v1/suppliers",
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
let adjustments = new Map();
let transfers = new Map();
let balances = new Map();
let movements = [];
let adjSeq = 0;
let xferSeq = 0;
let postReplays = new Map();
let tenantLogoUrl = null;
let tenantState = {
  name: ORGANIZATION_NAME,
  timezone: "Asia/Dubai",
  default_currency: "AED",
  default_currency_id: CURRENCY_ID,
  quotation_requires_approval: true,
  allow_negative_stock: false,
  lock_date: null,
  hard_lock_date: null,
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
  adjustments = new Map();
  transfers = new Map();
  balances = new Map();
  movements = [];
  adjSeq = 0;
  xferSeq = 0;
  postReplays = new Map();
  tenantState.allow_negative_stock = false;
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
    tax_id: null,
    hs_code: null,
    track_inventory: true,
    is_active: true,
    created_at: NOW,
    updated_at: NOW,
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
  const product = productRow();
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
  row.qty_available = qtyString(qtyNumber(row.qty_on_hand) - qtyNumber(row.qty_reserved));
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
  const available = qtyNumber(balance.qty_on_hand) - qtyNumber(balance.qty_reserved);
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
  balance.qty_available = qtyString(after - qtyNumber(balance.qty_reserved));
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
    default_currency: tenantState.default_currency,
    default_currency_id: tenantState.default_currency_id,
    quotation_requires_approval: tenantState.quotation_requires_approval,
    allow_negative_stock: tenantState.allow_negative_stock,
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
      "erp.supplier.read",
      "erp.supplier.create",
      "erp.supplier.update",
      "erp.supplier.delete",
      "identity.attachment.read",
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
        ...(body.allow_negative_stock !== undefined
          ? { allow_negative_stock: body.allow_negative_stock }
          : {}),
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

    if (req.method === "GET" && url.pathname === "/api/v1/currencies") {
      if (unauthorized(req, res)) {
        return;
      }
      listOk(res, [currency()]);
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

    if (req.method === "GET" && url.pathname === "/api/v1/quotations") {
      if (unauthorized(req, res)) {
        return;
      }
      listOk(res, [...quotations.values()]);
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
      listOk(res, [productRow()]);
      return;
    }

    const productDetail = url.pathname.match(/^\/api\/v1\/products\/([0-9a-f-]{36})$/i);
    if (req.method === "GET" && productDetail) {
      if (unauthorized(req, res)) {
        return;
      }
      if (productDetail[1] !== PRODUCT_ID) {
        fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
        return;
      }
      ok(res, productRow());
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
        row.qty_available = qtyString(qtyNumber(row.qty_on_hand) - qtyNumber(row.qty_reserved));
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
      listOk(res, rows);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/v1/stock-adjustments") {
      if (unauthorized(req, res)) {
        return;
      }
      const body = await readBody(req);
      const document = buildAdjustment(body);
      adjustments.set(document.id, document);
      ok(res, document, 201);
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
        ok(res, cloned);
        return;
      }
      if (isStale(req, document.version)) {
        fail(res, 409, "DOCUMENT_STALE", "Stale");
        return;
      }
      if (action === "post") {
        const replayed = replayPost(req);
        if (replayed) {
          ok(res, replayed);
          return;
        }
        if (document.status === "POSTED") {
          ok(res, document);
          return;
        }
        try {
          const posted = postAdjustment(document);
          adjustments.set(posted.id, posted);
          storePost(req, posted);
          ok(res, posted);
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
        ok(res, document);
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
        ok(res, existing);
        return;
      }
      if (isStale(req, existing.version)) {
        fail(res, 409, "DOCUMENT_STALE", "Stale");
        return;
      }
      if (req.method === "DELETE") {
        adjustments.delete(adjustmentDetail[1]);
        ok(res, existing);
        return;
      }
      if (req.method === "PATCH") {
        const body = await readBody(req);
        const updated = buildAdjustment(body, existing);
        adjustments.set(updated.id, updated);
        ok(res, updated);
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
      listOk(res, rows);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/v1/stock-transfers") {
      if (unauthorized(req, res)) {
        return;
      }
      const body = await readBody(req);
      const document = buildTransfer(body);
      transfers.set(document.id, document);
      ok(res, document, 201);
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
        ok(res, cloned);
        return;
      }
      if (isStale(req, document.version)) {
        fail(res, 409, "DOCUMENT_STALE", "Stale");
        return;
      }
      if (action === "post") {
        const replayed = replayPost(req);
        if (replayed) {
          ok(res, replayed);
          return;
        }
        if (document.status === "POSTED") {
          ok(res, document);
          return;
        }
        try {
          const posted = postTransfer(document);
          transfers.set(posted.id, posted);
          storePost(req, posted);
          ok(res, posted);
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
        ok(res, document);
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
        ok(res, existing);
        return;
      }
      if (isStale(req, existing.version)) {
        fail(res, 409, "DOCUMENT_STALE", "Stale");
        return;
      }
      if (req.method === "DELETE") {
        transfers.delete(transferDetail[1]);
        ok(res, existing);
        return;
      }
      if (req.method === "PATCH") {
        const body = await readBody(req);
        const updated = buildTransfer(body, existing);
        transfers.set(updated.id, updated);
        ok(res, updated);
        return;
      }
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
