import { describe, expect, it } from "vitest";

import { catalogLineAutofill } from "@/modules/erp/supplier-products/catalog-line";

const AED = "44444444-4444-4444-8444-444444444444";
const CNY = "55555555-5555-4555-8555-555555555555";

const catalog = {
  supplier_item_name: "Cu pipe 15mm",
  price: "12.50",
  currency_id: AED,
  currency_code: "AED",
};

const product = {
  name: "Copper pipe",
  purchase_description: "Copper pipe (purchase)",
  purchase_rate: "8.00",
  unit_id: "88888888-8888-4888-8888-888888888888",
  tax_id: null,
};

describe("catalogLineAutofill", () => {
  it("uses the catalog price when currencies match", () => {
    const result = catalogLineAutofill(catalog, product, AED);
    expect(result.description).toBe("Cu pipe 15mm");
    expect(result.rate).toBe("12.50");
    expect(result.rateFromCatalog).toBe(true);
    expect(result.catalogPriceHint).toBeNull();
    expect(result.unit_id).toBe(product.unit_id);
  });

  it("falls back to purchase_rate and shows a hint when currencies differ", () => {
    const result = catalogLineAutofill(catalog, product, CNY);
    expect(result.rate).toBe("8.00");
    expect(result.rateFromCatalog).toBe(false);
    expect(result.catalogPriceHint).toEqual({ price: "12.50", currencyCode: "AED" });
  });

  it("does not use the catalog price when the document has no currency yet", () => {
    const result = catalogLineAutofill(catalog, product, null);
    expect(result.rate).toBe("8.00");
    expect(result.rateFromCatalog).toBe(false);
    expect(result.catalogPriceHint).toEqual({ price: "12.50", currencyCode: "AED" });
  });

  it("falls back through supplier name then product purchase description then product name", () => {
    expect(
      catalogLineAutofill({ ...catalog, supplier_item_name: "" }, product, AED).description,
    ).toBe("Copper pipe (purchase)");
    expect(
      catalogLineAutofill(
        { ...catalog, supplier_item_name: "" },
        { ...product, purchase_description: null },
        AED,
      ).description,
    ).toBe("Copper pipe");
    expect(
      catalogLineAutofill({ ...catalog, supplier_item_name: "  " }, null, AED).description,
    ).toBe("");
  });

  it("leaves rate empty when unmapped and currencies do not match", () => {
    const result = catalogLineAutofill(catalog, null, CNY);
    expect(result.rate).toBe("");
    expect(result.rateFromCatalog).toBe(false);
    expect(result.catalogPriceHint).toEqual({ price: "12.50", currencyCode: "AED" });
  });
});
