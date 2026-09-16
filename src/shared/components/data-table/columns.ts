import type { ReactNode } from "react";

export type TableColumnPreference = {
  visible_columns: string[];
  column_order: string[];
  is_default: boolean;
};

export type DataTableColumn<T> = {
  id: string;
  header: string;
  defaultVisible?: boolean;
  locked?: boolean;
  sticky?: "right";
  sortableField?: string;
  className?: string;
  headerClassName?: string;
  hideable?: boolean;
  cell: (row: T) => ReactNode;
};

export type ColumnPreferencePatch = {
  visible_columns: string[];
  column_order: string[];
};

export type ColumnPickerItem = {
  id: string;
  header: string;
  visible: boolean;
  extra: boolean;
  pinned: boolean;
};

export const stickyActionsHeadClass =
  "sticky right-0 z-20 bg-card shadow-[-2px_0_6px_-2px_rgba(0,0,0,0.18)]";
export const stickyActionsCellClass =
  "sticky right-0 z-10 bg-card group-hover:bg-muted/50 shadow-[-2px_0_6px_-2px_rgba(0,0,0,0.18)]";

export function actionsColumn<T>(
  show: boolean,
  cell: (row: T) => ReactNode,
): Array<DataTableColumn<T>> {
  if (!show) {
    return [];
  }
  return [
    {
      id: "actions",
      header: "Actions",
      locked: true,
      sticky: "right",
      hideable: false,
      cell,
    },
  ];
}

export function omitColumnIds<T>(
  defs: readonly DataTableColumn<T>[],
  ids: readonly string[] = [],
): Array<DataTableColumn<T>> {
  if (ids.length === 0) {
    return [...defs];
  }
  const skip = new Set(ids);
  return defs.filter((column) => !skip.has(column.id));
}

export function customizableColumns<T>(
  defs: readonly DataTableColumn<T>[],
): Array<DataTableColumn<T>> {
  return defs.filter((column) => !column.locked);
}

export function defaultColumnPreference<T>(
  defs: readonly DataTableColumn<T>[],
): ColumnPreferencePatch {
  const customizable = customizableColumns(defs);
  return {
    visible_columns: customizable
      .filter((column) => column.defaultVisible !== false)
      .map((column) => column.id),
    column_order: customizable.map((column) => column.id),
  };
}

export function pinnedColumnIds<T>(defs: readonly DataTableColumn<T>[]): string[] {
  return defaultColumnPreference(defs).visible_columns.slice(0, 2);
}

function applyPinnedColumns(
  visible: string[],
  order: string[],
  pinned: readonly string[],
): { visible: string[]; order: string[] } {
  const pinnedSet = new Set(pinned);
  return {
    visible: [...pinned, ...visible.filter((id) => !pinnedSet.has(id))],
    order: [...pinned, ...order.filter((id) => !pinnedSet.has(id))],
  };
}

export function columnPickerDraft<T>(
  defs: readonly DataTableColumn<T>[],
  preference: TableColumnPreference | null | undefined,
): ColumnPickerItem[] {
  const customizable = customizableColumns(defs);
  const defaults = defaultColumnPreference(defs);
  const pinned = pinnedColumnIds(defs);
  const pinnedSet = new Set(pinned);
  const known = new Map(customizable.map((column) => [column.id, column]));
  const savedOrder = (preference?.column_order ?? []).filter((id) => known.has(id));
  const order = applyPinnedColumns(
    [],
    [
      ...savedOrder,
      ...defaults.column_order.filter((id) => !savedOrder.includes(id)),
    ],
    pinned,
  ).order;
  const visible = new Set(preference?.visible_columns ?? defaults.visible_columns);
  for (const id of pinned) {
    visible.add(id);
  }
  return order.flatMap((id) => {
    const column = known.get(id);
    if (!column) {
      return [];
    }
    return [
      {
        id,
        header: column.header,
        visible: visible.has(id),
        extra: column.defaultVisible === false,
        pinned: pinnedSet.has(id),
      },
    ];
  });
}

export function resolveTableColumns<T>(
  defs: readonly DataTableColumn<T>[],
  preference: TableColumnPreference | null | undefined,
): Array<DataTableColumn<T>> {
  const byId = new Map(defs.map((column) => [column.id, column]));
  const locked = defs.filter((column) => column.locked);
  const customizable = customizableColumns(defs);
  const known = new Set(customizable.map((column) => column.id));
  const defaults = defaultColumnPreference(defs);
  const pinned = pinnedColumnIds(defs);

  const savedOrder = (preference?.column_order ?? []).filter((id) => known.has(id));
  const missing = defaults.column_order.filter((id) => !savedOrder.includes(id));
  const rawOrder = preference ? [...savedOrder, ...missing] : defaults.column_order;

  const savedVisible = (preference?.visible_columns ?? []).filter((id) => known.has(id));
  const rawVisible =
    preference && savedVisible.length > 0 ? savedVisible : defaults.visible_columns;

  const pinnedPreference = applyPinnedColumns(rawVisible, rawOrder, pinned);
  const visibleIds = new Set(pinnedPreference.visible);

  const visible = pinnedPreference.order
    .filter((id) => visibleIds.has(id))
    .map((id) => byId.get(id))
    .filter((column): column is DataTableColumn<T> => Boolean(column));

  return [...visible, ...locked];
}
