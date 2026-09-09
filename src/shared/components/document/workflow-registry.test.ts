import { describe, expect, it } from "vitest";

import { DocumentBaseSchema, DocumentTotalsSchema } from "@/shared/components/document/schemas";
import {
  getDocumentAction,
  visibleActions,
  type DocumentActionSpec,
} from "@/shared/components/document/workflow-registry";

const REGISTRY: DocumentActionSpec<"submit" | "approve" | "delete" | "clone">[] = [
  { action: "submit", label: "Submit", permission: "doc.update" },
  {
    action: "approve",
    label: "Approve",
    permission: "doc.approve",
    confirmCopy: (label) => `${label} will be approved.`,
  },
  {
    action: "delete",
    label: "Delete",
    permission: "doc.delete",
    variant: "destructive",
    confirmCopy: (label) => `${label} will be removed.`,
  },
  { action: "clone", label: "Clone", permission: "doc.create", variant: "outline" },
];

describe("visibleActions", () => {
  it("keeps available_actions order and drops unknown actions", () => {
    const visible = visibleActions(["clone", "bogus", "approve"], REGISTRY, () => true);
    expect(visible.map((spec) => spec.action)).toEqual(["clone", "approve"]);
  });

  it("filters by permission", () => {
    const visible = visibleActions(
      ["submit", "approve", "delete"],
      REGISTRY,
      (permission) => permission !== "doc.approve",
    );
    expect(visible.map((spec) => spec.action)).toEqual(["submit", "delete"]);
  });

  it("keeps revise when the backend lists it and the permission is granted", () => {
    const registry: DocumentActionSpec<"revise" | "send">[] = [
      { action: "revise", label: "Revise", permission: "erp.quotation.revise" },
      { action: "send", label: "Send", permission: "erp.quotation.send" },
    ];
    expect(
      visibleActions(["send", "revise"], registry, () => true).map((spec) => spec.action),
    ).toEqual(["send", "revise"]);
    expect(
      visibleActions(["send", "revise"], registry, (permission) => permission !== "erp.quotation.revise").map(
        (spec) => spec.action,
      ),
    ).toEqual(["send"]);
  });
});

describe("getDocumentAction", () => {
  it("returns the registry entry for an action", () => {
    expect(getDocumentAction(REGISTRY, "delete").label).toBe("Delete");
  });
});

describe("document schema fragments", () => {
  it("parses a document base payload", () => {
    const parsed = DocumentBaseSchema.parse({
      id: "11111111-1111-4111-8111-111111111111",
      document_number: "QUO-0001",
      status: "DRAFT",
      version: 1,
      is_posted: false,
      available_actions: ["submit"],
    });
    expect(parsed.document_number).toBe("QUO-0001");
  });

  it("parses totals without client arithmetic", () => {
    const parsed = DocumentTotalsSchema.parse({
      subtotal: "10.00",
      discount_amount: "0",
      tax_amount: "0.50",
      grand_total: "10.50",
      foreign_amount: "10.50",
      base_amount: "10.50",
      exchange_rate: "1",
      currency_id: "11111111-1111-4111-8111-111111111111",
      base_currency_id: "11111111-1111-4111-8111-111111111111",
    });
    expect(parsed.grand_total).toBe("10.50");
  });
});
