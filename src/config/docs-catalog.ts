import { BookOpen } from "lucide-react";

import type { NavigationGroup, NavigationItem } from "@/config/navigation";

export type DocPage = {
  slug: string;
  title: string;
  description: string;
  keywords?: string[];
  related?: string[];
  appHrefs?: string[];
  lastReviewed: string;
};

export type DocCategoryMeta = {
  slug: string;
  label: string;
  description: string;
};

export type DocCategory = DocCategoryMeta & {
  pages: DocPage[];
};

const REVIEWED = "2026-09-23";

function page(
  slug: string,
  title: string,
  description: string,
  opts?: Partial<Pick<DocPage, "keywords" | "related" | "appHrefs">>,
): DocPage {
  return { slug, title, description, lastReviewed: REVIEWED, ...opts };
}

export const docsCatalog: DocCategory[] = [
  {
    slug: "getting-started",
    label: "Getting Started",
    description: "Learn the basics of Plumbit ERP.",
    pages: [
      page("system-overview", "System overview", "How Plumbit ERP modules connect.", {
        keywords: ["overview", "modules", "erp"],
      }),
      page("dashboard", "Dashboard overview", "KPI cards and operational panels.", {
        appHrefs: ["/"],
        keywords: ["kpi", "home"],
      }),
      page("navigation-and-search", "Navigation and modules", "Sidebar, search, and mobile menu.", {
        keywords: ["sidebar", "menu", "cmd+k"],
      }),
      page("keyboard-shortcuts", "Keyboard shortcuts", "Shortcuts that work across the app.", {
        keywords: ["shortcuts", "keyboard"],
      }),
      page("working-with-lists", "Working with lists", "Filters, columns, sorting, and preferences.", {
        keywords: ["filters", "table", "columns"],
      }),
      page("working-with-documents", "Working with documents", "Draft vs posted, cancellation by reversal, period lock, and versioning.", {
        keywords: ["draft", "post", "convert", "cancel", "reversal"],
        related: ["getting-started/document-relationships"],
      }),
      page("document-relationships", "Document relationships", "Which documents can be created from which sources and required statuses.", {
        keywords: ["convert", "create from", "workflow"],
        related: ["workflows/procure-to-pay", "workflows/order-to-cash"],
      }),
      page("implementation-notes", "Implementation notes", "Known behaviors that differ from typical ERP expectations.", {
        keywords: ["quirks", "edge cases", "limitations"],
      }),
      page("profile-and-settings", "User profile and settings", "Profile and password settings.", {
        appHrefs: ["/settings/profile", "/settings/password"],
      }),
      page("notifications", "Notifications", "Notification preferences.", {
        appHrefs: ["/settings/notifications"],
      }),
      page("terminology", "General terminology", "Glossary of common ERP terms.", {
        keywords: ["glossary", "grni", "fifo", "ar", "ap"],
      }),
    ],
  },
  {
    slug: "organization-and-access",
    label: "Organization & Access",
    description: "Company structure, users, roles, and permissions.",
    pages: [
      page("organization-settings", "Organization settings", "Company and policy configuration.", {
        appHrefs: ["/organization-settings"],
      }),
      page("branches", "Branches", "Operating locations on documents.", {
        appHrefs: ["/organization-settings"],
        keywords: ["branch"],
      }),
      page("departments", "Departments", "Department setup and assignment.", {
        appHrefs: ["/organization-settings"],
      }),
      page("employees-and-salespersons", "Employees and salespersons", "Employees linked to users and sales.", {
        keywords: ["salesperson", "employee"],
      }),
      page("warehouses-setup", "Warehouses", "Warehouse setup and defaults.", {
        appHrefs: ["/warehouses", "/organization-settings"],
      }),
      page("users", "Users", "Creating and managing users.", { appHrefs: ["/users"] }),
      page("roles-and-permissions", "Roles and permissions", "Permission codes and roles.", {
        appHrefs: ["/roles", "/permissions"],
      }),
      page("how-access-works", "How access control works", "Role-based access explained.", {
        related: ["organization-and-access/roles-and-permissions"],
      }),
      page("audit-logs-and-history", "Audit logs and history", "Audit trail vs document history.", {
        appHrefs: ["/audit-logs"],
      }),
      page("outbox", "Outbox", "Email event queue for administrators.", { appHrefs: ["/outbox-events"] }),
    ],
  },
  {
    slug: "master-data",
    label: "Master Data",
    description: "Products, parties, taxes, and reference data.",
    pages: [
      page("master-data-overview", "Master data overview", "Recommended setup order.", {
        related: ["getting-started/terminology"],
      }),
      page("units-of-measure", "Units of measurement", "Product units.", { appHrefs: ["/units"] }),
      page("product-categories", "Product categories", "Category hierarchy.", { appHrefs: ["/categories"] }),
      page("products", "Products", "Product and service items.", { appHrefs: ["/products"] }),
      page("price-lists", "Price lists", "Customer pricing rules.", { appHrefs: ["/price-lists"] }),
      page("customers", "Customers", "Customer master records.", { appHrefs: ["/customers"] }),
      page("contacts", "Contacts", "CRM contacts linked to customers.", { appHrefs: ["/contacts"] }),
      page("suppliers", "Suppliers", "Supplier master records.", { appHrefs: ["/suppliers"] }),
      page("supplier-catalog", "Supplier catalog", "Supplier-product relationships.", {
        appHrefs: ["/supplier-products"],
      }),
      page("currencies", "Currencies", "Currency definitions.", { appHrefs: ["/currencies"] }),
      page("exchange-rates", "Exchange rates", "Foreign exchange rates.", { appHrefs: ["/exchange-rates"] }),
      page("taxes", "Taxes", "Tax rates and VAT setup.", { appHrefs: ["/taxes"] }),
      page("payment-terms", "Payment terms", "Due date rules.", { appHrefs: ["/payment-terms"] }),
      page("terms-templates", "Terms templates", "Standard terms text.", { appHrefs: ["/terms-templates"] }),
      page("cost-centers", "Cost centers", "Cost center tracking.", { appHrefs: ["/cost-centers"] }),
      page("charge-types", "Charge types", "Freight and duty charge types.", { appHrefs: ["/charge-types"] }),
      page("document-sequences", "Document sequences", "Numbering configuration.", {
        appHrefs: ["/document-sequences"],
      }),
      page("importing-and-exporting-data", "Importing and exporting data", "CSV/XLSX data import.", {
        keywords: ["csv", "xlsx", "import", "export"],
      }),
    ],
  },
  {
    slug: "inventory",
    label: "Inventory",
    description: "Stock, warehouses, movements, and valuation.",
    pages: [
      page("stock-concepts", "Stock concepts", "On hand, reserved, QC hold, available.", {
        appHrefs: ["/stock"],
        keywords: ["reserved", "available", "qc hold"],
      }),
      page("warehouse-wise-stock", "Warehouse-wise stock", "Stock by warehouse.", { appHrefs: ["/stock"] }),
      page("how-stock-changes", "How stock changes", "Movement types and source documents.", {
        appHrefs: ["/stock-movements"],
      }),
      page("opening-stock", "Opening stock", "Opening stock entry methods.", {
        appHrefs: ["/stock-adjustments", "/opening-balances"],
      }),
      page("receiving-stock", "Receiving stock", "Goods receipt overview.", { appHrefs: ["/goods-receipts"] }),
      page("stock-transfers", "Stock transfers", "Moving stock between warehouses.", {
        appHrefs: ["/stock-transfers"],
      }),
      page("stock-adjustments", "Stock adjustments", "Adjustments and reasons.", {
        appHrefs: ["/stock-adjustments"],
      }),
      page("stock-movements", "Stock movements", "Stock history ledger.", { appHrefs: ["/stock-movements"] }),
      page("reorder-levels", "Reorder levels", "Reorder level and quantity.", {
        appHrefs: ["/stock"],
        keywords: ["reorder", "min stock"],
      }),
      page("quality-inspections-and-qc-hold", "Quality inspections", "QC hold and inspections.", {
        appHrefs: ["/quality-inspections"],
      }),
      page("inventory-valuation", "Inventory valuation", "FIFO valuation and landed costs.", {
        appHrefs: ["/reports/stock-valuation"],
        keywords: ["fifo", "valuation"],
      }),
      page("negative-stock-and-shortfalls", "Negative stock and shortfalls", "Shortfall handling on SO confirm.", {
        keywords: ["negative stock", "shortfall"],
      }),
    ],
  },
  {
    slug: "sales",
    label: "Sales",
    description: "Quotations through payments and returns.",
    pages: [
      page("sales-lifecycle", "Sales lifecycle", "End-to-end sales document flow.", {
        related: ["workflows/order-to-cash"],
      }),
      page("quotations", "Quotations", "Quotes, approval, and conversion.", { appHrefs: ["/quotations"] }),
      page("proforma-invoices", "Proforma invoices", "Preliminary customer bills.", {
        appHrefs: ["/proforma-invoices"],
      }),
      page("sales-orders", "Sales orders", "Confirm reserves stock; delivery note post issues stock and COGS.", {
        appHrefs: ["/sales-orders"],
        related: ["sales/delivery-notes", "sales/sales-invoices", "inventory/stock-concepts"],
      }),
      page("delivery-notes", "Delivery notes", "Post issues FIFO stock and records COGS in the GL.", {
        appHrefs: ["/delivery-notes"],
        related: ["sales/sales-orders", "sales/sales-invoices"],
      }),
      page("sales-invoices", "Sales invoices", "Post creates AR, revenue, and VAT output; no stock movement.", {
        appHrefs: ["/sales-invoices"],
        related: ["sales/delivery-notes", "sales/customer-payments"],
      }),
      page("credit-notes", "Credit notes", "Customer credit documents.", { appHrefs: ["/credit-notes"] }),
      page("customer-payments", "Customer payments", "Receipts and allocations.", {
        appHrefs: ["/customer-payments"],
      }),
      page("sales-returns", "Sales returns", "Customer returns and dispositions.", { appHrefs: ["/sales-returns"] }),
      page("credit-control", "Credit control", "Credit limits and overrides.", { keywords: ["credit limit"] }),
      page("payment-reminders", "Payment reminders", "Dunning rules and reminders.", {
        appHrefs: ["/dunning-rules"],
      }),
      page("sales-stock-and-accounting-impact", "Sales stock and accounting impact", "Combined stock/GL effects.", {
        related: ["sales/delivery-notes", "sales/sales-invoices"],
      }),
    ],
  },
  {
    slug: "purchases",
    label: "Purchases",
    description: "Purchase orders through supplier payments.",
    pages: [
      page("purchase-lifecycle", "Purchase lifecycle", "Procure-to-pay overview.", {
        related: ["workflows/procure-to-pay"],
      }),
      page("purchases-workspace", "Purchases workspace", "Combined orders and bills view.", {
        appHrefs: ["/purchases"],
      }),
      page("purchase-orders", "Purchase orders", "Supplier commitment; issue increases incoming qty, not on-hand stock.", {
        appHrefs: ["/purchase-orders", "/purchases"],
        related: ["purchases/goods-receipts", "purchases/purchase-invoices", "master-data/suppliers"],
      }),
      page("goods-receipts", "Goods receipts", "Post to increase stock, create GRNI, and update PO received qty.", {
        appHrefs: ["/goods-receipts"],
        keywords: ["grn", "grni"],
        related: ["purchases/purchase-orders", "purchases/purchase-invoices", "inventory/how-stock-changes"],
      }),
      page("purchase-invoices", "Purchase invoices", "Post to create AP, clear GRNI, and record VAT input.", {
        appHrefs: ["/purchase-invoices", "/purchases"],
        related: ["purchases/goods-receipts", "purchases/supplier-payments"],
      }),
      page("debit-notes", "Debit notes", "Supplier debit documents.", { appHrefs: ["/debit-notes"] }),
      page("supplier-payments", "Supplier payments", "Payments and allocations.", {
        appHrefs: ["/supplier-payments"],
      }),
      page("landed-costs", "Landed costs", "Freight and duty capitalization.", { appHrefs: ["/landed-costs"] }),
      page("purchase-returns", "Purchase returns", "Returns to suppliers.", { appHrefs: ["/purchase-returns"] }),
      page("three-way-match", "Three-way match", "PO, receipt, and bill matching.", {
        appHrefs: ["/reports/three-way-match"],
      }),
      page("purchases-stock-and-accounting-impact", "Purchases stock and accounting impact", "Combined stock/GL effects.", {
        related: ["purchases/goods-receipts", "purchases/purchase-invoices"],
      }),
    ],
  },
  {
    slug: "import-export",
    label: "Import & Export",
    description: "International trade, shipments, and landed costs.",
    pages: [
      page("trade-overview", "Trade overview", "Import/export vs data import.", {
        related: ["master-data/importing-and-exporting-data"],
      }),
      page("packages", "Packages", "Packing for shipment.", { appHrefs: ["/packages"] }),
      page("shipments", "Shipments", "Shipment tracking and statuses.", { appHrefs: ["/shipments"] }),
      page("freight-customs-and-charges", "Freight and customs charges", "Charge types and landed costs.", {
        appHrefs: ["/charge-types", "/landed-costs"],
      }),
      page("cost-sheets", "Cost sheets", "Import/export cost planning.", { appHrefs: ["/cost-sheets"] }),
      page("export-evidence", "Export evidence", "UAE VAT export documentation.", {
        appHrefs: ["/reports/export-evidence-exceptions"],
      }),
      page("trade-stock-and-accounting-impact", "Trade stock and accounting impact", "When trade documents affect stock/GL.", {
        related: ["import-export/shipments", "purchases/landed-costs"],
      }),
    ],
  },
  {
    slug: "accounting",
    label: "Accounting & Finance",
    description: "Ledger, payments, VAT, and period controls.",
    pages: [
      page("accounting-overview", "Accounting overview", "How posting works.", { appHrefs: ["/accounts"] }),
      page("chart-of-accounts", "Chart of accounts", "GL account structure.", { appHrefs: ["/accounts"] }),
      page("journals", "Journals", "Manual and system journals.", { appHrefs: ["/journals"] }),
      page("vouchers", "Vouchers", "Cash and bank vouchers.", { appHrefs: ["/vouchers"] }),
      page("bank-accounts", "Bank accounts", "Bank GL links.", { appHrefs: ["/bank-accounts"] }),
      page("bank-reconciliation", "Bank reconciliation", "Statement matching.", {
        appHrefs: ["/bank-reconciliation"],
      }),
      page("cheques-and-pdc", "Cheques and PDC", "Post-dated cheque lifecycle.", { appHrefs: ["/cheques"] }),
      page("opening-balances", "Opening balances", "Go-live wizard.", { appHrefs: ["/opening-balances"] }),
      page("accounts-receivable", "Accounts receivable", "Customer balances.", {
        appHrefs: ["/reports/ar-aging", "/reports/customer-statement"],
      }),
      page("accounts-payable", "Accounts payable", "Supplier balances.", {
        appHrefs: ["/reports/ap-aging", "/reports/supplier-statement"],
      }),
      page("vat", "Taxes and VAT", "UAE VAT reporting.", {
        appHrefs: ["/reports/vat-201", "/taxes"],
        keywords: ["vat", "trn"],
      }),
      page("multi-currency-and-exchange-rates", "Multi-currency", "Foreign currency transactions.", {
        appHrefs: ["/currencies", "/exchange-rates"],
      }),
      page("fx-revaluation", "FX revaluation", "Period-end revaluation.", { appHrefs: ["/fx-revaluation"] }),
      page("write-offs", "Write-offs", "Uncollectible invoice balances.", { keywords: ["write off"] }),
      page("budgets", "Budgets", "Budget planning vs actuals.", { appHrefs: ["/budgets"] }),
      page("recurring-invoices", "Recurring invoices", "Scheduled invoice generation.", {
        appHrefs: ["/recurring"],
      }),
      page("period-lock", "Period lock", "Soft and hard lock dates.", { appHrefs: ["/period-lock"] }),
      page("month-end-checklist", "Month-end checklist", "Closing period steps.", {
        related: ["workflows/month-end-close", "accounting/period-lock"],
      }),
    ],
  },
  {
    slug: "crm",
    label: "CRM",
    description: "Leads, opportunities, and sales pipeline.",
    pages: [
      page("crm-overview", "CRM overview", "CRM module introduction.", { appHrefs: ["/leads"] }),
      page("leads", "Leads", "Lead management and conversion.", { appHrefs: ["/leads"] }),
      page("opportunities-and-pipelines", "Opportunities and pipelines", "Deal tracking.", {
        appHrefs: ["/opportunities", "/pipelines"],
      }),
      page("activities", "Activities", "Tasks, calls, and meetings.", { appHrefs: ["/activities"] }),
      page("campaigns", "Campaigns", "Marketing campaigns.", { appHrefs: ["/campaigns"] }),
      page("lead-sources-and-lost-reasons", "Lead sources and lost reasons", "CRM reference data.", {
        appHrefs: ["/lead-sources", "/lost-reasons"],
      }),
    ],
  },
  {
    slug: "reports",
    label: "Reports",
    description: "Financial, inventory, and operational reports.",
    pages: [
      page("using-reports", "Using reports", "Filters, export, and access.", { appHrefs: ["/reports"] }),
      page("financial-reports", "Financial reports", "Trial balance, GL, P&L, and more.", {
        appHrefs: ["/reports/trial-balance", "/reports/profit-and-loss"],
      }),
      page("receivables-and-payables-reports", "Receivables and payables reports", "Aging and statements.", {
        appHrefs: ["/reports/ar-aging", "/reports/ap-aging"],
      }),
      page("tax-reports", "Tax reports", "VAT and register reports.", {
        appHrefs: ["/reports/vat-201", "/reports/sales-register"],
      }),
      page("inventory-reports", "Inventory reports", "Valuation and movement.", {
        appHrefs: ["/reports/stock-valuation", "/reports/purchase-suggestions"],
      }),
      page("operations-reports", "Operations reports", "Three-way match and GRNI.", {
        appHrefs: ["/reports/three-way-match"],
      }),
      page("sales-and-purchase-analysis", "Sales and purchase analysis", "Trend analysis reports.", {
        appHrefs: ["/reports/sales-analysis", "/reports/purchase-analysis"],
      }),
      page("crm-reports", "CRM reports", "Pipeline and conversion.", {
        appHrefs: ["/reports/sales-pipeline", "/reports/lead-conversion"],
      }),
    ],
  },
  {
    slug: "collaboration",
    label: "Tasks & Collaboration",
    description: "Activities, reminders, and notes.",
    pages: [
      page("activities-and-follow-ups", "Activities and follow-ups", "CRM activities as tasks.", {
        appHrefs: ["/activities"],
      }),
      page("payment-reminders-and-emails", "Payment reminders and emails", "Dunning and email.", {
        appHrefs: ["/dunning-rules"],
      }),
      page("notes-attachments-and-history", "Notes, attachments, and history", "Record collaboration.", {
        keywords: ["attachments", "history"],
      }),
      page("whats-available", "What is not available yet", "Features not in the product.", {
        keywords: ["chat", "tasks", "notifications inbox"],
      }),
    ],
  },
  {
    slug: "planning-and-ai",
    label: "Planning & AI",
    description: "Recommendations and future AI features.",
    pages: [
      page("stock-recommendations", "Stock recommendations", "Reorder levels and purchase suggestions.", {
        appHrefs: ["/reports/purchase-suggestions", "/stock"],
        keywords: ["reorder", "suggestions"],
      }),
      page("ai-features", "AI features", "What is and is not available.", { keywords: ["ai", "forecast"] }),
    ],
  },
  {
    slug: "workflows",
    label: "Common Workflows",
    description: "Step-by-step guides for everyday tasks.",
    pages: [
      page("go-live-setup", "Go-live setup", "Initial company setup.", {
        related: ["organization-and-access/organization-settings", "accounting/opening-balances"],
      }),
      page("set-up-a-branch", "Set up a branch", "Add a new branch.", {
        related: ["organization-and-access/branches"],
      }),
      page("set-up-a-warehouse", "Set up a warehouse", "Add a warehouse.", {
        related: ["organization-and-access/warehouses-setup"],
      }),
      page("add-a-user-and-role", "Add a user and role", "User and permission setup.", {
        related: ["organization-and-access/users", "organization-and-access/roles-and-permissions"],
      }),
      page("create-a-product", "Create a product", "New product setup.", {
        related: ["master-data/products"],
      }),
      page("add-opening-stock", "Add opening stock", "Initial stock entry.", {
        related: ["inventory/opening-stock"],
      }),
      page("receive-stock", "Receive stock", "PO to goods receipt.", {
        related: ["purchases/goods-receipts", "workflows/procure-to-pay"],
      }),
      page("transfer-stock-between-warehouses", "Transfer stock", "Warehouse transfer.", {
        related: ["inventory/stock-transfers"],
      }),
      page("order-to-cash", "Order to cash", "Full sales cycle.", { related: ["sales/sales-lifecycle"] }),
      page("quote-to-cash", "Quote to cash", "Moved to order to cash.", { related: ["workflows/order-to-cash"] }),
      page("procure-to-pay", "Procure to pay", "Full purchase cycle.", {
        related: ["purchases/purchase-lifecycle"],
      }),
      page("import-shipment", "Import shipment", "Import trade workflow.", {
        related: ["import-export/trade-overview"],
      }),
      page("export-shipment", "Export shipment", "Export trade workflow.", {
        related: ["import-export/export-evidence"],
      }),
      page("record-customer-and-supplier-payments", "Record payments", "Customer and supplier payments.", {
        related: ["sales/customer-payments", "purchases/supplier-payments"],
      }),
      page("handle-a-customer-return", "Handle a customer return", "Sales return workflow.", {
        related: ["sales/sales-returns"],
      }),
      page("handle-a-supplier-return", "Handle a supplier return", "Purchase return workflow.", {
        related: ["purchases/purchase-returns"],
      }),
      page("check-inventory", "Check inventory", "Review stock levels.", { related: ["inventory/stock-concepts"] }),
      page("review-customer-and-supplier-balances", "Review balances", "AR/AP review.", {
        related: ["accounting/accounts-receivable", "accounting/accounts-payable"],
      }),
      page("import-data-from-a-spreadsheet", "Import from spreadsheet", "CSV/XLSX import.", {
        related: ["master-data/importing-and-exporting-data"],
      }),
      page("month-end-close", "Month-end close", "Period closing steps.", {
        related: ["accounting/month-end-checklist"],
      }),
    ],
  },
];

