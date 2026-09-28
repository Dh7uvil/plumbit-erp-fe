"use client";

import { useMemo } from "react";

import { useAllUsers } from "@/modules/users-management/users/queries";
import { MultiSelect } from "@/shared/components/ui/multi-select";
import { cn } from "@/shared/lib/cn";

const UNASSIGNED_VALUE = "unassigned";

export function TaskAssigneeFilter({
  assigneeIds,
  unassigned,
  onAssigneeChange,
  className,
}: {
  assigneeIds: string[];
  unassigned: boolean;
  onAssigneeChange: (next: { assigneeIds: string[]; unassigned: boolean }) => void;
  className?: string;
}) {
  const usersQuery = useAllUsers();
  const users = usersQuery.data ?? [];

  const options = useMemo(
    () => [
      { value: UNASSIGNED_VALUE, label: "Unassigned" },
      ...users.map((user) => ({
        value: user.id,
        label: user.name || user.email,
      })),
    ],
    [users],
  );

  const value = useMemo(
    () => [...(unassigned ? [UNASSIGNED_VALUE] : []), ...assigneeIds],
    [assigneeIds, unassigned],
  );

  return (
    <MultiSelect
      className={cn("h-8 w-44 shrink-0", className)}
      placeholder="Assignee"
      options={options}
      value={value}
      onValueChange={(next) =>
        onAssigneeChange({
          unassigned: next.includes(UNASSIGNED_VALUE),
          assigneeIds: next.filter((item) => item !== UNASSIGNED_VALUE),
        })
      }
    />
  );
}
