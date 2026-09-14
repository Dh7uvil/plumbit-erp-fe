import { describe, expect, it } from "vitest";

import {
  DOCUMENT_TYPES,
  documentDetailHref,
  documentTypeDisplayLabel,
  hasRelatedDocumentType,
  isDocumentType,
  normalizeDocumentType,
} from "@/shared/components/document/document-links";

describe("document links", () => {
  it("normalizes spaced and hyphenated types", () => {
    expect(normalizeDocumentType("proforma-invoice")).toBe("PROFORMA_INVOICE");
    expect(normalizeDocumentType("Sales Order")).toBe("SALES_ORDER");
  });

  it("builds known detail hrefs and skips unknown types", () => {
    expect(documentDetailHref("QUOTATION", "11111111-1111-4111-8111-111111111111")).toBe(
      "/quotations/11111111-1111-4111-8111-111111111111",
    );
    expect(documentDetailHref("sales-invoice", "11111111-1111-4111-8111-111111111111")).toBe(
      "/sales-invoices/11111111-1111-4111-8111-111111111111",
    );
    expect(documentDetailHref("CUSTOMER_PAYMENT", "11111111-1111-4111-8111-111111111111")).toBe(
      "/customer-payments/11111111-1111-4111-8111-111111111111",
    );
    expect(documentDetailHref("supplier-payment", "11111111-1111-4111-8111-111111111111")).toBe(
      "/supplier-payments/11111111-1111-4111-8111-111111111111",
    );
    expect(documentDetailHref("LANDED_COST", "11111111-1111-4111-8111-111111111111")).toBe(
      "/landed-costs/11111111-1111-4111-8111-111111111111",
    );
    expect(documentDetailHref("PURCHASE_RETURN", "11111111-1111-4111-8111-111111111111")).toBe(
      "/purchase-returns/11111111-1111-4111-8111-111111111111",
    );
    expect(documentDetailHref("JOURNAL", "11111111-1111-4111-8111-111111111111")).toBe(
      "/journals/11111111-1111-4111-8111-111111111111",
    );
    expect(documentDetailHref("UNKNOWN", "11111111-1111-4111-8111-111111111111")).toBeNull();
  });

  it("exposes all 21 document types including JOURNAL", () => {
    expect(DOCUMENT_TYPES).toHaveLength(21);
    expect(isDocumentType("JOURNAL")).toBe(true);
    expect(documentTypeDisplayLabel("JOURNAL")).toBe("Journal");
  });

  it("labels known types and title-cases the rest", () => {
    expect(documentTypeDisplayLabel("CREDIT_NOTE")).toBe("Credit note");
    expect(documentTypeDisplayLabel("CUSTOMER_PAYMENT")).toBe("Customer receipt");
    expect(documentTypeDisplayLabel("custom_type")).toBe("Custom Type");
  });

  it("matches related documents after type normalization", () => {
    const documents = [{ document_type: "sales-order" }, { document_type: "SALES_INVOICE" }];
    expect(hasRelatedDocumentType(documents, "SALES_ORDER")).toBe(true);
    expect(hasRelatedDocumentType(documents, "quotation")).toBe(false);
  });
});
