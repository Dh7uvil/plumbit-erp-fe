import {
  BookOpen,
  ClipboardList,
  Contact,
  FileText,
  FolderTree,
  LayoutDashboard,
  ListOrdered,
  Lock,
  Package,
  Percent,
  Ruler,
  Settings,
  Shield,
  ShoppingCart,
  Tags,
  Truck,
  UserCog,
  Users,
  Wallet,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

import { contactPermissions } from "@/modules/crm/contacts/permissions";
import { customerPermissions } from "@/modules/crm/customers/permissions";
import { documentSequencePermissions } from "@/modules/erp/accounting/document-sequences/permissions";
import { paymentTermPermissions } from "@/modules/erp/accounting/payment-terms/permissions";
import { taxPermissions } from "@/modules/erp/accounting/taxes/permissions";
import { termsTemplatePermissions } from "@/modules/erp/accounting/terms-templates/permissions";
import { currencyPermissions } from "@/modules/erp/currencies/permissions";
import { exchangeRatePermissions } from "@/modules/erp/exchange-rates/permissions";
import { quotationPermissions } from "@/modules/erp/quotations/permissions";
import { supplierPermissions } from "@/modules/erp/suppliers/permissions";
import { categoryPermissions } from "@/modules/inventory-management/categories/permissions";
import { priceListPermissions } from "@/modules/inventory-management/price-lists/permissions";
import { productPermissions } from "@/modules/inventory-management/products/permissions";
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
      {
        label: "Contacts",
        href: "/contacts",
        permission: contactPermissions.read,
        icon: Contact,
      },
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
        label: "Suppliers",
        href: "/suppliers",
        permission: supplierPermissions.read,
        icon: Truck,
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
