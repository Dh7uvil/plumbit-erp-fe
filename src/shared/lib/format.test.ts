import { describe, expect, it } from "vitest";

import { formatDecimal, formatMoney, formatQuantity, humanizeEnum, isZeroDecimal } from "@/shared/lib/format";

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

describe("formatQuantity", () => {
  it("trims trailing zeros and caps fraction digits", () => {
    expect(formatQuantity("50000.000000")).toBe(formatQuantity("50000"));
    expect(formatQuantity("1.250000")).toMatch(/1\.25$/);
    expect(formatQuantity("1.23456789")).toMatch(/1\.2345$/);
  });
});

describe("isZeroDecimal", () => {
  it("treats empty and zero-like strings as zero", () => {
    expect(isZeroDecimal(null)).toBe(true);
    expect(isZeroDecimal("0")).toBe(true);
    expect(isZeroDecimal("0.000")).toBe(true);
    expect(isZeroDecimal("0.01")).toBe(false);
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

describe("humanizeEnum", () => {
  it("returns a dash for empty values", () => {
    expect(humanizeEnum(null)).toBe("—");
    expect(humanizeEnum("")).toBe("—");
  });

  it("title-cases underscore and hyphen enums", () => {
    expect(humanizeEnum("CREDIT_LIMIT_EXCEEDED")).toBe("Credit Limit Exceeded");
    expect(humanizeEnum("in-transit")).toBe("In Transit");
  });
});
