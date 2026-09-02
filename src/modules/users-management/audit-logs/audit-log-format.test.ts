import { describe, expect, it } from "vitest";

import {
  formatAuditValue,
  humanizeAuditField,
} from "@/modules/users-management/audit-logs/audit-log-format";

describe("formatAuditValue", () => {
  it("returns empty for null, undefined, and empty arrays", () => {
    expect(formatAuditValue(null)).toEqual({ kind: "empty" });
    expect(formatAuditValue(undefined)).toEqual({ kind: "empty" });
    expect(formatAuditValue([])).toEqual({ kind: "empty" });
  });

  it("formats booleans as Yes and No", () => {
    expect(formatAuditValue(true)).toEqual({ kind: "text", text: "Yes" });
    expect(formatAuditValue(false)).toEqual({ kind: "text", text: "No" });
  });

  it("formats primitive arrays as a stacked list", () => {
    expect(formatAuditValue(["Sales Manager"])).toEqual({
      kind: "list",
      items: ["Sales Manager"],
    });
    expect(formatAuditValue(["identity.user.read", "identity.user.update"])).toEqual({
      kind: "list",
      items: ["identity.user.read", "identity.user.update"],
    });
  });

  it("keeps objects and mixed arrays as JSON", () => {
    expect(formatAuditValue({ product: "SKU-1", rate: "10.00" })).toEqual({
      kind: "json",
      text: JSON.stringify({ product: "SKU-1", rate: "10.00" }, null, 2),
    });
    expect(formatAuditValue(["Sales Manager", { id: "x" }])).toMatchObject({ kind: "json" });
  });
});

describe("humanizeAuditField", () => {
  it("replaces underscores and capitalizes the first word", () => {
    expect(humanizeAuditField("from_currency")).toBe("From currency");
    expect(humanizeAuditField("role_ids")).toBe("Role ids");
    expect(humanizeAuditField("has_logo")).toBe("Has logo");
  });
});
