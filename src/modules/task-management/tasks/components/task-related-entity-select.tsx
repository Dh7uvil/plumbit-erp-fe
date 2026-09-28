"use client";

import type { TaskRelatedEntityType } from "@/modules/task-management/tasks/schemas";
import { useTaskRelatedEntityOptions } from "@/modules/task-management/tasks/use-task-related-entity-options";
import { SearchableSelect } from "@/shared/components/form/searchable-select";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function TaskRelatedEntitySelect({
  entityType,
  value,
  onValueChange,
  disabled = false,
}: {
  entityType: TaskRelatedEntityType | null;
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}) {
  const optionsQuery = useTaskRelatedEntityOptions(entityType, Boolean(entityType) && !disabled);

  if (!entityType) {
    return (
      <SearchableSelect
        value=""
        onValueChange={onValueChange}
        options={[]}
        disabled
        placeholder="Select a record type first"
      />
    );
  }

  if (optionsQuery.isLoading) {
    return <Skeleton className="h-9 w-full" />;
  }

  return (
    <SearchableSelect
      value={value}
      onValueChange={onValueChange}
      options={optionsQuery.data ?? []}
      disabled={disabled || optionsQuery.isError}
      placeholder={
        optionsQuery.isError
          ? "Could not load records"
          : `Search ${entityType.replaceAll("_", " ")}s`
      }
      searchable
    />
  );
}
