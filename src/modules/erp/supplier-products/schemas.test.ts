import { describe, expect, it } from "vitest";

import {
  SupplierProductCreateRequestSchema,
  SupplierProductFormSchema,
  SupplierProductResolveSchema,
  SupplierProductSchema,
  SupplierProductUpdateRequestSchema,
} from "@/modules/erp/supplier-products/schemas";

const PRODUCT_ID = "99999999-9999-4999-8999-999999999999";
const SUPPLIER_ID = "14141414-1414-4141-8141-141414141414";
const CURRENCY_ID = "44444444-4444-4444-8444-444444444444";
const TENANT_ID = "11111111-1111-4111-8111-111111111111";
const ROW_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

describe("SupplierProductSchema", () => {
  it("parses a mapped catalog row including denormalized labels", () => {
    const result = SupplierProductSchema.safeParse({
      id: ROW_ID,
      tenant_id: TENANT_ID,
      supplier_id: SUPPLIER_ID,
      supplier_name: "Gulf Pipes",
      product_id: PRODUCT_ID,
      product_sku: "PIPE-1",
      product_name: "Copper pipe",
      is_mapped: true,
      supplier_sku: "789",
      supplier_item_name: "Cu pipe 15mm",
      supplier_description: "15mm copper",
      price: "8.50",
      currency_id: CURRENCY_ID,
      currency_code: "AED",
      price_updated_at: "2026-01-01T00:00:00.000Z",
      is_preferred: true,
      is_preferred_supplier: false,
      notes: null,
      is_active: true,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_mapped).toBe(true);
      expect(result.data.price).toBe("8.50");
    }
  });

  it("parses an unmapped row with a null price", () => {
    const result = SupplierProductSchema.safeParse({
      id: ROW_ID,
      tenant_id: TENANT_ID,
      supplier_id: SUPPLIER_ID,
      supplier_name: "Gulf Pipes",
      product_id: null,
      product_sku: null,
      product_name: null,
      is_mapped: false,
      supplier_sku: "789",
      supplier_item_name: "Cu pipe 15mm",
      supplier_description: null,
      price: null,
      currency_id: CURRENCY_ID,
      currency_code: "AED",
      price_updated_at: null,
      is_preferred: false,
      is_preferred_supplier: false,
      notes: null,
      is_active: true,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });
});

describe("SupplierProductCreateRequestSchema", () => {
  it("requires supplier, SKU and item name", () => {
    expect(SupplierProductCreateRequestSchema.safeParse({}).success).toBe(false);
    const result = SupplierProductCreateRequestSchema.safeParse({
      supplier_id: SUPPLIER_ID,
      supplier_sku: "789",
      supplier_item_name: "Cu pipe 15mm",
    });
    expect(result.success).toBe(true);
  });
});

describe("SupplierProductUpdateRequestSchema", () => {
  it("does not accept product_id — mapping moves through link", () => {
    const result = SupplierProductUpdateRequestSchema.safeParse({
      supplier_item_name: "Updated name",
      product_id: PRODUCT_ID,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("product_id");
    }
  });
});

describe("SupplierProductFormSchema", () => {
  it("rejects an empty supplier select", () => {
    const result = SupplierProductFormSchema.safeParse({
      supplier_id: "none",
      product_id: "none",
      supplier_sku: "789",
      supplier_item_name: "Cu pipe",
      supplier_description: "",
      price: "",
      currency_id: "none",
      is_preferred: false,
      is_preferred_supplier: false,
      notes: "",
      is_active: true,
    });
    expect(result.success).toBe(false);
  });
});

describe("SupplierProductResolveSchema", () => {
  it("accepts the three resolve statuses", () => {
    for (const status of ["MAPPED", "UNMAPPED", "UNKNOWN_SKU"] as const) {
      const result = SupplierProductResolveSchema.safeParse({
        supplier_sku: "789",
        status,
      });
      expect(result.success).toBe(true);
    }
  });
});
