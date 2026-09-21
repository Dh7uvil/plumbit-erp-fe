import { describe, expect, it } from "vitest";

import { searchableNavigation } from "@/config/navigation";
import {
  findReportByHref,
  hasAnyReportAccess,
  visibleReportCatalog,
} from "@/config/report-catalog";
import { reportPermissions } from "@/modules/erp/accounting/reports/permissions";

describe("visibleReportCatalog", () => {
  it("returns no groups without report permissions", () => {
    expect(visibleReportCatalog([])).toEqual([]);
    expect(hasAnyReportAccess([])).toBe(false);
  });

  it("keeps only groups the user can access", () => {
    const groups = visibleReportCatalog([reportPermissions.tax]);
    expect(groups.map((group) => group.label)).toEqual(["Tax reports"]);
    expect(groups[0]?.items.map((item) => item.label)).toContain("VAT 201");
    expect(hasAnyReportAccess([reportPermissions.tax])).toBe(true);
  });

  it("keeps the CRM group when the user has CRM report access", () => {
    const groups = visibleReportCatalog(["reports.report.crm"]);
    expect(groups.map((group) => group.label)).toEqual(["CRM reports"]);
    expect(groups[0]?.items.map((item) => item.label)).toContain("Sales pipeline");
  });
});

describe("findReportByHref", () => {
  it("finds a catalog report by path", () => {
    expect(findReportByHref("/reports/trial-balance")?.item.label).toBe("Trial balance");
  });

  it("returns undefined for the hub path", () => {
    expect(findReportByHref("/reports")).toBeUndefined();
  });
});

describe("searchableNavigation", () => {
  it("includes the reports hub and visible catalog reports", () => {
    const labels = searchableNavigation([reportPermissions.ledger]).flatMap((group) =>
      group.items.map((item) => item.label),
    );
    expect(labels).toContain("Reports");
    expect(labels).toContain("Trial balance");
    expect(labels).not.toContain("VAT 201");
  });
});
