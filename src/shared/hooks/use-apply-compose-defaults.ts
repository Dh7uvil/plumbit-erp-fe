"use client";

import { useEffect, useRef } from "react";
import type { FieldPath, FieldValues, PathValue, UseFormReturn } from "react-hook-form";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";

export type ComposeFieldMap<TFieldValues extends FieldValues, TDefaults> = {
  [K in keyof TDefaults]?: {
    field: FieldPath<TFieldValues>;
    optional?: boolean;
    alwaysRefresh?: boolean;
    transform?: (value: TDefaults[K]) => PathValue<TFieldValues, FieldPath<TFieldValues>>;
  };
};

export function applyComposeDefaultsFromMap<
  TFieldValues extends FieldValues,
  TDefaults extends Record<string, unknown>,
>({
  form,
  defaults,
  fieldMap,
  dirtyFieldsRef,
}: {
  form: UseFormReturn<TFieldValues>;
  defaults: TDefaults;
  fieldMap: ComposeFieldMap<TFieldValues, TDefaults>;
  dirtyFieldsRef?: React.MutableRefObject<Set<string> | Set<unknown>>;
}) {
  for (const [defaultsKey, mapping] of Object.entries(fieldMap) as [
    keyof TDefaults,
    NonNullable<ComposeFieldMap<TFieldValues, TDefaults>[keyof TDefaults]>,
  ][]) {
    if (!mapping) {
      continue;
    }
    const { field, optional, alwaysRefresh, transform } = mapping;
    const dirty = dirtyFieldsRef?.current.has(String(field));
    if (dirty && !alwaysRefresh) {
      continue;
    }
    const raw = defaults[defaultsKey];
    if (raw === undefined) {
      continue;
    }
    let value = transform ? transform(raw) : raw;
    if (optional && (value === null || value === "")) {
      value = OPTIONAL_SELECT_NONE as PathValue<TFieldValues, typeof field>;
    }
    form.setValue(field, value as PathValue<TFieldValues, typeof field>);
  }
}

export function useApplyComposeDefaults<
  TFieldValues extends FieldValues,
  TDefaults extends Record<string, unknown>,
>({
  form,
  defaults,
  fieldMap,
  isEdit,
  disabled,
  dirtyFieldsRef,
}: {
  form: UseFormReturn<TFieldValues>;
  defaults: TDefaults | null | undefined;
  fieldMap: ComposeFieldMap<TFieldValues, TDefaults>;
  isEdit: boolean;
  disabled?: boolean;
  dirtyFieldsRef?: React.MutableRefObject<Set<string> | Set<unknown>>;
}) {
  const appliedKey = useRef<string | null>(null);

  useEffect(() => {
    if (!defaults || isEdit || disabled) {
      return;
    }
    const signature = JSON.stringify(defaults);
    if (appliedKey.current === signature) {
      return;
    }
    appliedKey.current = signature;

    applyComposeDefaultsFromMap({ form, defaults, fieldMap, dirtyFieldsRef });
  }, [defaults, disabled, fieldMap, form, isEdit, dirtyFieldsRef]);
}