export type FlatDoc = DocPage & { category: DocCategoryMeta; path: string };

export function flatDocs(): FlatDoc[] {
  return docsCatalog.flatMap((category) =>
    category.pages.map((docPage) => ({
      ...docPage,
      category,
      path: `/docs/${category.slug}/${docPage.slug}`,
    })),
  );
}

export function findDoc(categorySlug: string, pageSlug: string): FlatDoc | undefined {
  return flatDocs().find((d) => d.category.slug === categorySlug && d.slug === pageSlug);
}

export function findDocByPath(pathname: string): FlatDoc | undefined {
  const match = pathname.match(/^\/docs\/([^/]+)(?:\/([^/]+))?/);
  if (!match) {
    return undefined;
  }
  const [, categorySlug, pageSlug] = match;
  if (!pageSlug) {
    return undefined;
  }
  return findDoc(categorySlug, pageSlug);
}

export function findDocCategory(categorySlug: string): DocCategory | undefined {
  return docsCatalog.find((c) => c.slug === categorySlug);
}

export function prevNext(categorySlug: string, pageSlug: string): {
  prev?: FlatDoc;
  next?: FlatDoc;
} {
  const all = flatDocs();
  const index = all.findIndex((d) => d.category.slug === categorySlug && d.slug === pageSlug);
  if (index < 0) {
    return {};
  }
  return {
    prev: index > 0 ? all[index - 1] : undefined,
    next: index < all.length - 1 ? all[index + 1] : undefined,
  };
}

