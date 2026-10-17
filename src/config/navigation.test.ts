import { describe, expect, it } from "vitest";

import { navigation, visibleNavigation } from "@/config/navigation";

describe("visibleNavigation", () => {
  it("always includes Settings for authenticated users", () => {
    const groups = visibleNavigation([]);
    expect(groups.map((group) => group.label)).toContain("Settings");
    expect(groups.map((group) => group.label)).not.toContain("Administration");
    const settings = groups.find((group) => group.label === "Settings");
    expect(settings?.items.map((item) => item.label)).toEqual([
      "My Profile",
      "Change Password",
      "Notification Settings",
    ]);
  });

  it("always includes Documentation after Administration in config order", () => {
    const labels = navigation.map((g) => g.label);
    const adminIndex = labels.indexOf("Administration");
    const docsIndex = labels.indexOf("Documentation");
    expect(docsIndex).toBeGreaterThan(adminIndex);
  });

  it("shows Documentation for users with no permissions", () => {
    const groups = visibleNavigation([]);
    expect(groups.map((g) => g.label)).toContain("Documentation");
    const docs = groups.find((g) => g.label === "Documentation");
    expect(docs?.items.every((i) => i.permission === null)).toBe(true);
  });

  it("groups Inventory and Accounting nav items with legacy subsections", () => {
    const inventory = navigation.find((g) => g.label === "Inventory");
    expect(inventory?.items.some((i) => i.subsection === "Item masters")).toBe(true);
    const accounting = navigation.find((g) => g.label === "Accounting");
    expect(accounting?.items.some((i) => i.subsection === "Ledger")).toBe(true);
    const sales = navigation.find((g) => g.label === "Sales");
    expect(sales?.items.some((i) => i.subsection === "Documents")).toBe(true);
    const purchases = navigation.find((g) => g.label === "Purchases");
    expect(purchases?.items.some((i) => i.subsection === "Returns")).toBe(true);
  });
});
