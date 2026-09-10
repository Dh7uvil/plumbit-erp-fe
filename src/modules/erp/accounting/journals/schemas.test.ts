import { describe, expect, it } from "vitest";

import { journalBalanceTotals } from "@/modules/erp/accounting/journals/balance";
import {
  JournalEntryCreateRequestSchema,
  JournalEntrySchema,
  JournalFormSchema,
  emptyJournalLine,
} from "@/modules/erp/accounting/journals/schemas";

const ACCOUNT_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ACCOUNT_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const CURRENCY_ID = "44444444-4444-4444-8444-444444444444";
const TENANT_ID = "11111111-1111-4111-8111-111111111111";
const ENTRY_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

describe("journalBalanceTotals", () => {
  it("reports a zero difference when debit and credit match", () => {
    const result = journalBalanceTotals([
      { debit: "100.0000", credit: "0" },
      { debit: "0", credit: "40.50" },
      { debit: "0", credit: "59.5000" },
    ]);
    expect(result.totalDebit).toBe("100.0000");
    expect(result.totalCredit).toBe("100.0000");
    expect(result.difference).toBe("0.0000");
    expect(result.isBalanced).toBe(true);
  });

  it("reports the absolute difference when the entry is unbalanced", () => {
    const result = journalBalanceTotals([
      { debit: "10.10", credit: "" },
      { debit: "", credit: "4.00" },
    ]);
    expect(result.totalDebit).toBe("10.1000");
    expect(result.totalCredit).toBe("4.0000");
    expect(result.difference).toBe("6.1000");
    expect(result.isBalanced).toBe(false);
  });
});

describe("JournalEntrySchema", () => {
  it("parses a draft journal with lines and available_actions", () => {
    const result = JournalEntrySchema.safeParse({
      id: ENTRY_ID,
      tenant_id: TENANT_ID,
      document_number: "JV-2026-000001",
      entry_date: "2026-01-15",
      status: "DRAFT",
      version: 1,
      is_posted: false,
      journal_type: "MANUAL",
      source_type: null,
      source_id: null,
      reversal_of_id: null,
      reversed_by_id: null,
      currency_id: CURRENCY_ID,
      exchange_rate: "1.000000",
      branch_id: null,
      narration: "Opening",
      reference: null,
      posted_at: null,
      posted_by: null,
      total_debit_base: "10.0000",
      total_credit_base: "10.0000",
      available_actions: ["post", "cancel", "delete"],
      period_locked: false,
      lines: [
        {
          id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
          line_number: 1,
          account_id: ACCOUNT_A,
          debit: "10.0000",
          credit: "0.0000",
          debit_base: "10.0000",
          credit_base: "0.0000",
          currency_id: CURRENCY_ID,
          exchange_rate: "1.000000",
          party_type: null,
          party_id: null,
          due_date: null,
          external_reference: null,
          tax_id: null,
          branch_id: null,
          description: null,
        },
      ],
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });
});

describe("JournalEntryCreateRequestSchema", () => {
  it("requires at least one line", () => {
    expect(JournalEntryCreateRequestSchema.safeParse({ lines: [] }).success).toBe(false);
    expect(
      JournalEntryCreateRequestSchema.safeParse({
        lines: [{ account_id: ACCOUNT_A, debit: "1", credit: "0" }],
      }).success,
    ).toBe(true);
  });
});

describe("JournalFormSchema", () => {
  it("rejects a single blank pair of lines", () => {
    const result = JournalFormSchema.safeParse({
      entry_date: "2026-01-15",
      currency_id: CURRENCY_ID,
      exchange_rate: "1",
      branch_id: "none",
      narration: "",
      reference: "",
      lines: [emptyJournalLine(), emptyJournalLine()],
    });
    expect(result.success).toBe(false);
  });
});
