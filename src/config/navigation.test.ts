import { describe, expect, it } from "vitest";

import { visibleNavigation } from "@/config/navigation";

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
});
