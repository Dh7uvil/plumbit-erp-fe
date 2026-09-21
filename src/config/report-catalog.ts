import {
  ArrowLeftRight,
  Banknote,
  Boxes,
  ClipboardCheck,
  FileSpreadsheet,
  FileText,
  Filter,
  History,
  Landmark,
  PackageCheck,
  Percent,
  PhoneCall,
  Scale,
  ScrollText,
  ShoppingCart,
  Target,
  Trophy,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

import type { NavigationGroup, NavigationItem } from "@/config/navigation";
import { crmReportPermissions } from "@/modules/crm/reports/permissions";
import { reportPermissions } from "@/modules/erp/accounting/reports/permissions";
import { can } from "@/shared/auth/permissions";

export type ReportCatalogGroup = NavigationGroup & {
  icon: LucideIcon;
};

export const reportCatalog: ReportCatalogGroup[] = [
  {
    label: "Financial reports",
    icon: Scale,
    items: [
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
        label: "Account statement",
        href: "/reports/account-statement",
        permission: reportPermissions.ledger,
        icon: FileSpreadsheet,
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
        label: "Sales analysis",
        href: "/reports/sales-analysis",
        permission: reportPermissions.financial,
        icon: FileSpreadsheet,
      },
      {
        label: "Purchase analysis",
        href: "/reports/purchase-analysis",
        permission: reportPermissions.financial,
        icon: FileSpreadsheet,
      },
    ],
  },
  {
    label: "Receivables & payables",
    icon: Banknote,
    items: [
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
        label: "Outstanding invoices",
        href: "/reports/outstanding-invoices",
        permission: reportPermissions.arAp,
        icon: FileText,
      },
      {
        label: "Outstanding bills",
        href: "/reports/outstanding-bills",
        permission: reportPermissions.arAp,
        icon: FileText,
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
    ],
  },
  {
    label: "Tax reports",
    icon: Percent,
    items: [
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
      {
        label: "VAT GL recon",
        href: "/reports/vat-gl-recon",
        permission: reportPermissions.tax,
        icon: Scale,
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
    ],
  },
  {
    label: "Inventory reports",
    icon: Boxes,
    items: [
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
    ],
  },
  {
    label: "Operations reports",
    icon: ClipboardCheck,
    items: [
      {
        label: "Three-way match",
        href: "/reports/three-way-match",
        permission: reportPermissions.inventory,
        icon: ClipboardCheck,
      },
      {
        label: "Received not billed",
        href: "/reports/received-not-billed",
        permission: reportPermissions.inventory,
        icon: PackageCheck,
      },
    ],
  },
  {
    label: "CRM reports",
    icon: Target,
    items: [
      {
        label: "Sales pipeline",
        href: "/reports/sales-pipeline",
        permission: crmReportPermissions.read,
        icon: Target,
      },
      {
        label: "Sales funnel",
        href: "/reports/sales-funnel",
        permission: crmReportPermissions.read,
        icon: Filter,
      },
      {
        label: "Win / loss",
        href: "/reports/win-loss",
        permission: crmReportPermissions.read,
        icon: Trophy,
      },
      {
        label: "Lead conversion",
        href: "/reports/lead-conversion",
        permission: crmReportPermissions.read,
        icon: UserPlus,
      },
      {
        label: "Sales activity",
        href: "/reports/sales-activity",
        permission: crmReportPermissions.read,
        icon: PhoneCall,
      },
    ],
  },
];

export function visibleReportCatalog(permissions: readonly string[]): ReportCatalogGroup[] {
  return reportCatalog
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => item.permission === null || can(item.permission, permissions),
      ),
    }))
    .filter((group) => group.items.length > 0);
}

export function hasAnyReportAccess(permissions: readonly string[]): boolean {
  return visibleReportCatalog(permissions).length > 0;
}

export function findReportByHref(
  pathname: string,
): { group: string; item: NavigationItem } | undefined {
  for (const group of reportCatalog) {
    const item = group.items.find((entry) => entry.href === pathname);
    if (item) {
      return { group: group.label, item };
    }
  }
  return undefined;
}
