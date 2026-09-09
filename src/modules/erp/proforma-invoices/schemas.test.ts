import { describe, expect, it } from "vitest";

import {
  defaultMilestones,
  milestoneTotals,
  parseDecimal,
  ProformaInvoiceFormSchema,
} from "@/modules/erp/proforma-invoices/schemas";
import { isQtyUncovered } from "@/modules/erp/sales-orders/schemas";
import { visibleActions, type DocumentActionSpec } from "@/shared/components/document/workflow-registry";

describe("milestoneTotals", () => {
  it("sums percent mode and flags a mixed schedule", () => {
    const percent = milestoneTotals(defaultMilestones());
    expect(percent.mixed).toBe(false);
    expect(percent.mode).toBe("percent");
    expect(percent.percentSum).toBe(100);

    const mixed = milestoneTotals([
      { ...defaultMilestones()[0], mode: "percent" },
      { ...defaultMilestones()[1], mode: "amount", value: "70" },
    ]);
    expect(mixed.mixed).toBe(true);
    expect(mixed.mode).toBeNull();
  });

  it("rejects percent schedules that do not sum to 100", () => {
    const result = ProformaInvoiceFormSchema.safeParse({
      customer_id: "11111111-1111-4111-8111-111111111111",
      contact_id: "",
      branch_id: "",
      proforma_date: "2026-01-01",
      valid_until: "",
      currency_id: "",
      price_list_id: "",
      payment_terms_id: "",
      salesperson_id: "",
      notes: "",
      terms_and_conditions: "",
      terms_template_id: "",
      discount_type: "",
      discount_value: "",
      shipping_amount: "0",
      adjustment_amount: "0",
      place_of_supply: "",
      customer_trn: "",
      tax_treatment: "",
      bill_to_snapshot: "",
      ship_to_snapshot: "",
      incoterm: "",
      incoterm_place: "",
      port_of_loading: "",
      port_of_discharge: "",
      country_of_origin: "",
      country_of_final_destination: "",
      expected_shipment_date: "",
      partial_shipment_allowed: false,
      transhipment_allowed: false,
      grand_total: "1000",
      lines: [],
      milestones: [
        { ...defaultMilestones()[0], value: "20" },
        { ...defaultMilestones()[1], value: "70" },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message.includes("100"))).toBe(true);
    }
  });
});

describe("parseDecimal", () => {
  it("parses amounts used by the running total", () => {
    expect(parseDecimal("30")).toBe(30);
    expect(parseDecimal("")).toBeNull();
  });
});

describe("visibleActions", () => {
  const registry: DocumentActionSpec<"revise" | "acknowledge" | "confirm">[] = [
    {
      action: "revise",
      label: "Revise",
      permission: "erp.quotation.revise",
      reasonField: { placeholder: "Why", required: true },
    },
    { action: "acknowledge", label: "Acknowledge", permission: "erp.sales_order.acknowledge" },
    { action: "confirm", label: "Confirm", permission: "erp.sales_order.confirm" },
  ];

  it("includes revise and acknowledge only when listed and permitted", () => {
    const visible = visibleActions(
      ["confirm", "revise", "acknowledge"],
      registry,
      (permission) => permission !== "erp.quotation.revise",
    );
    expect(visible.map((spec) => spec.action)).toEqual(["confirm", "acknowledge"]);
  });
});

describe("isQtyUncovered", () => {
  it("treats a positive uncovered quantity as uncovered", () => {
    expect(isQtyUncovered("0")).toBe(false);
    expect(isQtyUncovered("1.50")).toBe(true);
  });
});
