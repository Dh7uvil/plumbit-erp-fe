"use client";

import type { ComponentProps } from "react";

import { Input } from "@/shared/components/ui/input";
import { normalizeDecimalInput } from "@/shared/lib/format";

export type DecimalInputKind = "money" | "quantity" | "percent";

const KIND_DIGITS: Record<DecimalInputKind, number> = {
  money: 2,
  quantity: 2,
  percent: 2,
};

export function DecimalInput({
  kind,
  onBlur,
  onChange,
  value,
  disabled,
  readOnly,
  ...props
}: Omit<ComponentProps<typeof Input>, "type" | "inputMode"> & {
  kind: DecimalInputKind;
}) {
  const digits = KIND_DIGITS[kind];
  const raw = value == null ? "" : String(value);
  const fraction = raw.includes(".") ? raw.split(".")[1] ?? "" : "";
  const shouldNormalizeDisplay =
    raw !== "" &&
    (Boolean(disabled || readOnly) || fraction.length > digits);
  const displayValue = shouldNormalizeDisplay
    ? normalizeDecimalInput(raw, digits) || value
    : value;

  return (
    <Input
      {...props}
      value={displayValue}
      disabled={disabled}
      readOnly={readOnly}
      type="text"
      inputMode="decimal"
      onChange={onChange}
      onBlur={(event) => {
        const current = event.target.value;
        const normalized = normalizeDecimalInput(current, KIND_DIGITS[kind]);
        if (normalized !== current && onChange) {
          event.target.value = normalized;
          onChange(event);
        }
        onBlur?.(event);
      }}
    />
  );
}
