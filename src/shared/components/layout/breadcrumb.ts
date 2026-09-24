import type { NavigationItem } from "@/config/navigation";
import { navigation } from "@/config/navigation";
import { findDoc, findDocCategory } from "@/config/docs-catalog";
import { findReportByHref } from "@/config/report-catalog";
import { historyPageTitle, parseHistoryPath } from "@/shared/lib/history";

export type BreadcrumbCrumb = {
  label: string;
  href?: string;
};

function buildDocsBreadcrumbs(pathname: string): BreadcrumbCrumb[] {
  const crumbs: BreadcrumbCrumb[] = [{ label: "Documentation", href: "/docs" }];
  if (pathname === "/docs") {
    crumbs.push({ label: "Home" });
    return crumbs;
  }

  const segments = pathname.split("/").filter(Boolean);
  const categorySlug = segments[1];
  const pageSlug = segments[2];
  const category = categorySlug ? findDocCategory(categorySlug) : undefined;

  if (!category) {
    crumbs.push({ label: "Not found" });
    return crumbs;
  }

  if (!pageSlug) {
    crumbs.push({ label: category.label });
    return crumbs;
  }

  const doc = findDoc(categorySlug, pageSlug);
  crumbs.push({ label: category.label, href: `/docs/${categorySlug}` });
  crumbs.push({ label: doc?.title ?? "Article" });
  return crumbs;
}

export function buildBreadcrumbs({
  pathname,
  active,
  recordLabel,
}: {
  pathname: string;
  active?: { group: string; item: NavigationItem };
  recordLabel?: string | null;
}): BreadcrumbCrumb[] {
  if (pathname === "/docs" || pathname.startsWith("/docs/")) {
    return buildDocsBreadcrumbs(pathname);
  }

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
      { label: historyPageTitle(history.spec.slug) },
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
