import type { TableParamPatch } from "@/shared/hooks/use-table-params";
import { formatDate } from "@/shared/lib/format";

export type FilterOptionSpec = {
  type: "option";
  key: string;
  label: string;
  options: Array<{ value: string; label: string }>;
};

export type FilterTextSpec = {
  type: "text";
  source: "search" | { filterKey: string };
  label: string;
};

export type FilterDateRangeSpec = {
  type: "dateRange";
  fromKey: string;
  toKey: string;
  label: string;
};

export type FilterFlagSpec = {
  type: "flag";
  key: string;
  label: string;
  matchValue?: string;
};

export type FilterMultiSpec = {
  type: "multi";
  key: string;
  parse: (value: string | undefined) => string[];
  serialize: (values: string[]) => string | undefined;
  labelFor: (id: string) => string;
  /** When set, pills use "Field: value"; otherwise value only (e.g. task types). */
  fieldLabel?: string;
};

export type FilterSpec =
  | FilterOptionSpec
  | FilterTextSpec
  | FilterDateRangeSpec
  | FilterFlagSpec
  | FilterMultiSpec;

export type AppliedFilterItem = {
  id: string;
  label: string;
  removePatch: TableParamPatch;
};

export function formatFilterDateRange(from?: string, to?: string): string {
  if (from && to) {
    return `${formatDate(from)} – ${formatDate(to)}`;
  }
  if (from) {
    return `From ${formatDate(from)}`;
  }
  if (to) {
    return `To ${formatDate(to)}`;
  }
  return "";
}

function optionLabel(spec: FilterOptionSpec, raw: string): string {
  return spec.options.find((option) => option.value === raw)?.label ?? raw;
}

export function buildAppliedFilterItems(
  search: string | undefined,
  filters: Record<string, string>,
  specs: FilterSpec[],
): AppliedFilterItem[] {
  const items: AppliedFilterItem[] = [];

  for (const spec of specs) {
    switch (spec.type) {
      case "text": {
        if (spec.source === "search") {
          const value = search?.trim();
          if (!value) {
            break;
          }
          items.push({
            id: "search",
            label: `${spec.label}: ${value}`,
            removePatch: { search: null, page: 1 },
          });
          break;
        }
        const value = filters[spec.source.filterKey]?.trim();
        if (!value) {
          break;
        }
        items.push({
          id: `text:${spec.source.filterKey}`,
          label: `${spec.label}: ${value}`,
          removePatch: { filters: { [spec.source.filterKey]: null }, page: 1 },
        });
        break;
      }
      case "option": {
        const raw = filters[spec.key];
        if (!raw) {
          break;
        }
        items.push({
          id: `option:${spec.key}`,
          label: `${spec.label}: ${optionLabel(spec, raw)}`,
          removePatch: { filters: { [spec.key]: null }, page: 1 },
        });
        break;
      }
      case "dateRange": {
        const from = filters[spec.fromKey];
        const to = filters[spec.toKey];
        if (!from && !to) {
          break;
        }
        items.push({
          id: `date:${spec.fromKey}:${spec.toKey}`,
          label: `${spec.label}: ${formatFilterDateRange(from, to)}`,
          removePatch: {
            filters: { [spec.fromKey]: null, [spec.toKey]: null },
            page: 1,
          },
        });
        break;
      }
      case "flag": {
        const match = spec.matchValue ?? "1";
        if (filters[spec.key] !== match) {
          break;
        }
        items.push({
          id: `flag:${spec.key}`,
          label: spec.label,
          removePatch: { filters: { [spec.key]: null }, page: 1 },
        });
        break;
      }
      case "multi": {
        const values = spec.parse(filters[spec.key]);
        for (const value of values) {
          const valueLabel = spec.labelFor(value);
          const label = spec.fieldLabel ? `${spec.fieldLabel}: ${valueLabel}` : valueLabel;
          items.push({
            id: `multi:${spec.key}:${value}`,
            label,
            removePatch: {
              filters: {
                [spec.key]: spec.serialize(values.filter((item) => item !== value)) ?? null,
              },
              page: 1,
            },
          });
        }
        break;
      }
      default:
        break;
    }
  }

  return items;
}

export function filterClearPatchFromSpecs(
  specs: FilterSpec[],
  options?: { includeSearch?: boolean },
): TableParamPatch {
  const includeSearch = options?.includeSearch ?? true;
  const filters: Record<string, null> = {};

  for (const spec of specs) {
    switch (spec.type) {
      case "option":
      case "flag":
      case "multi":
        filters[spec.key] = null;
        break;
      case "dateRange":
        filters[spec.fromKey] = null;
        filters[spec.toKey] = null;
        break;
      case "text":
        if (spec.source !== "search") {
          filters[spec.source.filterKey] = null;
        }
        break;
      default:
        break;
    }
  }

  return {
    ...(includeSearch ? { search: null } : {}),
    filters,
    page: 1,
  };
}

export function enumFilterOptions<T extends string>(
  values: readonly T[],
  labels: Record<T, string>,
): Array<{ value: string; label: string }> {
  return values.map((value) => ({ value, label: labels[value] }));
}
