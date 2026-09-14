import { describe, expect, it } from "vitest";
import { LayoutDashboard, Users } from "lucide-react";

import {
  filterCommandItems,
  groupCommandItems,
} from "@/shared/components/layout/command-palette-search";
import type { NavigationGroup } from "@/config/navigation";

const groups: NavigationGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/", permission: null, icon: LayoutDashboard }],
  },
  {
    label: "CRM",
    items: [{ label: "Customers", href: "/customers", permission: null, icon: Users }],
  },
];

describe("filterCommandItems", () => {
  it("returns all items for an empty query", () => {
    expect(filterCommandItems("", groups)).toHaveLength(2);
  });

  it("matches labels, groups, and paths", () => {
    expect(filterCommandItems("cust", groups).map((row) => row.item.label)).toEqual(["Customers"]);
    expect(filterCommandItems("crm", groups).map((row) => row.item.label)).toEqual(["Customers"]);
    expect(filterCommandItems("/customers", groups)).toHaveLength(1);
  });
});

describe("groupCommandItems", () => {
  it("keeps group order", () => {
    expect(groupCommandItems(filterCommandItems("", groups)).map((row) => row.group)).toEqual([
      "Overview",
      "CRM",
    ]);
  });
});
