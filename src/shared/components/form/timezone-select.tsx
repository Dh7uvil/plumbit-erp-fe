"use client";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { SearchableSelect } from "@/shared/components/form/searchable-select";
import { TIMEZONE_OPTIONS, timezoneOption } from "@/shared/lib/timezones";

export function TimezoneSelect({
  value,
  onValueChange,
  disabled,
  placeholder = "Select timezone",
  allowEmpty = false,
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  allowEmpty?: boolean;
  className?: string;
}) {
  const selected = value.trim();
  const hasOption = TIMEZONE_OPTIONS.some((option) => option.value === selected);
  const extra = selected && !hasOption ? timezoneOption(selected) : null;
  const options = [
    ...(allowEmpty ? [{ value: OPTIONAL_SELECT_NONE, label: "None" }] : []),
    ...(extra ? [extra] : []),
    ...TIMEZONE_OPTIONS,
  ];

  return (
    <SearchableSelect
      value={selected || (allowEmpty ? OPTIONAL_SELECT_NONE : "")}
      onValueChange={(next) => {
        if (next === OPTIONAL_SELECT_NONE) {
          if (allowEmpty) {
            onValueChange("");
          }
          return;
        }
        onValueChange(next);
      }}
      options={options}
      disabled={disabled}
      placeholder={placeholder}
      searchPlaceholder="Search timezone…"
      className={className}
    />
  );
}
