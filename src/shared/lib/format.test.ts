import { describe, expect, it } from "vitest";

import { formatDecimal, formatMoney } from "@/shared/lib/format";

describe("formatMoney", () => {
  it("returns a dash for empty values", () => {
    expect(formatMoney(null, "AED")).toBe("—");
    expect(formatMoney("", "AED")).toBe("—");
  });

  it("keeps integer digits that Number() cannot represent exactly", () => {
    const formatted = formatMoney("9007199254740993.00", "AED");
    expect(formatted.replace(/[^\d]/g, "")).toContain("900719925474099300");
  });

  it("formats zero and negative amounts without float coercion", () => {
    expect(formatMoney("0", "AED").replace(/[^\d]/g, "")).toMatch(/0+/);
    const negative = formatMoney("-12.50", "AED");
    expect(negative).toMatch(/-/);
    expect(negative.replace(/[^\d]/g, "")).toContain("1250");
  });

  it("falls back to code plus value for an unknown currency", () => {
    expect(formatMoney("10.00", "NOTREAL")).toBe("NOTREAL 10.00");
  });
});

describe("formatDecimal", () => {
  it("returns a dash for empty values", () => {
    expect(formatDecimal(null)).toBe("—");
    expect(formatDecimal("")).toBe("—");
  });

  it("preserves the decimal string without Number()", () => {
    expect(formatDecimal("1.234567")).toMatch(/1\.234567/);
  });
});
