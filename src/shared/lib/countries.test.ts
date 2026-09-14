import { describe, expect, it } from "vitest";

import { countryNameForCode, isoCountryOptions } from "@/shared/lib/countries";

describe("isoCountryOptions", () => {
  it("returns searchable ISO countries without throwing", () => {
    const options = isoCountryOptions();
    expect(options.length).toBeGreaterThan(50);
    expect(
      options.some((option) => option.code === "AE" && option.name === "United Arab Emirates"),
    ).toBe(true);
    expect(countryNameForCode("CN")).toBe("China");
  });
});
