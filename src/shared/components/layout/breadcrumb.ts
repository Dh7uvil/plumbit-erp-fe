import type { NavigationItem } from "@/config/navigation";
import { navigation } from "@/config/navigation";
import { findReportByHref } from "@/config/report-catalog";
import { HISTORY_PAGE_TITLE, parseHistoryPath } from "@/shared/lib/history";

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
  const history = parseHistoryPath(pathname);
  const activeNav =
    active ??
    (history
      ? navigation.flatMap((group) =>
          group.items
            .filter((item) => item.href === history.spec.listHref)
            .map((item) => ({ group: group.label, item })),
        )[0]
      : undefined);

  if (!activeNav) {
    return [{ label: "Dashboard" }];
  }

  const { group, item } = activeNav;

  if (history) {
    const crumbs: BreadcrumbCrumb[] = [
      { label: group },
      { label: item.label, href: item.href },
      {
        label: recordLabel || "Details",
        href: `${history.spec.listHref}/${history.id}`,
      },
      { label: HISTORY_PAGE_TITLE },
    ];
    return crumbs;
  }

  const crumbs: BreadcrumbCrumb[] = [{ label: group }];

  if (pathname === item.href) {
    crumbs.push({ label: item.label });
    return crumbs;
  }

  crumbs.push({ label: item.label, href: item.href });

  if (item.href === "/reports") {
    const report = findReportByHref(pathname);
    if (report) {
      crumbs.push({ label: report.item.label });
      return crumbs;
    }
  }

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
