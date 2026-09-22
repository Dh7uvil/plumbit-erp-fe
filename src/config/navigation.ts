import {
  ArrowLeftRight,
  Banknote,
  BookOpen,
  Boxes,
  ClipboardList,
  ClipboardPen,
  Contact,
  FileText,
  FolderTree,
  GitBranch,
  History,
  Inbox,
  Landmark,
  LayoutDashboard,
  ListOrdered,
  Lock,
  NotebookPen,
  Package,
  Percent,
  Ruler,
  Settings,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Tags,
  Layers,
  Truck,
  UserCog,
  Users,
  Wallet,
  Warehouse,
  Bell,
  ClipboardCheck,
  CircleDollarSign,
  FileSpreadsheet,
  KeyRound,
  PackageCheck,
  RotateCcw,
  Ship,
  User,
  UserPlus,
  Target,
  CalendarClock,
  Megaphone,
  type LucideIcon,
} from "lucide-react";

import { hasAnyReportAccess, visibleReportCatalog } from "@/config/report-catalog";
import { activityPermissions } from "@/modules/crm/activities/permissions";
import { campaignPermissions } from "@/modules/crm/campaigns/permissions";
import { contactPermissions } from "@/modules/crm/contacts/permissions";
import { customerPermissions } from "@/modules/crm/customers/permissions";
import { leadPermissions } from "@/modules/crm/leads/permissions";
import { opportunityPermissions } from "@/modules/crm/opportunities/permissions";
import { leadSourcePermissions } from "@/modules/crm/lead-sources/permissions";
import { lostReasonPermissions } from "@/modules/crm/lost-reasons/permissions";
import { pipelinePermissions } from "@/modules/crm/pipelines/permissions";
import { accountPermissions } from "@/modules/erp/accounting/accounts/permissions";
import { documentSequencePermissions } from "@/modules/erp/accounting/document-sequences/permissions";
import { journalPermissions } from "@/modules/erp/accounting/journals/permissions";
import { openingBalancePermissions } from "@/modules/erp/accounting/opening-balances/permissions";
import { chargeTypePermissions } from "@/modules/erp/accounting/charge-types/permissions";
import { costCenterPermissions } from "@/modules/erp/accounting/cost-centers/permissions";
import { reportPermissions } from "@/modules/erp/accounting/reports/permissions";
import { dunningPermissions } from "@/modules/erp/accounting/dunning-rules/permissions";
import { paymentTermPermissions } from "@/modules/erp/accounting/payment-terms/permissions";
import { periodLockPermissions } from "@/modules/erp/period-lock/permissions";
import { costSheetPermissions } from "@/modules/erp/cost-sheets/permissions";
import { landedCostPermissions } from "@/modules/erp/landed-costs/permissions";
import { taxPermissions } from "@/modules/erp/accounting/taxes/permissions";
import { termsTemplatePermissions } from "@/modules/erp/accounting/terms-templates/permissions";
import { currencyPermissions } from "@/modules/erp/currencies/permissions";
import { exchangeRatePermissions } from "@/modules/erp/exchange-rates/permissions";
import { quotationPermissions } from "@/modules/erp/quotations/permissions";
import { proformaInvoicePermissions } from "@/modules/erp/proforma-invoices/permissions";
import { salesOrderPermissions } from "@/modules/erp/sales-orders/permissions";
import { purchaseOrderPermissions } from "@/modules/erp/purchase-orders/permissions";
import { salesInvoicePermissions } from "@/modules/erp/sales-invoices/permissions";
import { purchaseInvoicePermissions } from "@/modules/erp/purchase-invoices/permissions";
import { customerPaymentPermissions } from "@/modules/erp/customer-payments/permissions";
import { creditNotePermissions } from "@/modules/erp/credit-notes/permissions";
import { supplierPaymentPermissions } from "@/modules/erp/supplier-payments/permissions";
import { debitNotePermissions } from "@/modules/erp/debit-notes/permissions";
import { supplierPermissions } from "@/modules/erp/suppliers/permissions";
import { supplierProductPermissions } from "@/modules/erp/supplier-products/permissions";
import { categoryPermissions } from "@/modules/inventory-management/categories/permissions";
import { priceListPermissions } from "@/modules/inventory-management/price-lists/permissions";
import { productPermissions } from "@/modules/inventory-management/products/permissions";
import { stockPermissions } from "@/modules/inventory-management/stock/permissions";
import { deliveryNotePermissions } from "@/modules/inventory-management/delivery-notes/permissions";
import { goodsReceiptPermissions } from "@/modules/inventory-management/goods-receipts/permissions";
import { packagePermissions } from "@/modules/inventory-management/packages/permissions";
import { qualityInspectionPermissions } from "@/modules/inventory-management/quality-inspections/permissions";
import { purchaseReturnPermissions } from "@/modules/inventory-management/purchase-returns/permissions";
import { salesReturnPermissions } from "@/modules/inventory-management/sales-returns/permissions";
import { shipmentPermissions } from "@/modules/inventory-management/shipments/permissions";
import { stockAdjustmentPermissions } from "@/modules/inventory-management/stock-adjustments/permissions";
import { stockTransferPermissions } from "@/modules/inventory-management/stock-transfers/permissions";
import { unitPermissions } from "@/modules/inventory-management/units/permissions";
import { warehousePermissions } from "@/modules/inventory-management/warehouses/permissions";
import { organizationSettingsPermissions } from "@/modules/users-management/organization-settings/permissions";
import { auditLogPermissions } from "@/modules/users-management/audit-logs/permissions";
import { outboxPermissions } from "@/modules/users-management/outbox/permissions";
import { permissionCatalogPermissions } from "@/modules/users-management/permissions/permissions";
import { rolePermissions } from "@/modules/users-management/roles/permissions";
import { userPermissions } from "@/modules/users-management/users/permissions";
import { can } from "@/shared/auth/permissions";
import { parseHistoryPath } from "@/shared/lib/history";