export type DocSearchResult = FlatDoc & { score: number };

export function searchDocs(query: string, limit = 20): DocSearchResult[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return [];
  }
  const results: DocSearchResult[] = [];
  for (const doc of flatDocs()) {
    let score = 0;
    if (doc.title.toLowerCase().includes(needle)) {
      score += doc.title.toLowerCase().startsWith(needle) ? 100 : 80;
    }
    if (doc.description.toLowerCase().includes(needle)) {
      score += 40;
    }
    if (doc.category.label.toLowerCase().includes(needle)) {
      score += 30;
    }
    for (const kw of doc.keywords ?? []) {
      if (kw.toLowerCase().includes(needle)) {
        score += 50;
      }
    }
    if (score > 0) {
      results.push({ ...doc, score });
    }
  }
  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function docsForAppRoute(pathname: string): FlatDoc[] {
  const normalized = pathname.split("?")[0];
  return flatDocs().filter((doc) =>
    doc.appHrefs?.some((href) => normalized === href || normalized.startsWith(`${href}/`)),
  );
}

export function docsSearchGroups(): NavigationGroup[] {
  return docsCatalog.map((category) => ({
    label: `Docs: ${category.label}`,
    items: category.pages.map(
      (docPage): NavigationItem => ({
        label: docPage.title,
        href: `/docs/${category.slug}/${docPage.slug}`,
        permission: null,
        icon: BookOpen,
        keywords: docPage.keywords,
      }),
    ),
  }));
}

export const DOCS_HOME = {
  label: "Documentation",
  href: "/docs",
  icon: BookOpen,
} as const;
