import http from "node:http";

const PORT = Number(process.env.MOCK_API_PORT ?? 4010);
const TENANT_ID = "11111111-1111-4111-8111-111111111111";
const USER_ID = "22222222-2222-4222-8222-222222222222";
const SUPERADMIN_ROLE_ID = "33333333-3333-4333-8333-333333333333";
const EMPLOYEE_ROLE_ID = "66666666-6666-4666-8666-666666666666";
const CURRENCY_ID = "44444444-4444-4444-8444-444444444444";
const CUSTOMER_ID = "55555555-5555-4555-8555-555555555555";
const EMAIL = "ada@plumbit.com";
const PASSWORD = "correct-horse";
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
  "/api/v1/products",
  "/api/v1/taxes",
  "/api/v1/terms-templates",
  "/api/v1/units",
  "/api/v1/users",
  "/api/v1/warehouses",
]);

let currentPassword = PASSWORD;
let accessToken = "access-token-1";
let refreshToken = "refresh-token-1";
let quotations = new Map();
let quoteSeq = 0;
let tenantLogoUrl = null;
let tenantState = {
  name: ORGANIZATION_NAME,
  timezone: "Asia/Dubai",
  default_currency: "AED",
  default_currency_id: CURRENCY_ID,
  quotation_requires_approval: true,
};

function json(res, status, body) {
  res.writeHead(status, { "content-type": "application/json" });
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

function fail(res, status, code, message) {
  json(res, status, { success: false, error: { code, message } });
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

function buildQuotation(body, existing = null) {
  quoteSeq += existing ? 0 : 1;
  const id = existing?.id ?? crypto.randomUUID();
  const lines = buildLines(body.lines ?? existing?.lines ?? []);
  const subtotal = lines.reduce((sum, line) => sum + Number(line.amount), 0).toFixed(2);
  const now = new Date().toISOString();
  return {
    id,
    tenant_id: TENANT_ID,
    quote_number: existing?.quote_number ?? `QUO-${String(quoteSeq).padStart(4, "0")}`,
    status: existing?.status ?? "DRAFT",
    quote_date: body.quote_date ?? existing?.quote_date ?? "2026-08-27",
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
    lines,
    created_at: existing?.created_at ?? now,
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
    if (req.method === "GET" && url.pathname === "/api/v1/tenants") {
      ok(res, [{ tenant_id: TENANT_ID, name: ORGANIZATION_NAME, logo_url: tenantLogoUrl }]);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/v1/auth/login") {
      const body = await readBody(req);
      if (
        body.tenant_id !== TENANT_ID ||
        body.email !== EMAIL ||
        body.password !== currentPassword
      ) {
        fail(res, 401, "AUTH_INVALID_CREDENTIALS", "Invalid credentials");
        return;
      }
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
      if (action === "submit") {
        quotation.status = "PENDING_APPROVAL";
      } else if (action === "approve") {
        quotation.status = "APPROVED";
      } else if (action === "reject") {
        quotation.status = "REJECTED";
      } else if (action === "reopen") {
        quotation.status = "DRAFT";
      } else if (action === "send") {
        quotation.status = "SENT";
      } else if (action === "accept") {
        quotation.status = "ACCEPTED";
      } else if (action === "decline") {
        quotation.status = "DECLINED";
      } else if (action === "cancel") {
        quotation.status = "CANCELLED";
      } else if (action === "clone") {
        const cloned = buildQuotation({
          ...quotation,
          lines: quotation.lines,
          customer_id: quotation.customer_id,
        });
        cloned.status = "DRAFT";
        quotations.set(cloned.id, cloned);
        ok(res, cloned, 201);
        return;
      }
      quotation.updated_at = new Date().toISOString();
      quotations.set(quotation.id, quotation);
      ok(res, quotation);
      return;
    }

    const quotationDetail = url.pathname.match(/^\/api\/v1\/quotations\/([0-9a-f-]{36})$/i);
    if (quotationDetail && (req.method === "GET" || req.method === "PATCH")) {
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

    if (req.method === "GET" && EMPTY_LIST_PATHS.has(url.pathname)) {
      if (unauthorized(req, res)) {
        return;
      }
      listOk(res, []);
      return;
    }

    fail(res, 404, "RESOURCE_NOT_FOUND", "Not found");
  } catch {
    fail(res, 500, "INTERNAL_ERROR", "Mock failed");
  }
});

server.listen(PORT, "127.0.0.1", () => {
  process.stdout.write(`mock backend listening on ${PORT}\n`);
});
