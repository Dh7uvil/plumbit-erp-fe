import { describe, expect, it } from "vitest";

import { formatSequencePreview } from "@/modules/erp/accounting/document-sequences/schemas";

describe("formatSequencePreview", () => {
  it("embeds a party placeholder for sales documents", () => {
    expect(formatSequencePreview("SO", 2026, 1, 6, "SALES_ORDER")).toBe("SOXXX26000001");
  });

  it("omits the party placeholder for internal documents", () => {
    expect(formatSequencePreview("JV", 2026, 1, 6, "JOURNAL_ENTRY")).toBe("JV26000001");
    expect(formatSequencePreview("SHP", 2026, 1, 6, "SHIPMENT")).toBe("SHP26000001");
  });
});
