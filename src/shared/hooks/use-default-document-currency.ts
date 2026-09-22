"use client";

import { useEffect } from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";

export function useDefaultDocumentCurrency<T extends FieldValues>(
  form: UseFormReturn<T>,
  isEdit: boolean,
  baseCurrencyId: string | undefined,
  field: Path<T> = "currency_id" as Path<T>,
) {
  useEffect(() => {
    if (isEdit || !baseCurrencyId) {
      return;
    }
    if (form.getValues(field) === OPTIONAL_SELECT_NONE) {
      form.setValue(field, baseCurrencyId as T[Path<T>]);
    }
  }, [baseCurrencyId, field, form, isEdit]);
}
