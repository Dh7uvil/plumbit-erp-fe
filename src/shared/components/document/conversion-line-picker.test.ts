import { describe, expect, it } from "vitest";

import {
  conversionLinesPayload,
  defaultConversionQuantities,
  isFullRemainingConversion,
  isPositiveDecimal,
  remainingConversionQty,
} from "@/shared/components/document/conversion-line-picker";

describe("remainingConversionQty", () => {
  it("uses remaining quantity when the backend sends it", () => {
    expect(
      remainingConversionQty({
        quantity: "10",
        qty_converted: "4",
        qty_remaining: "6",
      }),
    ).toBe("6");
  });

  it("falls back to ordered quantity when remaining is omitted", () => {
    expect(remainingConversionQty({ quantity: "10" })).toBe("10");
    expect(
      remainingConversionQty({
        quantity: "10",
        qty_converted: "0",
        qty_remaining: "",
      }),
    ).toBe("10");
  });
});

describe("conversion line helpers", () => {
  it("treats only positive decimals as convertible", () => {
    expect(isPositiveDecimal("1.5")).toBe(true);
    expect(isPositiveDecimal("0")).toBe(false);
    expect(isPositiveDecimal("")).toBe(false);
  });

  it("defaults convert qty to remaining positive amounts", () => {
    expect(
      defaultConversionQuantities([
        {
          id: "a",
          line_number: 1,
          description: "Pipe",
          quantity: "10",
          qty_converted: "0",
          qty_remaining: "10",
        },
        {
          id: "b",
          line_number: 2,
          description: "Done",
          quantity: "4",
          qty_converted: "4",
          qty_remaining: "0",
        },
      ]),
    ).toEqual({ a: "10", b: "" });
  });

  it("omits empty and zero convert quantities from the payload", () => {
    expect(conversionLinesPayload({ a: "2", b: "0", c: "" })).toEqual([
      { source_line_id: "a", quantity: "2" },
    ]);
    expect(conversionLinesPayload({ a: "0" })).toBeUndefined();
  });

  it("detects when convert quantities still match remaining qty", () => {
    const lines = [
      {
        id: "a",
        line_number: 1,
        description: "Pipe",
        quantity: "10",
        qty_converted: "0",
        qty_remaining: "10",
      },
      {
        id: "b",
        line_number: 2,
        description: "Done",
        quantity: "4",
        qty_converted: "4",
        qty_remaining: "0",
      },
    ];
    expect(isFullRemainingConversion(lines, { a: "10", b: "" })).toBe(true);
    expect(isFullRemainingConversion(lines, { a: "3", b: "" })).toBe(false);
  });
});
