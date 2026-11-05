import { describe, expect, it } from "vitest";

import { SOURCE_DOCUMENT_PICKER_TYPES } from "@/shared/components/document/source-document-list";

describe("SOURCE_DOCUMENT_PICKER_TYPES", () => {
  it("excludes purchase invoice from cost sheet and voucher pickers", () => {
    expect(SOURCE_DOCUMENT_PICKER_TYPES).not.toContain("PURCHASE_INVOICE");
  });
});
