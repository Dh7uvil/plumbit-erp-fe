"use client";

import { ProductInventoryWorkbench } from "@/modules/inventory-management/products/components/product-inventory-workbench";

export function InventoryDetailsScreen() {
  return (
    <ProductInventoryWorkbench
      title="Inventory details"
      subtitle="Item inquiry with sales and purchase history."
    />
  );
}
