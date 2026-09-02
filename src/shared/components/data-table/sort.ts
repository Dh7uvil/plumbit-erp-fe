import type { SortOrder } from "@/shared/hooks/use-table-params";

export type SortFieldOption = {
  value: string;
  label: string;
};

export type SortPatch = {
  sort_by: string | null;
  sort_order: SortOrder | null;
};

export function toggleSort(
  sortBy: string | undefined,
  sortOrder: SortOrder | undefined,
  field: string,
): SortPatch {
  if (sortBy !== field) {
    return { sort_by: field, sort_order: "asc" };
  }
  if (sortOrder === "asc") {
    return { sort_by: field, sort_order: "desc" };
  }
  return { sort_by: null, sort_order: null };
}
