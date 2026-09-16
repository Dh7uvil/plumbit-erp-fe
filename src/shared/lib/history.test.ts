import { describe, expect, it } from "vitest";

import {
  ERP_HISTORY_PAGE_TITLE,
  MASTER_HISTORY_PAGE_TITLE,
  historyHasApprovals,
  historyPageTitle,
  historyPageTitleFromHref,
} from "@/shared/lib/history";

describe("history labels", () => {
  it("uses Approvals and History for ERP transactional resources", () => {
    expect(historyPageTitle("quotations")).toBe(ERP_HISTORY_PAGE_TITLE);
    expect(historyPageTitle("sales-invoices")).toBe(ERP_HISTORY_PAGE_TITLE);
    expect(historyHasApprovals("purchase-orders")).toBe(true);
  });

  it("uses History for CRM and master-data resources", () => {
    expect(historyPageTitle("contacts")).toBe(MASTER_HISTORY_PAGE_TITLE);
    expect(historyPageTitle("customers")).toBe(MASTER_HISTORY_PAGE_TITLE);
    expect(historyPageTitle("products")).toBe(MASTER_HISTORY_PAGE_TITLE);
    expect(historyHasApprovals("accounts")).toBe(false);
  });

  it("derives button labels from history hrefs", () => {
    expect(historyPageTitleFromHref("/history/quotations/abc")).toBe(ERP_HISTORY_PAGE_TITLE);
    expect(historyPageTitleFromHref("/history/contacts/abc?code=Contact")).toBe(
      MASTER_HISTORY_PAGE_TITLE,
    );
  });
});