export type NavigationItem = {
  label: string;
  href: string;
  permission: string | null;
  icon: LucideIcon;
};

export type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

export const navigation: NavigationGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/", permission: null, icon: LayoutDashboard },
      { label: "Reports", href: "/reports", permission: null, icon: FileSpreadsheet },
    ],
  },
  {
    label: "CRM",
    items: [
      {
        label: "Customers",
        href: "/customers",
        permission: customerPermissions.read,
        icon: Users,
      },
      {
        label: "Contacts",
        href: "/contacts",
        permission: contactPermissions.read,
        icon: Contact,
      },
      {
        label: "Leads",
        href: "/leads",
        permission: leadPermissions.read,
        icon: UserPlus,
      },
      {
        label: "Opportunities",
        href: "/opportunities",
        permission: opportunityPermissions.read,
        icon: Target,
      },
      {
        label: "Activities",
        href: "/activities",
        permission: activityPermissions.read,
        icon: CalendarClock,
      },
      {
        label: "Campaigns",
        href: "/campaigns",
        permission: campaignPermissions.read,
        icon: Megaphone,
      },
      {
        label: "Pipelines",
        href: "/pipelines",
        permission: pipelinePermissions.read,
        icon: GitBranch,
      },
      {
        label: "Lead sources",
        href: "/lead-sources",
        permission: leadSourcePermissions.read,
        icon: Tags,
      },
      {
        label: "Lost reasons",
        href: "/lost-reasons",
        permission: lostReasonPermissions.read,
        icon: ClipboardList,
      },
    ],
  },
  {
    label: "Sales",
    items: [
      {
        label: "Quotations",
        href: "/quotations",
        permission: quotationPermissions.read,
        icon: ShoppingCart,
      },
      {
        label: "Proforma invoices",
        href: "/proforma-invoices",
        permission: proformaInvoicePermissions.read,
        icon: FileText,
      },
      {
        label: "Sales orders",
        href: "/sales-orders",
        permission: salesOrderPermissions.read,
        icon: ClipboardPen,
      },
      {
        label: "Delivery notes",
        href: "/delivery-notes",
        permission: deliveryNotePermissions.read,
        icon: Truck,
      },
      {
        label: "Sales invoices",
        href: "/sales-invoices",
        permission: salesInvoicePermissions.read,
        icon: FileText,
      },
      {
        label: "Credit notes",
        href: "/credit-notes",
        permission: creditNotePermissions.read,
        icon: RotateCcw,
      },
      {
        label: "Customer payments",
        href: "/customer-payments",
        permission: customerPaymentPermissions.read,
        icon: Banknote,
      },
      {
        label: "Sales returns",
        href: "/sales-returns",
        permission: salesReturnPermissions.read,
        icon: RotateCcw,
      },
    ],
  },
  {
    label: "Purchases",
    items: [
      {
        label: "Suppliers",
        href: "/suppliers",
        permission: supplierPermissions.read,
        icon: Truck,
      },
      {
        label: "Supplier catalog",
        href: "/supplier-products",
        permission: supplierProductPermissions.read,
        icon: Boxes,
      },
      {
        label: "Purchases",
        href: "/purchases",
        permission: purchaseOrderPermissions.read,
        icon: ShoppingBag,
      },
      {
        label: "Goods receipts",
        href: "/goods-receipts",
        permission: goodsReceiptPermissions.read,
        icon: PackageCheck,
      },
      {
        label: "Quality inspections",
        href: "/quality-inspections",
        permission: qualityInspectionPermissions.read,
        icon: ClipboardCheck,
      },
      {
        label: "Debit notes",
        href: "/debit-notes",
        permission: debitNotePermissions.read,
        icon: NotebookPen,
      },
      {
        label: "Supplier payments",
        href: "/supplier-payments",
        permission: supplierPaymentPermissions.read,
        icon: CircleDollarSign,
      },
      {
        label: "Landed costs",
        href: "/landed-costs",
        permission: landedCostPermissions.read,
        icon: PackageCheck,
      },
      {
        label: "Purchase returns",
        href: "/purchase-returns",
        permission: purchaseReturnPermissions.read,
        icon: RotateCcw,
      },
    ],
  },
  {
    label: "Shipments",
    items: [
      {
        label: "Packages",
        href: "/packages",
        permission: packagePermissions.read,
        icon: Package,
      },
      {
        label: "Shipments",
        href: "/shipments",
        permission: shipmentPermissions.read,
        icon: Ship,
      },
    ],
  },
  {
    label: "Inventory",
    items: [
      { label: "Units", href: "/units", permission: unitPermissions.read, icon: Ruler },
      {
        label: "Categories",
        href: "/categories",
        permission: categoryPermissions.read,
        icon: FolderTree,
      },
      {
        label: "Products",
        href: "/products",
        permission: productPermissions.read,
        icon: Package,
      },
      {
        label: "Price lists",
        href: "/price-lists",
        permission: priceListPermissions.read,
        icon: Tags,
      },
      {
        label: "Warehouses",
        href: "/warehouses",
        permission: warehousePermissions.read,
        icon: Warehouse,
      },
      { label: "Stock", href: "/stock", permission: stockPermissions.read, icon: Boxes },
      {
        label: "Stock movements",
        href: "/stock-movements",
        permission: stockPermissions.read,
        icon: History,
      },
      {
        label: "Stock transfers",
        href: "/stock-transfers",
        permission: stockTransferPermissions.read,
        icon: ArrowLeftRight,
      },
      {
        label: "Stock adjustments",
        href: "/stock-adjustments",
        permission: stockAdjustmentPermissions.read,
        icon: ClipboardPen,
      },
    ],
  },
  {
    label: "Accounting",
    items: [
      {
        label: "Chart of accounts",
        href: "/accounts",
        permission: accountPermissions.read,
        icon: Landmark,
      },
      {
        label: "Journals",
        href: "/journals",
        permission: journalPermissions.read,
        icon: NotebookPen,
      },
      {
        label: "Cash book",
        href: "/reports/cash-book",
        permission: reportPermissions.ledger,
        icon: Banknote,
      },
      {
        label: "Bank book",
        href: "/reports/bank-book",
        permission: reportPermissions.ledger,
        icon: Landmark,
      },
      {
        label: "Opening balances",
        href: "/opening-balances",
        permission: openingBalancePermissions.manage,
        icon: CircleDollarSign,
      },
      {
        label: "Period lock",
        href: "/period-lock",
        permission: periodLockPermissions.read,
        icon: Lock,
      },
      {
        label: "Payment reminders",
        href: "/dunning-rules",
        permission: dunningPermissions.read,
        icon: Bell,
      },
      {
        label: "Cost sheets",
        href: "/cost-sheets",
        permission: costSheetPermissions.read,
        icon: FileSpreadsheet,
      },
    ],
  },
  {
    label: "Masters",
    items: [
      {
        label: "Currencies",
        href: "/currencies",
        permission: currencyPermissions.read,
        icon: Wallet,
      },
      {
        label: "Exchange rates",
        href: "/exchange-rates",
        permission: exchangeRatePermissions.read,
        icon: Percent,
      },
      { label: "Taxes", href: "/taxes", permission: taxPermissions.read, icon: Percent },
      {
        label: "Payment terms",
        href: "/payment-terms",
        permission: paymentTermPermissions.read,
        icon: ListOrdered,
      },
      {
        label: "Cost centers",
        href: "/cost-centers",
        permission: costCenterPermissions.read,
        icon: Layers,
      },
      {
        label: "Charge types",
        href: "/charge-types",
        permission: chargeTypePermissions.read,
        icon: Layers,
      },
      {
        label: "Terms templates",
        href: "/terms-templates",
        permission: termsTemplatePermissions.read,
        icon: FileText,
      },
      {
        label: "Document sequences",
        href: "/document-sequences",
        permission: documentSequencePermissions.read,
        icon: BookOpen,
      },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "My Profile", href: "/settings/profile", permission: null, icon: User },
      { label: "Change Password", href: "/settings/password", permission: null, icon: KeyRound },
      {
        label: "Notification Settings",
        href: "/settings/notifications",
        permission: null,
        icon: Bell,
      },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Users", href: "/users", permission: userPermissions.read, icon: UserCog },
      { label: "Roles", href: "/roles", permission: rolePermissions.read, icon: Shield },
      {
        label: "Permissions",
        href: "/permissions",
        permission: permissionCatalogPermissions.read,
        icon: Lock,
      },
      {
        label: "Organization Settings",
        href: "/organization-settings",
        permission: organizationSettingsPermissions.read,
        icon: Settings,
      },
      {
        label: "Audit Logs",
        href: "/audit-logs",
        permission: auditLogPermissions.read,
        icon: ClipboardList,
      },
      {
        label: "Outbox",
        href: "/outbox-events",
        permission: outboxPermissions.read,
        icon: Inbox,
      },
    ],
  },
];

