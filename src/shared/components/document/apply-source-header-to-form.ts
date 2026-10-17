import type { FieldPath, FieldValues, PathValue, UseFormReturn } from "react-hook-form";

import {
  mapSourceToHeaderValues,
  type SourceHeaderAutofillInput,
} from "@/shared/components/document/source-header-autofill";

export function applySourceHeaderToForm<TFieldValues extends FieldValues>(
  form: UseFormReturn<TFieldValues>,
  source: SourceHeaderAutofillInput,
  dirtyFields?: Set<string>,
) {
  const values = mapSourceToHeaderValues(source);
  for (const [field, value] of Object.entries(values)) {
    if (dirtyFields?.has(field)) {
      continue;
    }
    form.setValue(field as FieldPath<TFieldValues>, value as PathValue<TFieldValues, FieldPath<TFieldValues>>);
  }
}
