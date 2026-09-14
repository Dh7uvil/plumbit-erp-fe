import type { NavigationItem } from "@/config/navigation";

export type BreadcrumbCrumb = {
  label: string;
  href?: string;
};

export function buildBreadcrumbs({
  pathname,
  active,
  recordLabel,
}: {
  pathname: string;
  active?: { group: string; item: NavigationItem };
  recordLabel?: string | null;
}): BreadcrumbCrumb[] {
  if (!active) {
    return [{ label: "Dashboard" }];
  }

  const { group, item } = active;
  const crumbs: BreadcrumbCrumb[] = [{ label: group }];

  if (pathname === item.href) {
    crumbs.push({ label: item.label });
    return crumbs;
  }

  crumbs.push({ label: item.label, href: item.href });

  const remainder = item.href === "/" ? pathname : pathname.slice(item.href.length);
  const isNew = remainder === "/new" || remainder.startsWith("/new/");
  const isEdit = remainder.endsWith("/edit");

  if (isNew) {
    crumbs.push({ label: "New" });
    return crumbs;
  }

  if (recordLabel) {
    const viewHref = isEdit ? pathname.replace(/\/edit\/?$/, "") : undefined;
    crumbs.push({ label: recordLabel, href: viewHref });
    if (isEdit) {
      crumbs.push({ label: "Edit" });
    }
    return crumbs;
  }

  crumbs.push({ label: isEdit ? "Edit" : "Details" });
  return crumbs;
}
