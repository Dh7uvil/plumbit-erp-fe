import { describe, expect, it } from "vitest";

import { currentFiscalPeriod, toIsoDate } from "@/shared/lib/fiscal-period";

describe("currentFiscalPeriod", () => {
  it("uses the current calendar year when today is on or after the start date", () => {
    expect(currentFiscalPeriod(1, 1, new Date(2026, 8, 14))).toEqual({
      from: "2026-01-01",
      to: "2026-09-14",
    });
  });

  it("rolls back a year when today is before the fiscal start", () => {
    expect(currentFiscalPeriod(4, 1, new Date(2026, 2, 15))).toEqual({
      from: "2025-04-01",
      to: "2026-03-15",
    });
  });

  it("clamps an oversized start day to the last day of the start month", () => {
    expect(currentFiscalPeriod(2, 31, new Date(2026, 5, 1))).toEqual({
      from: "2026-02-28",
      to: "2026-06-01",
    });
  });
});

describe("toIsoDate", () => {
  it("formats local calendar dates without UTC shifting", () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});
