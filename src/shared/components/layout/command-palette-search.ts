import type { NavigationGroup, NavigationItem } from "@/config/navigation";

export type CommandPaletteItem = {
  group: string;
  item: NavigationItem;
};

export function filterCommandItems(
  query: string,
  groups: readonly NavigationGroup[],
): CommandPaletteItem[] {
  const needle = query.trim().toLowerCase();
  const items = groups.flatMap((group) =>
    group.items.map((item) => ({ group: group.label, item })),
  );
  if (!needle) {
    return items;
  }
  return items.filter(
    ({ group, item }) =>
      item.label.toLowerCase().includes(needle) ||
      group.toLowerCase().includes(needle) ||
      item.href.toLowerCase().includes(needle),
  );
}

export function groupCommandItems(items: CommandPaletteItem[]): Array<{
  group: string;
  items: CommandPaletteItem[];
}> {
  const grouped: Array<{ group: string; items: CommandPaletteItem[] }> = [];
  for (const item of items) {
    const last = grouped[grouped.length - 1];
    if (last && last.group === item.group) {
      last.items.push(item);
    } else {
      grouped.push({ group: item.group, items: [item] });
    }
  }
  return grouped;
}
