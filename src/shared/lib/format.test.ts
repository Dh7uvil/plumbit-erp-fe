import { describe, expect, it } from "vitest";

import {
  formatDecimal,
  formatFixedDecimal,
  formatMoney,
  formatPercent,
  formatQuantity,
  humanizeEnum,
  isZeroDecimal,
  normalizeDecimalInput,
} from "@/shared/lib/format";

function digitsAndDot(value: string): string {
  return value.replace(/[^\d.-]/g, "");
}

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

  it("rounds half-up to the currency fraction digits", () => {
    expect(digitsAndDot(formatMoney("100.555", "AED"))).toContain("100.56");
  });

  it("falls back to code plus value for an unknown currency", () => {
    expect(formatMoney("10.00", "NOTREAL")).toBe("NOTREAL 10.00");
  });
});

describe("formatFixedDecimal", () => {
  it("returns a dash for empty values", () => {
    expect(formatFixedDecimal(null)).toBe("—");
    expect(formatFixedDecimal("")).toBe("—");
  });

  it("pads and rounds half-up to two places", () => {
    expect(digitsAndDot(formatFixedDecimal("100"))).toBe("100.00");
    expect(digitsAndDot(formatFixedDecimal("100.5"))).toBe("100.50");
    expect(digitsAndDot(formatFixedDecimal("100.555"))).toBe("100.56");
    expect(digitsAndDot(formatFixedDecimal("1.234"))).toBe("1.23");
  });

  it("keeps grouping and values Number() cannot represent", () => {
    expect(digitsAndDot(formatFixedDecimal("50000"))).toBe("50000.00");
    expect(digitsAndDot(formatFixedDecimal("9007199254740993.555"))).toBe("9007199254740993.56");
  });

  it("preserves negative sign for fractional values", () => {
    expect(formatFixedDecimal("-12.5")).toMatch(/-/);
    expect(digitsAndDot(formatFixedDecimal("-12.5"))).toBe("-12.50");
    expect(digitsAndDot(formatFixedDecimal("-0.006"))).toBe("-0.01");
  });
});

describe("formatQuantity", () => {
  it("pads to two fraction digits", () => {
    expect(digitsAndDot(formatQuantity("50000.000000"))).toBe("50000.00");
    expect(digitsAndDot(formatQuantity("4"))).toBe("4.00");
    expect(digitsAndDot(formatQuantity("1.250000"))).toBe("1.25");
    expect(digitsAndDot(formatQuantity("1.23456789"))).toBe("1.23");
  });
});

describe("formatPercent", () => {
  it("returns a dash for empty values", () => {
    expect(formatPercent(null)).toBe("—");
    expect(formatPercent("")).toBe("—");
  });

  it("pads to two places and appends a percent sign", () => {
    expect(formatPercent("5")).toMatch(/5\.00%$/);
    expect(formatPercent("12.5")).toMatch(/12\.50%$/);
  });
});

describe("normalizeDecimalInput", () => {
  it("leaves empty values empty and does not group", () => {
    expect(normalizeDecimalInput("")).toBe("");
    expect(normalizeDecimalInput("   ")).toBe("");
    expect(normalizeDecimalInput("1000.5")).toBe("1000.50");
  });

  it("pads and rounds half-up without grouping", () => {
    expect(normalizeDecimalInput("100.5")).toBe("100.50");
    expect(normalizeDecimalInput("100")).toBe("100.00");
    expect(normalizeDecimalInput("100.555")).toBe("100.56");
    expect(normalizeDecimalInput("-12.5")).toBe("-12.50");
  });

  it("returns the original string when the value is not a decimal", () => {
    expect(normalizeDecimalInput("1,000.5")).toBe("1,000.5");
    expect(normalizeDecimalInput("abc")).toBe("abc");
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

  it("preserves extra FX digits without padding", () => {
    expect(formatDecimal("1.234567")).toMatch(/1\.234567/);
    expect(formatDecimal("3.672500")).toMatch(/3\.672500/);
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
