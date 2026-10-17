import { partyComposeApi } from "@/shared/api/party-compose-api";
import {
  mergeProductLineDefaults,
  productLineAutofillValues,
  type ProductLineAutofillSource,
} from "@/shared/components/document/line-autofill";

export type ProductLineApplyResult = ReturnType<typeof productLineAutofillValues> & {
  average_cost?: string | null;
};

export async function applyProductWithServerDefaults(
  product: ProductLineAutofillSource & { id: string },
  options: {
    purchaseSide?: boolean;
    warehouseId?: string | null;
    currencyId?: string | null;
    priceListId?: string | null;
    baseCurrencyId?: string | null;
  },
): Promise<ProductLineApplyResult> {
  const base = productLineAutofillValues(product, options.purchaseSide ? "purchase" : "sales");
  const needsServer =
    Boolean(options.priceListId) ||
    Boolean(options.warehouseId) ||
    (Boolean(options.currencyId) &&
      options.baseCurrencyId &&
      options.currencyId !== options.baseCurrencyId);
  if (!needsServer) {
    return base;
  }
  try {
    const defaults = await partyComposeApi.productLineDefaults(product.id, {
      warehouse_id: options.warehouseId ?? undefined,
      currency_id: options.currencyId ?? undefined,
      price_list_id: options.priceListId ?? undefined,
      purchase_side: options.purchaseSide ?? false,
    });
    return {
      ...mergeProductLineDefaults(base, defaults),
      average_cost: defaults.average_cost ?? null,
    };
  } catch {
    return base;
  }
}
