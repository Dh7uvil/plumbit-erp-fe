import type { FieldPath, FieldValues, UseFormSetError } from "react-hook-form";

import { getValidationFieldErrors } from "@/shared/api/errors";

export function applyFieldErrors<TFieldValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TFieldValues>,
): boolean {
  const fields = getValidationFieldErrors(error);
  const entries = Object.entries(fields);
  for (const [name, message] of entries) {
    setError(name as FieldPath<TFieldValues>, { type: "server", message });
  }
  return entries.length > 0;
}
