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
});
