import {
  ClipboardList,
  LayoutDashboard,
  Lock,
  Settings,
  Shield,
  UserCog,
  type LucideIcon,
} from "lucide-react";

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
