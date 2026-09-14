import { describe, expect, it } from "vitest";
import { LayoutDashboard, Receipt } from "lucide-react";

import { buildBreadcrumbs } from "@/shared/components/layout/breadcrumb";

const invoices = {
  group: "Sales",
  item: {
    label: "Sales invoices",
    href: "/sales-invoices",
    permission: null,
    icon: Receipt,
  },
};

const dashboard = {
  group: "Overview",
  item: {
    label: "Dashboard",
    href: "/",
    permission: null,
    icon: LayoutDashboard,
  },
};

describe("buildBreadcrumbs", () => {
  it("uses two levels on a list page", () => {
    expect(buildBreadcrumbs({ pathname: "/sales-invoices", active: invoices })).toEqual([
      { label: "Sales" },
      { label: "Sales invoices" },
    ]);
  });

  it("adds New for create routes", () => {
    expect(buildBreadcrumbs({ pathname: "/sales-invoices/new", active: invoices })).toEqual([
      { label: "Sales" },
      { label: "Sales invoices", href: "/sales-invoices" },
      { label: "New" },
    ]);
  });

  it("uses a record label and Edit on edit routes", () => {
    expect(
      buildBreadcrumbs({
        pathname: "/sales-invoices/abc/edit",
        active: invoices,
        recordLabel: "INV-0001",
      }),
    ).toEqual([
      { label: "Sales" },
      { label: "Sales invoices", href: "/sales-invoices" },
      { label: "INV-0001", href: "/sales-invoices/abc" },
      { label: "Edit" },
    ]);
  });

  it("falls back to Details when the record label is unknown", () => {
    expect(buildBreadcrumbs({ pathname: "/sales-invoices/abc", active: invoices })).toEqual([
      { label: "Sales" },
      { label: "Sales invoices", href: "/sales-invoices" },
      { label: "Details" },
    ]);
  });

  it("handles the dashboard path", () => {
    expect(buildBreadcrumbs({ pathname: "/", active: dashboard })).toEqual([
      { label: "Overview" },
      { label: "Dashboard" },
    ]);
  });
});
