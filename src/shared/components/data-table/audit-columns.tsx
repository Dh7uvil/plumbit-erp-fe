"use client";

import { useMemo } from "react";

import { userPermissions } from "@/modules/users-management/users/permissions";
import { useAllUsers } from "@/modules/users-management/users/queries";
import type { DataTableColumn } from "@/shared/components/data-table/columns";
import { formatDateTime } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

export function useUserNameMap() {
  const can = useCan();
  const query = useAllUsers(can(userPermissions.read));
  return useMemo(() => {
    const map = new Map<string, string>();
    for (const user of query.data ?? []) {
      map.set(user.id, user.name);
    }
    return map;
  }, [query.data]);
}

export function auditTimestampColumns<
  T extends { created_at: string; updated_at?: string | null },
>(options?: { createdAt?: boolean }): Array<DataTableColumn<T>> {
  const columns: Array<DataTableColumn<T>> = [];
  if (options?.createdAt !== false) {
    columns.push({
      id: "created_at",
      header: "Created",
      defaultVisible: false,
      className: "text-muted-foreground text-xs",
      cell: (row) => formatDateTime(row.created_at),
    });
  }
  columns.push({
    id: "updated_at",
    header: "Updated",
    defaultVisible: false,
    className: "text-muted-foreground text-xs",
    cell: (row) => formatDateTime(row.updated_at),
  });
  return columns;
}

export function auditActorColumns<
  T extends { created_by?: string | null; updated_by?: string | null },
>(userNameById: Map<string, string>): Array<DataTableColumn<T>> {
  return [
    {
      id: "created_by",
      header: "Created by",
      defaultVisible: false,
      cell: (row) => (row.created_by ? (userNameById.get(row.created_by) ?? "—") : "—"),
    },
    {
      id: "updated_by",
      header: "Updated by",
      defaultVisible: false,
      cell: (row) => (row.updated_by ? (userNameById.get(row.updated_by) ?? "—") : "—"),
    },
  ];
}
