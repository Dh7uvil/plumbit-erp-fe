"use client";

import { useEffect } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";

import { applySourceHeaderToForm } from "@/shared/components/document/apply-source-header-to-form";
import type { SourceHeaderAutofillInput } from "@/shared/components/document/source-header-autofill";

/** Applies mapped header fields when a source document payload is loaded (create flows). */
export function useSourceDocumentAutofill<TFieldValues extends FieldValues>(
  form: UseFormReturn<TFieldValues>,
  source: SourceHeaderAutofillInput | null | undefined,
  {
    isEdit,
    disabled,
    dirtyFields,
  }: { isEdit: boolean; disabled?: boolean; dirtyFields?: Set<string> },
) {
  useEffect(() => {
    if (isEdit || disabled || !source) {
      return;
    }
    applySourceHeaderToForm(form, source, dirtyFields);
  }, [disabled, dirtyFields, form, isEdit, source]);
}
