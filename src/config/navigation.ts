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
  History,
  Landmark,
  LayoutDashboard,
  ListOrdered,
  Lock,
  NotebookPen,
  Package,
  Percent,
  Ruler,
  Scale,
  ScrollText,
  Settings,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Tags,
  Truck,
  UserCog,
  Users,
  Wallet,
  Warehouse,
  ClipboardCheck,
  CircleDollarSign,
  FileSpreadsheet,
  PackageCheck,
  RotateCcw,
  Ship,
  type LucideIcon,
} from "lucide-react";

import { contactPermissions } from "@/modules/crm/contacts/permissions";
import { customerPermissions } from "@/modules/crm/customers/permissions";
import { accountPermissions } from "@/modules/erp/accounting/accounts/permissions";
import { documentSequencePermissions } from "@/modules/erp/accounting/document-sequences/permissions";
import { journalPermissions } from "@/modules/erp/accounting/journals/permissions";
import { openingBalancePermissions } from "@/modules/erp/accounting/opening-balances/permissions";
import { paymentTermPermissions } from "@/modules/erp/accounting/payment-terms/permissions";
import { reportPermissions } from "@/modules/erp/accounting/reports/permissions";
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
import { salesReturnPermissions } from "@/modules/inventory-management/sales-returns/permissions";
import { shipmentPermissions } from "@/modules/inventory-management/shipments/permissions";
import { stockAdjustmentPermissions } from "@/modules/inventory-management/stock-adjustments/permissions";
import { stockTransferPermissions } from "@/modules/inventory-management/stock-transfers/permissions";
import { unitPermissions } from "@/modules/inventory-management/units/permissions";
import { warehousePermissions } from "@/modules/inventory-management/warehouses/permissions";
import { organizationSettingsPermissions } from "@/modules/users-management/organization-settings/permissions";
import { auditLogPermissions } from "@/modules/users-management/audit-logs/permissions";
import { permissionCatalogPermissions } from "@/modules/users-management/permissions/permissions";
import { rolePermissions } from "@/modules/users-management/roles/permissions";
import { userPermissions } from "@/modules/users-management/users/permissions";
import { can } from "@/shared/auth/permissions";

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
    items: [{ label: "Dashboard", href: "/", permission: null, icon: LayoutDashboard }],
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
    ],
  },
  {
    label: "ERP",
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
        label: "Sales invoices",
        href: "/sales-invoices",
        permission: salesInvoicePermissions.read,
        icon: FileText,
      },
      {
        label: "Customer payments",
        href: "/customer-payments",
        permission: customerPaymentPermissions.read,
        icon: Banknote,
      },
      {
        label: "Credit notes",
        href: "/credit-notes",
        permission: creditNotePermissions.read,
        icon: RotateCcw,
      },
      {
        label: "Purchase orders",
        href: "/purchase-orders",
        permission: purchaseOrderPermissions.read,
        icon: ShoppingBag,
      },
      {
        label: "Purchase invoices",
        href: "/purchase-invoices",
        permission: purchaseInvoicePermissions.read,
        icon: FileSpreadsheet,
      },
      {
        label: "Supplier payments",
        href: "/supplier-payments",
        permission: supplierPaymentPermissions.read,
        icon: CircleDollarSign,
      },
      {
        label: "Debit notes",
        href: "/debit-notes",
        permission: debitNotePermissions.read,
        icon: NotebookPen,
      },
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
        label: "Delivery notes",
        href: "/delivery-notes",
        permission: deliveryNotePermissions.read,
        icon: Truck,
      },
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
      {
        label: "Sales returns",
        href: "/sales-returns",
        permission: salesReturnPermissions.read,
        icon: RotateCcw,
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
        label: "Opening balances",
        href: "/opening-balances",
        permission: openingBalancePermissions.manage,
        icon: CircleDollarSign,
      },
      {
        label: "Landed costs",
        href: "/landed-costs",
        permission: landedCostPermissions.read,
        icon: PackageCheck,
      },
      {
        label: "Trial balance",
        href: "/reports/trial-balance",
        permission: reportPermissions.ledger,
        icon: Scale,
      },
      {
        label: "General ledger",
        href: "/reports/general-ledger",
        permission: reportPermissions.ledger,
        icon: ScrollText,
      },
      {
        label: "Account statement",
        href: "/reports/account-statement",
        permission: reportPermissions.ledger,
        icon: FileSpreadsheet,
      },
      {
        label: "Export evidence exceptions",
        href: "/reports/export-evidence-exceptions",
        permission: reportPermissions.tax,
        icon: FileText,
      },
      {
        label: "Invoiced not dispatched",
        href: "/reports/invoiced-not-dispatched",
        permission: reportPermissions.tax,
        icon: ScrollText,
      },
      {
        label: "AR aging",
        href: "/reports/ar-aging",
        permission: reportPermissions.arAp,
        icon: Scale,
      },
      {
        label: "AP aging",
        href: "/reports/ap-aging",
        permission: reportPermissions.arAp,
        icon: Scale,
      },
      {
        label: "Customer statement",
        href: "/reports/customer-statement",
        permission: reportPermissions.arAp,
        icon: FileSpreadsheet,
      },
      {
        label: "Supplier statement",
        href: "/reports/supplier-statement",
        permission: reportPermissions.arAp,
        icon: FileSpreadsheet,
      },
      {
        label: "Stock valuation",
        href: "/reports/stock-valuation",
        permission: reportPermissions.inventory,
        icon: Boxes,
      },
      {
        label: "Stock valuation vs GL",
        href: "/reports/stock-valuation-gl",
        permission: reportPermissions.inventory,
        icon: Scale,
      },
      {
        label: "Stock movement",
        href: "/reports/stock-movement",
        permission: reportPermissions.inventory,
        icon: ArrowLeftRight,
      },
      {
        label: "Stock aging",
        href: "/reports/stock-aging",
        permission: reportPermissions.inventory,
        icon: History,
      },
      {
        label: "Purchase suggestions",
        href: "/reports/purchase-suggestions",
        permission: reportPermissions.inventory,
        icon: ShoppingCart,
      },
      {
        label: "Profit and loss",
        href: "/reports/profit-and-loss",
        permission: reportPermissions.financial,
        icon: FileSpreadsheet,
      },
      {
        label: "Balance sheet",
        href: "/reports/balance-sheet",
        permission: reportPermissions.financial,
        icon: Scale,
      },
      {
        label: "Cash flow",
        href: "/reports/cash-flow",
        permission: reportPermissions.financial,
        icon: Banknote,
      },
      {
        label: "Sales register",
        href: "/reports/sales-register",
        permission: reportPermissions.tax,
        icon: FileText,
      },
      {
        label: "Purchase register",
        href: "/reports/purchase-register",
        permission: reportPermissions.tax,
        icon: FileText,
      },
      {
        label: "VAT 201",
        href: "/reports/vat-201",
        permission: reportPermissions.tax,
        icon: Percent,
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
      {
        label: "Contacts",
        href: "/contacts",
        permission: contactPermissions.read,
        icon: Contact,
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
    ],
  },
];

export function visibleNavigation(permissions: readonly string[]): NavigationGroup[] {
  return navigation
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => item.permission === null || can(item.permission, permissions),
      ),
    }))
    .filter((group) => group.items.length > 0);
}

export function findActiveNav(
  pathname: string,
): { group: string; item: NavigationItem } | undefined {
  const matches = navigation.flatMap((group) =>
    group.items
      .filter((item) =>
        item.href === "/"
          ? pathname === "/"
          : pathname === item.href || pathname.startsWith(`${item.href}/`),
      )
      .map((item) => ({ group: group.label, item })),
  );
  matches.sort((a, b) => b.item.href.length - a.item.href.length);
  return matches[0];
}
