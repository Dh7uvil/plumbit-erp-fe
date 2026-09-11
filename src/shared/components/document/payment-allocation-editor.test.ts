import { describe, expect, it } from "vitest";

import {
  defaultAllocationAmounts,
  paymentAllocationsPayload,
  sumMoneyStrings,
} from "@/shared/components/document/payment-allocation-editor";
import type { OpenItemRow } from "@/shared/components/document/schemas";

const invoice: OpenItemRow = {
  item_type: "SALES_INVOICE",
  document_id: "11111111-1111-4111-8111-111111111111",
  document_number: "INV-1",
  document_date: "2026-09-01",
  due_date: "2026-09-30",
  currency_id: "22222222-2222-4222-8222-222222222222",
  original_amount: "100.00",
  balance: "40.50",
  is_debit: true,
  exchange_rate: "1",
};

describe("payment allocation helpers", () => {
  it("sends only typed positive amounts and uses API item ids", () => {
    expect(
      paymentAllocationsPayload([invoice], {
        [invoice.document_id]: "40.50",
        "33333333-3333-4333-8333-333333333333": "0",
      }),
    ).toEqual([
      {
        item_type: "SALES_INVOICE",
        item_id: invoice.document_id,
        amount: "40.50",
      },
    ]);
  });

  it("defaults the linked invoice to the API balance", () => {
    expect(defaultAllocationAmounts([invoice], invoice.document_id)).toEqual({
      [invoice.document_id]: "40.50",
    });
  });

  it("sums typed amounts without using floats", () => {
    expect(sumMoneyStrings(["10.10", "0.20", ""])).toBe("10.3");
  });
});