export function visibleNavigation(permissions: readonly string[]): NavigationGroup[] {
  const canSeeReports = hasAnyReportAccess(permissions);
  return navigation
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.href === "/reports") {
          return canSeeReports;
        }
        if (item.href === "/purchases") {
          return (
            can(purchaseOrderPermissions.read, permissions) ||
            can(purchaseInvoicePermissions.read, permissions)
          );
        }
        return item.permission === null || can(item.permission, permissions);
      }),
    }))
    .filter((group) => group.items.length > 0);
}

export function searchableNavigation(permissions: readonly string[]): NavigationGroup[] {
  return [...visibleNavigation(permissions), ...visibleReportCatalog(permissions)];
}

function purchasesWorkspaceLookupPath(pathname: string): string {
  if (
    pathname === "/purchase-orders" ||
    pathname.startsWith("/purchase-orders/") ||
    pathname === "/purchase-invoices" ||
    pathname.startsWith("/purchase-invoices/")
  ) {
    return "/purchases";
  }
  return pathname;
}

export function findActiveNav(
  pathname: string,
): { group: string; item: NavigationItem } | undefined {
  const history = parseHistoryPath(pathname);
  const lookupPath = purchasesWorkspaceLookupPath(history?.spec.listHref ?? pathname);
  const matches = navigation.flatMap((group) =>
    group.items
      .filter((item) =>
        item.href === "/"
          ? lookupPath === "/"
          : lookupPath === item.href || lookupPath.startsWith(`${item.href}/`),
      )
      .map((item) => ({ group: group.label, item })),
  );
  matches.sort((a, b) => b.item.href.length - a.item.href.length);
  return matches[0];
}
