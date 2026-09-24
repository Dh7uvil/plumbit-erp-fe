import { describe, expect, it } from "vitest";

import { filterCommandItems } from "@/shared/components/layout/command-palette-search";
import { searchableNavigation } from "@/config/navigation";

describe("command palette docs search", () => {
  it("finds documentation by keyword", () => {
    const groups = searchableNavigation([]);
    const items = filterCommandItems("grni", groups);
    expect(items.some(({ item }) => item.href.includes("/docs/"))).toBe(true);
  });
});
