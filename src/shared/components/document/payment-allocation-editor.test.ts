import { describe, expect, it } from "vitest";

import {
  CUSTOMER_PAYMENT_ALLOCATE_TYPES,
  SUPPLIER_PAYMENT_ALLOCATE_TYPES,
  defaultAllocationAmounts,
  filterOpenItemsForPaymentAllocation,
  paymentAllocationsPayload,
  sumCashAllocationAmounts,
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
  it("sends typed non-zero amounts including credits and uses API item ids", () => {
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

  it("sums only cash lines toward received", () => {
    const credit: OpenItemRow = {
      ...invoice,
      item_type: "CREDIT_NOTE",
      document_id: "66666666-6666-4666-8666-666666666666",
      document_number: "CN-1",
      is_debit: false,
    };
    expect(
      sumCashAllocationAmounts([invoice, credit], {
        [invoice.document_id]: "50.00",
        [credit.document_id]: "20.00",
      }),
    ).toBe("50");
  });

  it("defaults the linked invoice to the API balance", () => {
    expect(defaultAllocationAmounts([invoice], invoice.document_id)).toEqual({
      [invoice.document_id]: "40.50",
    });
  });

  it("sums typed amounts without using floats", () => {
    expect(sumMoneyStrings(["10.10", "0.20", ""])).toBe("10.3");
  });

  it("keeps only bills and opening AP when allocating a supplier payment", () => {
    const advance: OpenItemRow = {
      ...invoice,
      item_type: "SUPPLIER_PAYMENT",
      document_id: "44444444-4444-4444-8444-444444444444",
      document_number: "PAY-1",
      is_debit: true,
    };
    const bill: OpenItemRow = {
      ...invoice,
      item_type: "PURCHASE_INVOICE",
      document_number: "BILL-1",
      is_debit: false,
    };
    expect(
      filterOpenItemsForPaymentAllocation(
        [advance, bill],
        SUPPLIER_PAYMENT_ALLOCATE_TYPES,
        advance.document_id,
      ),
    ).toEqual([bill]);
  });

  it("keeps invoices, opening AR, and credit notes when allocating a customer receipt", () => {
    const receipt: OpenItemRow = {
      ...invoice,
      item_type: "CUSTOMER_PAYMENT",
      document_id: "55555555-5555-4555-8555-555555555555",
      document_number: "REC-1",
      is_debit: false,
    };
    const credit: OpenItemRow = {
      ...invoice,
      item_type: "CREDIT_NOTE",
      document_id: "66666666-6666-4666-8666-666666666666",
      document_number: "CN-1",
      is_debit: false,
    };
    expect(
      filterOpenItemsForPaymentAllocation(
        [receipt, invoice, credit],
        CUSTOMER_PAYMENT_ALLOCATE_TYPES,
        receipt.document_id,
      ),
    ).toEqual([invoice, credit]);
  });
});
