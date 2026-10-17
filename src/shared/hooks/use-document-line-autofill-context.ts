"use client";

import { useMemo } from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { useWatch } from "react-hook-form";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";

function optionalUuid(value: unknown): string | null {
  if (typeof value !== "string" || !value || value === OPTIONAL_SELECT_NONE) {
    return null;
  }
  return value;
}

export function useDocumentLineAutofillContext<TFieldValues extends FieldValues>({
  control,
  priceListField = "price_list_id" as FieldPath<TFieldValues>,
  currencyField = "currency_id" as FieldPath<TFieldValues>,
  warehouseField = "warehouse_id" as FieldPath<TFieldValues>,
}: {
  control: Control<TFieldValues>;
  priceListField?: FieldPath<TFieldValues>;
  currencyField?: FieldPath<TFieldValues>;
  warehouseField?: FieldPath<TFieldValues>;
}) {
  const priceListRaw = useWatch({ control, name: priceListField });
  const currencyRaw = useWatch({ control, name: currencyField });
  const warehouseRaw = useWatch({ control, name: warehouseField });

  return useMemo(
    () => ({
      priceListId: optionalUuid(priceListRaw),
      currencyId: optionalUuid(currencyRaw),
      warehouseId: optionalUuid(warehouseRaw),
    }),
    [currencyRaw, priceListRaw, warehouseRaw],
  );
}
