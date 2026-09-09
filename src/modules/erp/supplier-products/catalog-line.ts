export type CatalogLineSource = {
  supplier_item_name: string;
  price: string | null;
  currency_id: string;
  currency_code: string | null;
};

export type CatalogLineProduct = {
  name: string;
  purchase_description: string | null;
  purchase_rate: string;
  unit_id: string | null;
  tax_id: string | null;
};

export type CatalogPriceHint = {
  price: string;
  currencyCode: string;
};

export type CatalogLineAutofill = {
  description: string;
  rate: string;
  unit_id: string | null;
  tax_id: string | null;
  rateFromCatalog: boolean;
  catalogPriceHint: CatalogPriceHint | null;
};

export function catalogCurrencyMatches(
  catalogCurrencyId: string,
  documentCurrencyId: string | null | undefined,
): boolean {
  return Boolean(documentCurrencyId) && catalogCurrencyId === documentCurrencyId;
}

export function catalogLineAutofill(
  catalog: CatalogLineSource,
  product: CatalogLineProduct | null,
  documentCurrencyId: string | null | undefined,
): CatalogLineAutofill {
  const description =
    catalog.supplier_item_name.trim() ||
    product?.purchase_description?.trim() ||
    product?.name ||
    "";
  const catalogPrice = catalog.price?.trim() || null;
  const rateFromCatalog = Boolean(
    catalogPrice && catalogCurrencyMatches(catalog.currency_id, documentCurrencyId),
  );
  const rate = rateFromCatalog ? catalogPrice! : (product?.purchase_rate ?? "");
  const catalogPriceHint =
    catalogPrice && catalog.currency_code && !rateFromCatalog
      ? { price: catalogPrice, currencyCode: catalog.currency_code }
      : null;

  return {
    description,
    rate,
    unit_id: product?.unit_id ?? null,
    tax_id: product?.tax_id ?? null,
    rateFromCatalog,
    catalogPriceHint,
  };
}
